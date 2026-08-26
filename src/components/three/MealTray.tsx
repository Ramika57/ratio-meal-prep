"use client";

import { useMemo, useRef } from "react";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { mulberry32, seedFrom } from "@/lib/rand";

export type TrayContents = {
  seed: string;
  protein: string;
  carb: string;
  veg: string;
};

const TRAY_W = 2.55;
const TRAY_D = 1.85;
const TRAY_H = 0.56;
const WALL = 0.085;

/** Sliced protein: four slabs fanned across the big compartment. */
function ProteinSlabs({ color, seed }: { color: string; seed: number }) {
  const rng = useMemo(() => mulberry32(seed), [seed]);
  const slabs = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        x: -0.4 + i * 0.16 + (rng() - 0.5) * 0.02,
        z: (rng() - 0.5) * 0.12,
        rot: (rng() - 0.5) * 0.34,
        tilt: 0.3 + rng() * 0.1,
        len: 0.98 + rng() * 0.18,
      })),
    [rng],
  );

  return (
    <group>
      {slabs.map((s, i) => (
        <group key={i} position={[s.x, 0.02 + i * 0.008, s.z]} rotation={[0, s.rot, s.tilt]}>
          <RoundedBox args={[0.155, 0.11, s.len]} radius={0.035} smoothness={4}>
            <meshStandardMaterial color={color} roughness={0.62} metalness={0} />
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}

/** Grain or mash bed: a shallow mound built from clustered spheres. */
function GrainBed({ color, seed }: { color: string; seed: number }) {
  const rng = useMemo(() => mulberry32(seed), [seed]);
  const grains = useMemo(
    () =>
      Array.from({ length: 130 }, () => {
        const a = rng() * Math.PI * 2;
        const r = Math.sqrt(rng()) * 0.32;
        return {
          x: Math.cos(a) * r,
          z: Math.sin(a) * r * 0.72,
          y: rng() * 0.075,
          s: 0.042 + rng() * 0.03,
        };
      }),
    [rng],
  );

  return (
    <group>
      {grains.map((g, i) => (
        <mesh key={i} position={[g.x, 0.01 + g.y, g.z]} scale={[1, 0.72, 1]}>
          <sphereGeometry args={[g.s, 8, 6]} />
          <meshStandardMaterial color={color} roughness={0.72} />
        </mesh>
      ))}
    </group>
  );
}

/** Greens: florets with short stems. */
function Florets({ color, seed }: { color: string; seed: number }) {
  const rng = useMemo(() => mulberry32(seed), [seed]);
  const bits = useMemo(
    () =>
      Array.from({ length: 14 }, () => {
        const a = rng() * Math.PI * 2;
        const r = Math.sqrt(rng()) * 0.27;
        return {
          x: Math.cos(a) * r,
          z: Math.sin(a) * r * 0.7,
          s: 0.07 + rng() * 0.05,
          rot: rng() * Math.PI,
        };
      }),
    [rng],
  );

  return (
    <group>
      {bits.map((b, i) => (
        <group key={i} position={[b.x, 0.03, b.z]} rotation={[0, b.rot, 0]}>
          <mesh position={[0, b.s * 0.55, 0]}>
            <icosahedronGeometry args={[b.s, 1]} />
            <meshStandardMaterial color={color} roughness={0.85} flatShading />
          </mesh>
          <mesh position={[0, b.s * 0.1, 0]}>
            <cylinderGeometry args={[b.s * 0.28, b.s * 0.34, b.s * 0.9, 6]} />
            <meshStandardMaterial color="#D9DEC2" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Well({
  position,
  size,
}: {
  position: [number, number, number];
  size: [number, number];
}) {
  return (
    <RoundedBox
      args={[size[0], TRAY_H - WALL, size[1]]}
      radius={0.055}
      smoothness={4}
      position={position}
    >
      <meshStandardMaterial color="#23232a" roughness={0.95} />
    </RoundedBox>
  );
}

export function MealTray({
  contents,
  lid,
}: {
  contents: TrayContents;
  /** Read every frame. Returns 0 for a sealed lid, 1 for fully lifted and tipped. */
  lid?: () => number;
}) {
  const lidRef = useRef<Group>(null);
  const seed = seedFrom(contents.seed);

  useFrame(() => {
    const g = lidRef.current;
    if (!g) return;
    const v = lid ? lid() : 0;
    g.position.y = 0.32 + v * 1.05;
    g.rotation.z = -v * 0.34;
    g.rotation.x = v * 0.1;
  });

  return (
    <group>
      {/* Tray body */}
      <RoundedBox args={[TRAY_W, TRAY_H, TRAY_D]} radius={0.085} smoothness={6}>
        <meshPhysicalMaterial
          color="#2c2c33"
          roughness={0.38}
          metalness={0.06}
          clearcoat={0.45}
          clearcoatRoughness={0.35}
        />
      </RoundedBox>

      {/* Compartment cavities */}
      <Well position={[-0.6, -0.06, 0]} size={[1.16, 1.52]} />
      <Well position={[0.62, -0.06, -0.39]} size={[1.1, 0.72]} />
      <Well position={[0.62, -0.06, 0.39]} size={[1.1, 0.72]} />

      {/* Food */}
      <group position={[-0.6, 0.18, 0]}>
        <ProteinSlabs color={contents.protein} seed={seed} />
      </group>
      <group position={[0.62, 0.18, -0.39]} scale={[1.5, 1, 0.9]}>
        <GrainBed color={contents.carb} seed={seed + 17} />
      </group>
      <group position={[0.62, 0.18, 0.39]} scale={[1.5, 1, 0.9]}>
        <Florets color={contents.veg} seed={seed + 91} />
      </group>

      {/* Sealed film lid */}
      <group ref={lidRef} position={[0, 0.32, 0]}>
        <RoundedBox args={[TRAY_W + 0.035, 0.055, TRAY_D + 0.035]} radius={0.03} smoothness={5}>
          <meshPhysicalMaterial
            color="#ffffff"
            transmission={1}
            thickness={0.04}
            roughness={0.14}
            ior={1.38}
            clearcoat={1}
            clearcoatRoughness={0.06}
            reflectivity={0.35}
          />
        </RoundedBox>
        {/* Printed macro strip on the lid */}
        <mesh position={[-0.88, 0.032, 0.72]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.52, 0.14]} />
          <meshStandardMaterial color="#cdf546" roughness={0.5} />
        </mesh>
        <mesh position={[-0.3, 0.032, 0.72]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.44, 0.07]} />
          <meshStandardMaterial color="#f3f1ec" roughness={0.6} opacity={0.7} transparent />
        </mesh>
      </group>
    </group>
  );
}
