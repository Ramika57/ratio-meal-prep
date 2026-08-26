"use client";

import { useCallback, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import type { Group } from "three";
import { MealTray, type TrayContents } from "./MealTray";

/**
 * Studio lighting built from Lightformers rather than an HDR file, so the scene
 * has no network dependency and renders identically offline.
 */
function Studio() {
  return (
    <Environment resolution={256} frames={1}>
      {/* Key: long softbox overhead */}
      <Lightformer form="rect" intensity={5} position={[0, 5, 1]} rotation={[Math.PI / 2, 0, 0]} scale={[10, 6, 1]} />
      {/* Fill from camera left */}
      <Lightformer form="rect" intensity={2.2} position={[-5, 1.5, 2]} rotation={[0, -Math.PI / 2, 0]} scale={[8, 5, 1]} />
      {/* Rim from behind right, slightly warm */}
      <Lightformer form="rect" intensity={4.6} color="#fff3dd" position={[4, 2.5, -4]} rotation={[0, Math.PI / 3, 0]} scale={[6, 4, 1]} />
      {/* Narrow strip that draws a highlight along the near rim of the tray */}
      <Lightformer form="rect" intensity={6} position={[-1.5, 1.2, 5]} rotation={[0, 0, Math.PI / 5]} scale={[0.6, 7, 1]} />
      {/* Base bounce keeps the tray underside from going pure black */}
      <Lightformer form="rect" intensity={0.7} position={[0, -3, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[10, 10, 1]} />
      {/* Low front fill so the recessed compartments are not in shadow */}
      <Lightformer form="rect" intensity={2.4} position={[0, 1.4, 6]} rotation={[0, 0, 0]} scale={[9, 3, 1]} />
    </Environment>
  );
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function Rig({
  contents,
  mode,
  progressRef,
}: {
  contents: TrayContents;
  mode: "hero" | "scroll";
  progressRef?: React.RefObject<number>;
}) {
  const group = useRef<Group>(null);
  const pointer = useThree((s) => s.pointer);
  const lift = useRef(0);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const t = Math.min(delta, 0.05);

    if (mode === "hero") {
      g.rotation.y += t * 0.22;
      // Ease toward the cursor rather than snapping, so it feels weighted.
      const targetX = -0.2 + pointer.y * 0.14;
      const targetZ = pointer.x * 0.05;
      g.rotation.x += (targetX - g.rotation.x) * t * 3.5;
      g.rotation.z += (targetZ - g.rotation.z) * t * 3.5;
      g.position.y = Math.sin(state.clock.elapsedTime * 0.7) * 0.04;
      lift.current += (0.015 - lift.current) * t * 2;
    } else {
      const p = progressRef?.current ?? 0;
      g.rotation.y = -0.7 + p * 2.5;
      g.rotation.x = -0.46 + Math.sin(p * Math.PI) * 0.2;
      g.position.y = -0.04 + p * 0.08;
      // Lid opens through the middle of the section, then stays open.
      const target = clamp01((p - 0.12) / 0.5);
      lift.current += (target - lift.current) * t * 7;
    }
  });

  const readLid = useCallback(() => lift.current, []);

  return (
    <group ref={group}>
      <MealTray contents={contents} lid={readLid} />
    </group>
  );
}

export default function TrayScene({
  contents,
  mode = "hero",
  progressRef,
  active = true,
  className,
}: {
  contents: TrayContents;
  mode?: "hero" | "scroll";
  progressRef?: React.RefObject<number>;
  active?: boolean;
  className?: string;
}) {
  return (
    <Canvas
      className={className}
      dpr={[1, 2]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 1.95, 4.35], fov: 28 }}
    >
      <ambientLight intensity={0.32} />
      {/* Grounding comes from ContactShadows rather than a shadow map: one blurred
          plane instead of a full depth pass, and no deprecated filter type. */}
      <directionalLight position={[3, 6, 3]} intensity={1.5} />
      <Studio />
      <Rig contents={contents} mode={mode} progressRef={progressRef} />
      <ContactShadows position={[0, -0.5, 0]} opacity={0.68} scale={8} blur={2.2} far={3} resolution={512} />
    </Canvas>
  );
}
