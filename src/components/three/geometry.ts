import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CapsuleGeometry,
  Color,
  ExtrudeGeometry,
  IcosahedronGeometry,
  Object3D,
  Path,
  RepeatWrapping,
  Shape,
  SphereGeometry,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { Noise3D } from "@/lib/noise";
import { mulberry32 } from "@/lib/rand";

/**
 * Every geometry and texture here is cached at module level. The hero canvas
 * and the scroll canvas render the same meal, so without a cache the whole
 * tray was built twice on the main thread during page load; with it, the
 * second canvas reuses every buffer and mounts in milliseconds.
 */
const geoCache = new Map<string, BufferGeometry>();
const texCache = new Map<string, CanvasTexture>();

function cachedGeo<T extends BufferGeometry>(key: string, make: () => T): T {
  let geo = geoCache.get(key);
  if (!geo) {
    geo = make();
    geoCache.set(key, geo);
  }
  return geo as T;
}

function cachedTex(key: string, make: () => CanvasTexture): CanvasTexture {
  let tex = texCache.get(key);
  if (!tex) {
    tex = make();
    texCache.set(key, tex);
  }
  return tex;
}

/**
 * Procedural geometry for the tray and its contents.
 *
 * Nothing here is a bare primitive by the time it reaches the scene. Every
 * edible surface is displaced by fractal noise and every geometry carries
 * smoothed normals, because a perfectly smooth sphere is the single strongest
 * signal that something was made by a computer rather than a kitchen.
 */

/** Pushes vertices along their own normal by fractal noise. */
function displace(
  geo: BufferGeometry,
  noise: Noise3D,
  { amp, freq, octaves = 3, bias = 0 }: { amp: number; freq: number; octaves?: number; bias?: number },
) {
  const pos = geo.attributes.position;
  const nrm = geo.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const n = noise.fractal(x * freq, y * freq, z * freq, octaves) + bias;
    const nx = nrm ? nrm.getX(i) : x;
    const ny = nrm ? nrm.getY(i) : y;
    const nz = nrm ? nrm.getZ(i) : z;
    const len = Math.hypot(nx, ny, nz) || 1;
    pos.setXYZ(i, x + (nx / len) * n * amp, y + (ny / len) * n * amp, z + (nz / len) * n * amp);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/**
 * Writes a colour per vertex. This is what separates rendered food from
 * plastic: cooked food is never one colour, and the variation follows the
 * geometry (seared outside, pale cut face, char in patches), so it has to be
 * computed from positions and normals rather than painted on as a texture.
 */
function vertexColors(
  geo: BufferGeometry,
  fn: (x: number, y: number, z: number, nx: number, ny: number, nz: number, out: Color) => void,
) {
  const pos = geo.attributes.position;
  const nrm = geo.attributes.normal;
  const colors = new Float32Array(pos.count * 3);
  const c = new Color();
  for (let i = 0; i < pos.count; i++) {
    fn(pos.getX(i), pos.getY(i), pos.getZ(i), nrm.getX(i), nrm.getY(i), nrm.getZ(i), c);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new BufferAttribute(colors, 3));
}

/**
 * A broccoli floret head. Broccoli is close to self similar, so three octaves
 * of noise on a subdivided icosphere gets remarkably close.
 */
export function floretGeometry(radius: number, seed: number, baseHex = "#3E7A22", detail = 4) {
  return cachedGeo(`floret:${radius.toFixed(4)}:${seed}:${baseHex}:${detail}`, () =>
    buildFloret(radius, seed, baseHex, detail),
  );
}

function buildFloret(radius: number, seed: number, baseHex: string, detail: number) {
  const noise = new Noise3D(seed);
  const geo = new IcosahedronGeometry(radius, detail);
  displace(geo, noise, { amp: radius * 0.2, freq: 3.6 / radius, octaves: 3 });
  // Flatten the underside so it sits on the tray instead of floating.
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y < -radius * 0.45) pos.setY(i, -radius * 0.45 + (y + radius * 0.45) * 0.25);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();

  // Broccoli runs from deep bottle green in the crown to olive where a bud
  // catches light, and slightly yellow underneath. One flat green is exactly
  // what made it read as foam.
  const deep = new Color("#17380F");
  const base = new Color(baseHex);
  const olive = new Color("#5F8028");
  const under = new Color("#6E7F42");
  vertexColors(geo, (x, y, z, nx, ny, nz, out) => {
    const m = noise.fractal((x * 11) / radius, (y * 11) / radius, (z * 11) / radius, 3) * 0.5 + 0.5;
    out.copy(deep).lerp(base, smoothstep(0.15, 0.85, m));
    out.lerp(olive, smoothstep(0.62, 1, m) * 0.45);
    if (ny < -0.25) out.lerp(under, Math.min(1, -ny) * 0.6);
    out.multiplyScalar(0.9 + m * 0.2);
  });
  return geo;
}

/** Tapered stalk under a floret. */
export function stalkGeometry(radius: number, height: number, seed: number) {
  return cachedGeo(`stalk:${radius.toFixed(4)}:${height.toFixed(4)}:${seed}`, () => {
    const noise = new Noise3D(seed);
    const geo = new CapsuleGeometry(radius, height, 4, 10);
    displace(geo, noise, { amp: radius * 0.13, freq: 9 / radius, octaves: 2 });
    return geo;
  });
}

/**
 * One grain of rice. Instanced a few hundred times, so it stays cheap while
 * the bed reads as individual grains rather than a mound of spheres.
 */
export function riceGrainGeometry() {
  return cachedGeo("riceGrain", () => {
    const geo = new CapsuleGeometry(0.019, 0.036, 2, 6);
    geo.scale(1, 1, 0.82);
    return geo;
  });
}

/**
 * A slice of cooked protein. Built from an irregular closed spline rather than
 * a box, so the silhouette has the asymmetry a knife leaves.
 */
export function sliceGeometry(
  width: number,
  length: number,
  thickness: number,
  seed: number,
  baseHex = "#C98F45",
) {
  return cachedGeo(`slice:${width.toFixed(4)}:${length.toFixed(4)}:${thickness}:${seed}:${baseHex}`, () =>
    buildSlice(width, length, thickness, seed, baseHex),
  );
}

function buildSlice(width: number, length: number, thickness: number, seed: number, baseHex: string) {
  const noise = new Noise3D(seed);
  const shape = new Shape();
  const steps = 32;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const wobble = 1 + noise.fractal(Math.cos(t) * 1.6, Math.sin(t) * 1.6, seed * 0.01, 2) * 0.16;
    const x = Math.cos(t) * (width / 2) * wobble;
    const y = Math.sin(t) * (length / 2) * wobble;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  const geo = new ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: thickness * 0.42,
    bevelSize: thickness * 0.38,
    bevelSegments: 3,
    curveSegments: 14,
  });
  geo.center();
  geo.rotateX(-Math.PI / 2);
  displace(geo, noise, { amp: thickness * 0.2, freq: 5, octaves: 3 });

  // A slice of grilled chicken is three colours, not one: the broad faces are
  // the pale interior the knife exposed, the rim is the seared exterior, and
  // the sear carries near black char in patches. Split by normal direction.
  const base = new Color(baseHex);
  const face = base.clone().lerp(new Color("#F2DCA9"), 0.5);
  const rim = base.clone().lerp(new Color("#5E2F0F"), 0.52);
  const golden = new Color("#B7712A");
  const sear = new Color("#7A3E12");
  const char = new Color("#221108");
  vertexColors(geo, (x, y, z, nx, ny, nz, out) => {
    const facing = smoothstep(0.35, 0.8, Math.abs(ny));
    out.copy(rim).lerp(face, facing);
    // Golden band where the sear grades into the cut face. This gradient is
    // what says "cooked": raw or fake meat jumps straight from pale to brown.
    out.lerp(golden, (1 - Math.abs(facing - 0.5) * 2) * 0.45);
    // The seared long edge: the breast's original surface, so it wraps a
    // little way onto the cut face rather than stopping at the silhouette.
    const edge = smoothstep(-length * 0.18, -length * 0.42, z);
    if (edge > 0) {
      const wobble = noise.at(x * 5, y * 5, z * 5) * 0.18;
      out.lerp(sear, Math.min(1, edge * (1.0 + wobble)));
      const stripe = noise.fractal(x * 12 + 9, y * 4, z * 4, 2);
      if (stripe > 0.14) out.lerp(char, Math.min(1, (stripe - 0.14) * 2.2) * edge);
    }
    // Broad browning across the cut face. Without this the top of every slice
    // is one flat tan and the fan reads as a loaf of bread.
    const bake = noise.fractal(x * 3.2, y * 3.2, z * 3.2, 3) * 0.5 + 0.5;
    out.lerp(golden, facing * smoothstep(0.45, 1, bake) * 0.55);
    // Fibres: fine streaks running across the cut face.
    const fibre = noise.at(x * 2.4, y * 3, z * 26) * 0.5 + 0.5;
    out.multiplyScalar(0.95 + facing * fibre * 0.09);
    // Char: patches on the plain rim too.
    const patch = noise.fractal(x * 7 + 40, y * 7, z * 7, 2);
    if (facing < 0.4 && patch > 0.2) out.lerp(char, Math.min(1, (patch - 0.2) * 2.4));
    // Browning gradient: the rim darkens toward the underside.
    if (ny < -0.2) out.multiplyScalar(0.88);
  });
  return geo;
}

/**
 * The mound the grains sit on. Individual grains floating over a visible floor
 * was half of why the carb compartment looked empty; a filled base with grains
 * scattered on its surface is how a real portion is packed.
 */
export function moundGeometry(radius: number, height: number, seed: number, baseHex = "#DDBC85") {
  return cachedGeo(`mound:${radius}:${height}:${seed}:${baseHex}`, () => buildMound(radius, height, seed, baseHex));
}

function buildMound(radius: number, height: number, seed: number, baseHex: string) {
  const noise = new Noise3D(seed);
  const geo = new SphereGeometry(radius, 30, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  geo.scale(1, height / radius, 0.62);
  displace(geo, noise, { amp: height * 0.16, freq: 3.4 / radius, octaves: 3 });

  const base = new Color(baseHex).multiplyScalar(0.86);
  const light = base.clone().lerp(new Color("#E8D9B4"), 0.4);
  const toast = base.clone().lerp(new Color("#7A4E20"), 0.6);
  vertexColors(geo, (x, y, z, nx, ny, nz, out) => {
    const m = noise.fractal((x * 14) / radius, (y * 14) / radius, (z * 14) / radius, 3) * 0.5 + 0.5;
    out.copy(base).lerp(light, smoothstep(0.4, 1, m));
    if (m < 0.22) out.lerp(toast, 0.7);
  });
  return geo;
}

/** Top surface of the shingled protein slices, for resting garnish on. */
export const sliceTopY = (x: number) => 0.13 + (x + 0.46) * 0.09;

/** Profile of the grain mound, shared by the mound, its grains and garnish. */
export const moundTopY = (x: number, z: number) => {
  const r = Math.min(1, Math.hypot(x, z / 0.62) / 0.42);
  return 0.16 * (1 - r * r) * 0.92 + 0.012;
};

/** Fills a geometry clone with one flat colour so it can join a merged batch. */
function bakeColor(geo: BufferGeometry, color: Color) {
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    arr[i * 3] = color.r;
    arr[i * 3 + 1] = color.g;
    arr[i * 3 + 2] = color.b;
  }
  geo.setAttribute("color", new BufferAttribute(arr, 3));
  return geo;
}

const _obj = new Object3D();

function bakedClone(source: BufferGeometry, color: Color): BufferGeometry {
  const clone = source.clone();
  _obj.updateMatrix();
  clone.applyMatrix4(_obj.matrix);
  return bakeColor(clone, color);
}

/**
 * All the grains of one compartment merged into a single geometry. As separate
 * meshes they were 220 draw calls and 220 matrix updates a frame, which is a
 * measurable slice of the frame budget for something that never moves.
 */
export function mergedGrainsGeometry(baseHex: string, seed: number, radius: number, count = 220) {
  return cachedGeo(`grains:${baseHex}:${seed}:${radius}:${count}`, () => {
    const source = riceGrainGeometry();
    const rng = mulberry32(seed + 5);
    const base = new Color(baseHex);
    const light = base.clone().lerp(new Color("#F4EBD2"), 0.5);
    const toast = base.clone().lerp(new Color("#8A5A28"), 0.6);
    const height = 0.16;
    const parts: BufferGeometry[] = [];
    for (let i = 0; i < count; i++) {
      const a = rng() * Math.PI * 2;
      const r = Math.sqrt(rng()) * radius * 0.94;
      const lift = height * (1 - (r / radius) ** 2);
      _obj.position.set(Math.cos(a) * r, lift * 0.92 + 0.008 + rng() * 0.015, Math.sin(a) * r * 0.62);
      _obj.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
      _obj.scale.setScalar(1.1 + rng() * 0.55);
      const roll = rng();
      const color =
        roll < 0.07 ? toast : roll < 0.24 ? base.clone().lerp(toast, 0.3) : base.clone().lerp(light, rng() * 0.8);
      parts.push(bakedClone(source, color));
    }
    const merged = mergeGeometries(parts, false);
    parts.forEach((p) => p.dispose());
    return merged;
  });
}

/** Herb flecks over a compartment, merged for the same reason. */
export function mergedHerbsGeometry(seed: number, spreadX: number, spreadZ: number, surface: "slices" | "mound") {
  return cachedGeo(`herbs:${seed}:${spreadX}:${spreadZ}:${surface}`, () => {
    const source = new BoxGeometry(0.032, 0.004, 0.02);
    const rng = mulberry32(seed + 777);
    const deep = new Color("#2E5220");
    const bright = new Color("#5C8A33");
    const parts: BufferGeometry[] = [];
    for (let i = 0; i < 13; i++) {
      const x = (rng() - 0.5) * spreadX;
      const z = (rng() - 0.5) * spreadZ;
      _obj.position.set(x, (surface === "slices" ? sliceTopY(x) : moundTopY(x, z)) + 0.012, z);
      _obj.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
      _obj.scale.setScalar(0.75 + rng() * 0.7);
      parts.push(bakedClone(source, deep.clone().lerp(bright, rng())));
    }
    source.dispose();
    const merged = mergeGeometries(parts, false);
    parts.forEach((p) => p.dispose());
    return merged;
  });
}

/** Rounded rectangle path, used for the tray outline and its compartments. */
function roundedRect(w: number, d: number, r: number, PathClass: typeof Shape | typeof Path) {
  const p = new PathClass();
  const x = -w / 2;
  const y = -d / 2;
  p.moveTo(x + r, y);
  p.lineTo(x + w - r, y);
  p.quadraticCurveTo(x + w, y, x + w, y + r);
  p.lineTo(x + w, y + d - r);
  p.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  p.lineTo(x + r, y + d);
  p.quadraticCurveTo(x, y + d, x, y + d - r);
  p.lineTo(x, y + r);
  p.quadraticCurveTo(x, y, x + r, y);
  return p;
}

export type Compartment = { x: number; z: number; w: number; d: number };

/**
 * The tray shell: one extruded slab with the compartments cut clean through it
 * as holes, bevelled on both faces. This is what a thermoformed tray actually
 * is, and modelling it that way gives real compartment walls with a lit rim,
 * instead of dark boxes buried inside a solid block.
 */
export function trayShellGeometry(w: number, d: number, depth: number, compartments: Compartment[]) {
  const key = `shell:${w}:${d}:${depth}:${compartments.map((c) => `${c.x},${c.z},${c.w},${c.d}`).join(";")}`;
  return cachedGeo(key, () => buildShell(w, d, depth, compartments));
}

function buildShell(w: number, d: number, depth: number, compartments: Compartment[]) {
  const outline = roundedRect(w, d, 0.11, Shape) as Shape;
  outline.holes = compartments.map((c) => {
    const hole = roundedRect(c.w, c.d, 0.06, Path) as Path;
    hole.curves.forEach(() => undefined);
    // Path is built around the origin, so translate it into position.
    const translated = new Path();
    const pts = hole.getPoints(60);
    pts.forEach((p, i) => {
      const x = p.x + c.x;
      const y = p.y - c.z;
      if (i === 0) translated.moveTo(x, y);
      else translated.lineTo(x, y);
    });
    translated.closePath();
    return translated;
  });

  const geo = new ExtrudeGeometry(outline, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.022,
    bevelSize: 0.022,
    bevelSegments: 4,
    curveSegments: 20,
  });
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

/** The closed base the food sits on. */
export function trayBaseGeometry(w: number, d: number, h: number) {
  return cachedGeo(`base:${w}:${d}:${h}`, () => buildBase(w, d, h));
}

function buildBase(w: number, d: number, h: number) {
  const shape = roundedRect(w, d, 0.11, Shape) as Shape;
  const geo = new ExtrudeGeometry(shape, {
    depth: h,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.018,
    bevelSegments: 3,
    curveSegments: 20,
  });
  geo.rotateX(-Math.PI / 2);
  return geo;
}

/** Sealed film, with the slack and wrinkles a heat seal leaves behind. */
export function filmGeometry(w: number, d: number, seed: number, segments = 56) {
  return cachedGeo(`film:${w}:${d}:${seed}:${segments}`, () => buildFilm(w, d, seed, segments));
}

function buildFilm(w: number, d: number, seed: number, segments: number) {
  const noise = new Noise3D(seed);
  const geo = new BoxGeometry(w, 0.012, d, segments, 1, Math.round(segments * 0.78));
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    // Slack in the middle, pulled taut at the sealed edge.
    const edge = Math.max(Math.abs(x) / (w / 2), Math.abs(z) / (d / 2));
    const slack = Math.max(0, 1 - Math.pow(edge, 3));
    const wrinkle = noise.fractal(x * 3.1, z * 3.1, seed * 0.1, 3) * 0.02;
    if (y > 0) pos.setY(i, y + slack * 0.03 + wrinkle * slack);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/* ------------------------------------------------------------- textures --- */

/** Fine grained roughness variation. Kills the injection moulded plastic look. */
export function microNormalTexture(size = 256, strength = 0.5) {
  return cachedTex(`micro:${size}:${strength}`, () => buildMicroNormal(size, strength));
}

function buildMicroNormal(size: number, strength: number) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  const noise = new Noise3D(4242);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const n = noise.fractal(x * 0.09, y * 0.09, 0, 3) * strength;
      img.data[i] = 128 + n * 127;
      img.data[i + 1] = 128 + noise.fractal(x * 0.09, y * 0.09, 11, 3) * strength * 127;
      img.data[i + 2] = 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  return tex;
}

/**
 * The printed band that runs along the front rim of the lid. Wide and short,
 * because that is the only place on a sealed tray where a label does not sit
 * on top of the food.
 */
export function labelTexture(lines: { kcal: number; protein: number; carbs: number; fat: number; name: string }) {
  return cachedTex(`label:${lines.name}:${lines.kcal}:${lines.protein}:${lines.carbs}:${lines.fat}`, () =>
    buildLabel(lines),
  );
}

function buildLabel(lines: { kcal: number; protein: number; carbs: number; fat: number; name: string }) {
  const w = 2048;
  const h = 288;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#F7F3EA";
  ctx.fillRect(0, 0, w, h);

  // Signal block on the left carries the wordmark.
  ctx.fillStyle = "#D6F84A";
  ctx.fillRect(0, 0, 300, h);
  ctx.fillStyle = "#141110";
  ctx.font = "700 78px -apple-system, Helvetica, Arial, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText("RATIO", 34, h / 2);

  ctx.fillStyle = "#141110";
  ctx.font = "600 62px -apple-system, Helvetica, Arial, sans-serif";
  ctx.fillText(lines.name.slice(0, 24), 350, h / 2 - 34);

  ctx.fillStyle = "#7C736A";
  ctx.font = "500 40px -apple-system, 'Helvetica Neue', Arial, sans-serif";
  ctx.fillText("KEEP AT 3°C  ·  COOKED IN MELBOURNE", 350, h / 2 + 44);

  // Macro block, right aligned.
  const cols: [string, string][] = [
    ["KCAL", String(lines.kcal)],
    ["PROTEIN", `${lines.protein}g`],
    ["CARBS", `${lines.carbs}g`],
    ["FAT", `${lines.fat}g`],
  ];
  cols.forEach(([label, value], i) => {
    const x = 1180 + i * 218;
    ctx.fillStyle = "#8A8078";
    ctx.font = "600 34px -apple-system, 'Helvetica Neue', Arial, sans-serif";
    ctx.fillText(label, x, h / 2 - 42);
    ctx.fillStyle = "#141110";
    ctx.font = "700 76px -apple-system, Helvetica, Arial, sans-serif";
    ctx.fillText(value, x, h / 2 + 34);
  });

  const tex = new CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}

export { SphereGeometry };
