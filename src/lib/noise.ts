/**
 * Seeded 3D gradient noise, plus fractal octaves.
 *
 * Everything edible in the tray gets its silhouette from this. A sphere reads
 * as a sphere; a sphere displaced by three octaves of noise reads as a broccoli
 * floret, because real food has no perfectly smooth surfaces.
 */

const GRAD = [
  [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
  [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
  [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
];

function buildPermutation(seed: number): Uint8Array {
  const p = new Uint8Array(512);
  const source = new Uint8Array(256);
  for (let i = 0; i < 256; i++) source[i] = i;

  // Deterministic Fisher Yates so a given seed always produces the same shape.
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    const tmp = source[i];
    source[i] = source[j];
    source[j] = tmp;
  }
  for (let i = 0; i < 512; i++) p[i] = source[i & 255];
  return p;
}

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a: number, b: number, t: number) => a + t * (b - a);

function dot(g: number[], x: number, y: number, z: number) {
  return g[0] * x + g[1] * y + g[2] * z;
}

export class Noise3D {
  private p: Uint8Array;

  constructor(seed: number) {
    this.p = buildPermutation(seed);
  }

  /** Classic Perlin gradient noise, output roughly in [-1, 1]. */
  at(x: number, y: number, z: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const zf = z - Math.floor(z);
    const u = fade(xf);
    const v = fade(yf);
    const w = fade(zf);
    const p = this.p;

    const A = p[X] + Y;
    const AA = p[A] + Z;
    const AB = p[A + 1] + Z;
    const B = p[X + 1] + Y;
    const BA = p[B] + Z;
    const BB = p[B + 1] + Z;

    const g = (h: number) => GRAD[h % 12];

    return lerp(
      lerp(
        lerp(dot(g(p[AA]), xf, yf, zf), dot(g(p[BA]), xf - 1, yf, zf), u),
        lerp(dot(g(p[AB]), xf, yf - 1, zf), dot(g(p[BB]), xf - 1, yf - 1, zf), u),
        v,
      ),
      lerp(
        lerp(dot(g(p[AA + 1]), xf, yf, zf - 1), dot(g(p[BA + 1]), xf - 1, yf, zf - 1), u),
        lerp(dot(g(p[AB + 1]), xf, yf - 1, zf - 1), dot(g(p[BB + 1]), xf - 1, yf - 1, zf - 1), u),
        v,
      ),
      w,
    );
  }

  /** Sum of octaves. Large lumps plus fine bumps, which is what food looks like. */
  fractal(x: number, y: number, z: number, octaves = 3, lacunarity = 2.2, gain = 0.5): number {
    let amp = 1;
    let freq = 1;
    let sum = 0;
    let norm = 0;
    for (let i = 0; i < octaves; i++) {
      sum += this.at(x * freq, y * freq, z * freq) * amp;
      norm += amp;
      amp *= gain;
      freq *= lacunarity;
    }
    return sum / norm;
  }
}
