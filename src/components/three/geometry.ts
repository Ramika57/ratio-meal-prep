import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CapsuleGeometry,
  ExtrudeGeometry,
  IcosahedronGeometry,
  Path,
  RepeatWrapping,
  Shape,
  SphereGeometry,
} from "three";
import { Noise3D } from "@/lib/noise";

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

/**
 * A broccoli floret head. Broccoli is close to self similar, so three octaves
 * of noise on a subdivided icosphere gets remarkably close.
 */
export function floretGeometry(radius: number, seed: number) {
  const noise = new Noise3D(seed);
  const geo = new IcosahedronGeometry(radius, 4);
  displace(geo, noise, { amp: radius * 0.34, freq: 7 / radius, octaves: 4 });
  // Flatten the underside so it sits on the tray instead of floating.
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y < -radius * 0.45) pos.setY(i, -radius * 0.45 + (y + radius * 0.45) * 0.25);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Tapered stalk under a floret. */
export function stalkGeometry(radius: number, height: number, seed: number) {
  const noise = new Noise3D(seed);
  const geo = new CapsuleGeometry(radius, height, 6, 16);
  displace(geo, noise, { amp: radius * 0.13, freq: 9 / radius, octaves: 2 });
  return geo;
}

/**
 * One grain of rice. Instanced a few hundred times, so it stays cheap while
 * the bed reads as individual grains rather than a mound of spheres.
 */
export function riceGrainGeometry() {
  const geo = new CapsuleGeometry(0.019, 0.036, 3, 8);
  geo.scale(1, 1, 0.82);
  return geo;
}

/**
 * A slice of cooked protein. Built from an irregular closed spline rather than
 * a box, so the silhouette has the asymmetry a knife leaves.
 */
export function sliceGeometry(width: number, length: number, thickness: number, seed: number) {
  const noise = new Noise3D(seed);
  const shape = new Shape();
  const steps = 48;
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
    bevelSegments: 5,
    curveSegments: 24,
  });
  geo.center();
  geo.rotateX(-Math.PI / 2);
  displace(geo, noise, { amp: thickness * 0.2, freq: 5, octaves: 3 });
  return geo;
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
export function filmGeometry(w: number, d: number, seed: number) {
  const noise = new Noise3D(seed);
  const geo = new BoxGeometry(w, 0.012, d, 90, 1, 70);
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
export function microNormalTexture(size = 512, strength = 0.5) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  const noise = new Noise3D(4242);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const n = noise.fractal(x * 0.09, y * 0.09, 0, 4) * strength;
      img.data[i] = 128 + n * 127;
      img.data[i + 1] = 128 + noise.fractal(x * 0.09, y * 0.09, 11, 4) * strength * 127;
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
  ctx.font = "500 40px ui-monospace, Menlo, monospace";
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
    ctx.font = "500 34px ui-monospace, Menlo, monospace";
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
