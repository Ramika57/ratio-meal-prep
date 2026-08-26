"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, Group } from "three";
import { mulberry32, seedFrom } from "@/lib/rand";
import {
  filmGeometry,
  floretGeometry,
  labelTexture,
  microNormalTexture,
  riceGrainGeometry,
  sliceGeometry,
  stalkGeometry,
  trayBaseGeometry,
  trayShellGeometry,
  type Compartment,
} from "./geometry";

export type TrayContents = {
  seed: string;
  name: string;
  protein: string;
  carb: string;
  veg: string;
  macros: { kcal: number; protein: number; carbs: number; fat: number };
};

const W = 2.55;
const D = 1.85;
const RIM = 0.15;
const FLOOR = -0.15;
const SHELL_DEPTH = RIM - FLOOR + 0.02;

// Pulled back so the front of the lid has a clear strip for the printed band.
const COMPARTMENTS: Compartment[] = [
  { x: -0.6, z: -0.14, w: 1.16, d: 1.3 },
  { x: 0.62, z: -0.45, w: 1.1, d: 0.58 },
  { x: 0.62, z: 0.17, w: 1.1, d: 0.58 },
];

/* ------------------------------------------------------------------ food -- */

function ProteinSlices({ color, seed }: { color: string; seed: number }) {
  const slices = useMemo(() => {
    const rng = mulberry32(seed);
    return Array.from({ length: 8 }, (_, i) => ({
      geo: sliceGeometry(0.4, 1.0, 0.105, seed + i * 31),
      x: -0.44 + i * 0.125 + (rng() - 0.5) * 0.02,
      z: (rng() - 0.5) * 0.14,
      y: 0.062 + i * 0.014,
      rotY: (rng() - 0.5) * 0.34,
      rotZ: 0.34 + rng() * 0.12,
      tint: 0.86 + rng() * 0.28,
    }));
  }, [seed]);

  const base = useMemo(() => new Color(color), [color]);

  return (
    <group>
      {slices.map((s, i) => (
        <mesh
          key={i}
          geometry={s.geo}
          position={[s.x, s.y, s.z]}
          rotation={[0, s.rotY, s.rotZ]}
          castShadow
          receiveShadow
        >
          <meshPhysicalMaterial
            color={base.clone().multiplyScalar(s.tint)}
            roughness={0.52}
            clearcoat={0.28}
            clearcoatRoughness={0.55}
            sheen={0.5}
            sheenRoughness={0.7}
            sheenColor="#ffd9a8"
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * The grain bed.
 *
 * Written as ordinary meshes over a handful of shared geometries rather than an
 * InstancedMesh. The instanced version rendered nothing: React StrictMode mounts,
 * unmounts and remounts in development, and R3F disposes a <primitive> on that
 * unmount, so the buffers were gone by the time it came back. Sixty meshes over
 * four shared geometries costs little and is not fragile.
 */
function GrainBed({ color, seed, radius = 0.4 }: { color: string; seed: number; radius?: number }) {
  const shapes = useMemo(() => Array.from({ length: 4 }, () => riceGrainGeometry()), []);

  const grains = useMemo(() => {
    const rng = mulberry32(seed);
    const base = new Color(color);
    return Array.from({ length: 110 }, (_, i) => {
      const a = rng() * Math.PI * 2;
      const r = Math.sqrt(rng()) * radius;
      // Mound: highest in the middle, tapering to the compartment wall.
      const fall = 1 - (r / radius) ** 2;
      return {
        geo: shapes[i % shapes.length],
        x: Math.cos(a) * r,
        z: Math.sin(a) * r * 0.52,
        y: 0.03 + rng() * 0.1 * Math.max(0.25, fall),
        rot: [rng() * Math.PI, rng() * Math.PI, rng() * Math.PI] as [number, number, number],
        scale: 1.35 + rng() * 0.75,
        color: base.clone().multiplyScalar(0.86 + rng() * 0.28),
      };
    });
  }, [color, seed, radius, shapes]);

  return (
    <group>
      {grains.map((g, i) => (
        <mesh
          key={i}
          geometry={g.geo}
          position={[g.x, g.y, g.z]}
          rotation={g.rot}
          scale={g.scale}
          castShadow
          receiveShadow
        >
          <meshPhysicalMaterial color={g.color} roughness={0.36} clearcoat={0.45} clearcoatRoughness={0.35} sheen={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function Greens({ color, seed }: { color: string; seed: number }) {
  const florets = useMemo(() => {
    const rng = mulberry32(seed);
    return Array.from({ length: 14 }, (_, i) => {
      const a = rng() * Math.PI * 2;
      const r = Math.sqrt(rng()) * 0.34;
      const size = 0.115 + rng() * 0.06;
      return {
        head: floretGeometry(size, seed + i * 17),
        stalk: stalkGeometry(size * 0.3, size * 0.85, seed + i * 23),
        x: Math.cos(a) * r,
        z: Math.sin(a) * r * 0.6,
        size,
        rot: rng() * Math.PI,
        lean: (rng() - 0.5) * 0.4,
        tint: 0.82 + rng() * 0.4,
      };
    });
  }, [seed]);

  const base = useMemo(() => new Color(color), [color]);

  return (
    <group>
      {florets.map((f, i) => (
        <group key={i} position={[f.x, 0.02, f.z]} rotation={[f.lean, f.rot, f.lean * 0.5]}>
          <mesh geometry={f.stalk} position={[0, f.size * 0.42, 0]} castShadow receiveShadow>
            <meshPhysicalMaterial color="#C9D6A4" roughness={0.62} sheen={0.4} sheenColor="#eaf5c8" />
          </mesh>
          <mesh geometry={f.head} position={[0, f.size * 1.02, 0]} castShadow receiveShadow>
            <meshPhysicalMaterial
              color={base.clone().multiplyScalar(f.tint)}
              roughness={0.74}
              sheen={0.55}
              sheenRoughness={0.5}
              sheenColor="#a8d878"
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ tray -- */

export function MealTray({ contents, lid }: { contents: TrayContents; lid?: () => number }) {
  const lidRef = useRef<Group>(null);
  const seed = seedFrom(contents.seed);

  const shell = useMemo(() => trayShellGeometry(W, D, SHELL_DEPTH, COMPARTMENTS), []);
  const base = useMemo(() => trayBaseGeometry(W - 0.02, D - 0.02, 0.075), []);
  const film = useMemo(() => filmGeometry(W + 0.05, D + 0.05, seed), [seed]);
  const micro = useMemo(() => microNormalTexture(512, 0.35), []);
  const label = useMemo(() => labelTexture({ ...contents.macros, name: contents.name }), [contents]);

  useLayoutEffect(() => {
    micro.repeat.set(6, 4);
  }, [micro]);

  useFrame(() => {
    const g = lidRef.current;
    if (!g) return;
    const v = lid ? lid() : 0;
    g.position.y = RIM + 0.02 + v * 1.05;
    g.rotation.z = -v * 0.3;
    g.rotation.x = v * 0.09;
  });

  return (
    <group>
      {/* Moulded shell with the compartments cut clean through it */}
      <mesh geometry={shell} position={[0, FLOOR - 0.02, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#2E2F33"
          roughness={0.3}
          metalness={0}
          clearcoat={0.4}
          clearcoatRoughness={0.34}
          normalMap={micro}
          normalScale={[0.18, 0.18]}
          reflectivity={0.28}
          sheen={0.15}
          sheenColor="#ffffff"
        />
      </mesh>

      {/* Closed base the food rests on */}
      <mesh geometry={base} position={[0, FLOOR - 0.075, 0]} receiveShadow>
        <meshPhysicalMaterial
          color="#212226"
          roughness={0.42}
          clearcoat={0.5}
          clearcoatRoughness={0.35}
          normalMap={micro}
          normalScale={[0.16, 0.16]}
        />
      </mesh>

      {/* Contents */}
      <group position={[COMPARTMENTS[0].x, FLOOR, COMPARTMENTS[0].z]}>
        <ProteinSlices color={contents.protein} seed={seed} />
      </group>
      <group position={[COMPARTMENTS[1].x, FLOOR, COMPARTMENTS[1].z]}>
        <GrainBed color={contents.carb} seed={seed + 17} radius={0.42} />
      </group>
      <group position={[COMPARTMENTS[2].x, FLOOR, COMPARTMENTS[2].z]}>
        <Greens color={contents.veg} seed={seed + 91} />
      </group>

      {/* Heat sealed film with the slack a real seal leaves */}
      <group ref={lidRef} position={[0, RIM + 0.02, 0]}>
        <mesh geometry={film} castShadow>
          <meshPhysicalMaterial
            color="#ffffff"
            transmission={1}
            thickness={0.015}
            roughness={0.11}
            ior={1.46}
            clearcoat={1}
            clearcoatRoughness={0.05}
            reflectivity={0.42}
            side={2}
          />
        </mesh>
        <mesh position={[0, 0.032, 0.73]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.28, 0.32]} />
          <meshPhysicalMaterial map={label} roughness={0.62} clearcoat={0.3} clearcoatRoughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

