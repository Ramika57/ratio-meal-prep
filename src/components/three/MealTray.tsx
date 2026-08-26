"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, Group } from "three";
import { mulberry32, seedFrom } from "@/lib/rand";
import {
  filmGeometry,
  floretGeometry,
  moundGeometry,
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

/** Approximate top surface of the shingled slices, for resting garnish on. */
const sliceTop = (x: number) => 0.13 + (x + 0.46) * 0.09;

/** The grain mound profile used by both the mound and anything resting on it. */
const moundTop = (x: number, z: number) => {
  const r = Math.min(1, Math.hypot(x, z / 0.62) / 0.42);
  return 0.16 * (1 - r * r) * 0.92 + 0.012;
};

function ProteinSlices({ color, seed }: { color: string; seed: number }) {
  const slices = useMemo(() => {
    const rng = mulberry32(seed);
    return Array.from({ length: 8 }, (_, i) => ({
      // Colour is baked into the geometry: pale cut face, seared rim, char,
      // and a seared band along the local -z edge. Keeping rotY small keeps
      // those bands aligned, so the fan carries one browned ridge.
      geo: sliceGeometry(0.36 + rng() * 0.09, 0.9 + rng() * 0.2, 0.12, seed + i * 31, color),
      x: -0.46 + i * 0.118 + (rng() - 0.5) * 0.015,
      z: (rng() - 0.5) * 0.09,
      y: 0.06 + i * 0.011,
      rotY: (rng() - 0.5) * 0.16,
      rotZ: 0.2 + rng() * 0.07,
      warmth: 0.94 + rng() * 0.1,
    }));
  }, [seed, color]);

  return (
    <group>
      {slices.map((sl, i) => (
        <mesh key={i} geometry={sl.geo} position={[sl.x, sl.y, sl.z]} rotation={[0, sl.rotY, sl.rotZ]} castShadow receiveShadow>
          <meshPhysicalMaterial
            vertexColors
            color={new Color(sl.warmth, sl.warmth, sl.warmth * 0.98)}
            roughness={0.44}
            clearcoat={0.5}
            clearcoatRoughness={0.38}
            sheen={0.45}
            sheenRoughness={0.65}
            sheenColor="#ffd9a8"
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * The grain compartment: a coloured mound with individual grains scattered on
 * its surface. Grains alone over a visible floor read as a half empty tray.
 */
function GrainBed({ color, seed, radius = 0.4 }: { color: string; seed: number; radius?: number }) {
  const height = 0.16;
  const mound = useMemo(() => moundGeometry(radius, height, seed, color), [radius, seed, color]);
  const shapes = useMemo(() => Array.from({ length: 4 }, () => riceGrainGeometry()), []);

  const grains = useMemo(() => {
    const rng = mulberry32(seed + 5);
    const base = new Color(color);
    const light = base.clone().lerp(new Color("#F4EBD2"), 0.5);
    const toast = base.clone().lerp(new Color("#8A5A28"), 0.6);
    return Array.from({ length: 220 }, (_, i) => {
      const a = rng() * Math.PI * 2;
      const r = Math.sqrt(rng()) * radius * 0.94;
      // Sit each grain on the mound profile rather than the floor.
      const lift = height * (1 - (r / radius) ** 2);
      const roll = rng();
      return {
        geo: shapes[i % shapes.length],
        x: Math.cos(a) * r,
        z: Math.sin(a) * r * 0.62,
        y: lift * 0.92 + 0.008 + rng() * 0.015,
        rot: [rng() * Math.PI, rng() * Math.PI, rng() * Math.PI] as [number, number, number],
        scale: 1.1 + rng() * 0.55,
        color:
          roll < 0.07 ? toast : roll < 0.24 ? base.clone().lerp(toast, 0.3) : base.clone().lerp(light, rng() * 0.8),
      };
    });
  }, [color, seed, radius, shapes]);

  return (
    <group>
      <mesh geometry={mound} castShadow receiveShadow>
        <meshPhysicalMaterial vertexColors roughness={0.55} clearcoat={0.3} clearcoatRoughness={0.5} sheen={0.25} />
      </mesh>
      {grains.map((gr, i) => (
        <mesh key={i} geometry={gr.geo} position={[gr.x, gr.y, gr.z]} rotation={gr.rot} scale={gr.scale} castShadow receiveShadow>
          <meshPhysicalMaterial color={gr.color} roughness={0.36} clearcoat={0.45} clearcoatRoughness={0.35} sheen={0.3} />
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
        head: floretGeometry(size, seed + i * 17, color),
        stalk: stalkGeometry(size * 0.3, size * 0.85, seed + i * 23),
        x: Math.cos(a) * r,
        z: Math.sin(a) * r * 0.6,
        size,
        rot: rng() * Math.PI,
        lean: (rng() - 0.5) * 0.4,
      };
    });
  }, [seed, color]);

  return (
    <group>
      {florets.map((f, i) => (
        <group key={i} position={[f.x, 0.02, f.z]} rotation={[f.lean, f.rot, f.lean * 0.5]}>
          <mesh geometry={f.stalk} position={[0, f.size * 0.42, 0]} castShadow receiveShadow>
            <meshPhysicalMaterial color="#A9BD7A" roughness={0.66} sheen={0.4} sheenColor="#eaf5c8" />
          </mesh>
          <mesh geometry={f.head} position={[0, f.size * 1.02, 0]} castShadow receiveShadow>
            <meshPhysicalMaterial vertexColors roughness={0.8} sheen={0.4} sheenRoughness={0.55} sheenColor="#9cc86e" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Herbs({ seed, spread, height }: { seed: number; spread: [number, number]; height: (x: number, z: number) => number }) {
  const flecks = useMemo(() => {
    const rng = mulberry32(seed + 777);
    const deep = new Color("#2E5220");
    const bright = new Color("#5C8A33");
    return Array.from({ length: 13 }, () => {
      const x = (rng() - 0.5) * spread[0];
      const z = (rng() - 0.5) * spread[1];
      return {
        x,
        z,
        y: height(x, z) + 0.012,
        rot: [rng() * Math.PI, rng() * Math.PI, rng() * Math.PI] as [number, number, number],
        s: 0.75 + rng() * 0.7,
        color: deep.clone().lerp(bright, rng()),
      };
    });
  }, [seed, spread, height]);

  return (
    <group>
      {flecks.map((f, i) => (
        <mesh key={i} position={[f.x, f.y, f.z]} rotation={f.rot} scale={f.s} castShadow>
          <boxGeometry args={[0.032, 0.004, 0.02]} />
          <meshPhysicalMaterial color={f.color} roughness={0.7} sheen={0.4} sheenColor="#a8d878" />
        </mesh>
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
        <Herbs seed={seed} spread={[0.9, 1.0]} height={sliceTop} />
      </group>
      <group position={[COMPARTMENTS[1].x, FLOOR, COMPARTMENTS[1].z]} scale={[1.26, 1, 1.04]}>
        <GrainBed color={contents.carb} seed={seed + 17} radius={0.42} />
        <Herbs seed={seed + 3} spread={[0.66, 0.44]} height={moundTop} />
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

