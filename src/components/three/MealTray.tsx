"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, Group } from "three";
import { mulberry32, seedFrom } from "@/lib/rand";
import {
  filmGeometry,
  floretGeometry,
  mergedGrainsGeometry,
  mergedHerbsGeometry,
  moundGeometry,
  labelTexture,
  microNormalTexture,
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
 * The grain compartment: a coloured mound with the grains merged into one
 * geometry. As individual meshes the grains were 220 draw calls; merged they
 * are one, and the whole thing is cached so the second canvas reuses it.
 */
function GrainBed({ color, seed, radius = 0.4 }: { color: string; seed: number; radius?: number }) {
  const mound = useMemo(() => moundGeometry(radius, 0.16, seed, color), [radius, seed, color]);
  const grains = useMemo(() => mergedGrainsGeometry(color, seed, radius), [color, seed, radius]);

  return (
    <group>
      <mesh geometry={mound} castShadow receiveShadow>
        <meshPhysicalMaterial vertexColors roughness={0.55} clearcoat={0.3} clearcoatRoughness={0.5} sheen={0.25} />
      </mesh>
      <mesh geometry={grains} castShadow receiveShadow>
        <meshPhysicalMaterial vertexColors roughness={0.36} clearcoat={0.45} clearcoatRoughness={0.35} sheen={0.3} />
      </mesh>
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

function Herbs({ seed, spread, surface }: { seed: number; spread: [number, number]; surface: "slices" | "mound" }) {
  const geo = useMemo(() => mergedHerbsGeometry(seed, spread[0], spread[1], surface), [seed, spread, surface]);
  return (
    <mesh geometry={geo} castShadow>
      <meshPhysicalMaterial vertexColors roughness={0.7} sheen={0.4} sheenColor="#a8d878" />
    </mesh>
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
        <Herbs seed={seed} spread={[0.9, 1.0]} surface="slices" />
      </group>
      <group position={[COMPARTMENTS[1].x, FLOOR, COMPARTMENTS[1].z]} scale={[1.26, 1, 1.04]}>
        <GrainBed color={contents.carb} seed={seed + 17} radius={0.42} />
        <Herbs seed={seed + 3} spread={[0.66, 0.44]} surface="mound" />
      </group>
      <group position={[COMPARTMENTS[2].x, FLOOR, COMPARTMENTS[2].z]}>
        <Greens color={contents.veg} seed={seed + 91} />
      </group>

      {/* Heat sealed film with the slack a real seal leaves */}
      <group ref={lidRef} position={[0, RIM + 0.02, 0]}>
        <mesh geometry={film} castShadow>
          {/* Alpha blended film washes white at any real opacity, so it runs
              nearly transparent with the environment reflections boosted: the
              glints survive, the milk does not. */}
          <meshPhysicalMaterial
            color="#ffffff"
            transparent
            opacity={0.13}
            roughness={0.07}
            clearcoat={1}
            clearcoatRoughness={0.04}
            envMapIntensity={2.4}
            depthWrite={false}
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

