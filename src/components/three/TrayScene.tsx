"use client";

import { useCallback, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { Bloom, EffectComposer, N8AO, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { ACESFilmicToneMapping, type Group } from "three";
import { FitCamera } from "./FitCamera";
import { MealTray, type TrayContents } from "./MealTray";

/**
 * Studio lighting built from Lightformers rather than an HDR file, so there is
 * no network dependency and the rig is tunable.
 *
 * Warm key, cool fill, warm rim. The cool fill is what stops food photography
 * looking like a morgue: without an opposing colour temperature the shadows go
 * grey and everything reads as plastic.
 */
function Studio() {
  return (
    <Environment resolution={256} frames={1}>
      {/* Key: large warm softbox, high and slightly camera right */}
      <Lightformer
        form="rect"
        intensity={2.6}
        color="#fff2de"
        position={[2.2, 5, 2.4]}
        rotation={[-Math.PI / 2.6, 0.35, 0]}
        scale={[9, 7, 1]}
      />
      {/* Fill: cooler and softer, camera left, to keep shadows from going dead */}
      <Lightformer
        form="rect"
        intensity={1.0}
        color="#cfe0ff"
        position={[-5.5, 1.6, 2]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={[8, 6, 1]}
      />
      {/* Rim: hot amber behind, to separate the tray from the background */}
      <Lightformer
        form="rect"
        intensity={2.4}
        color="#ffb56b"
        position={[3.4, 2.2, -4.6]}
        rotation={[0, Math.PI / 2.6, 0]}
        scale={[6, 3.5, 1]}
      />
      {/* Long specular strip that draws a highlight down the rim and the film */}
      <Lightformer
        form="rect"
        intensity={3.2}
        color="#ffffff"
        position={[-1.6, 2.4, 4.2]}
        rotation={[0, 0, Math.PI / 4.5]}
        scale={[0.5, 8, 1]}
      />
      {/* Warm bounce off the bench */}
      <Lightformer
        form="rect"
        intensity={0.5}
        color="#ffd9b0"
        position={[0, -2.6, 1]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[10, 10, 1]}
      />
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
      g.rotation.y += t * 0.17;
      const targetX = -0.26 + pointer.y * 0.13;
      const targetZ = pointer.x * 0.045;
      g.rotation.x += (targetX - g.rotation.x) * t * 3.2;
      g.rotation.z += (targetZ - g.rotation.z) * t * 3.2;
      g.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.035;
      lift.current += (0.02 - lift.current) * t * 2;
    } else {
      const p = progressRef?.current ?? 0;
      g.rotation.y = -0.75 + p * 2.4;
      g.rotation.x = -0.5 + Math.sin(p * Math.PI) * 0.22;
      g.position.y = -0.04 + p * 0.08;
      lift.current += (clamp01((p - 0.12) / 0.5) - lift.current) * t * 7;
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
  /**
   * Render resolution: native display density, never above it. On a 4K or
   * Retina panel that is a 4K class framebuffer already; oversampling past the
   * physical pixels costs GPU memory quadratically and shows nowhere. The
   * PerformanceMonitor walks it down further if the frame budget is tight.
   */
  const [dpr, setDpr] = useState(() =>
    typeof window === "undefined" ? 2 : Math.min(window.devicePixelRatio || 1, 2),
  );

  return (
    <Canvas
      className={className}
      dpr={dpr}
      frameloop={active ? "always" : "never"}
      gl={{
        antialias: false,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
      }}
      camera={{ position: [0, 3, 5], fov: 32 }}
    >
      <PerformanceMonitor
        onDecline={() => setDpr((d) => Math.max(1.25, d - 0.5))}
        onIncline={() => setDpr((d) => Math.min(2, d + 0.25))}
      />

      <FitCamera />
      <ambientLight intensity={0.2} />
      <directionalLight position={[1.5, 7, 2.4]} intensity={0.85} color="#fff4e2" />
      <Studio />

      <Rig contents={contents} mode={mode} progressRef={progressRef} />

      <ContactShadows position={[0, -0.31, 0]} opacity={0.72} scale={8} blur={2.1} far={2.4} resolution={512} />

      <EffectComposer multisampling={2} enableNormalPass>
        {/* Ambient occlusion is the single biggest quality win here. It is what
            puts a dark seam where a floret meets the tray, and without it every
            object looks pasted onto the scene rather than resting in it. */}
        <N8AO aoRadius={0.2} distanceFalloff={0.7} intensity={2.4} quality="high" halfRes color="#2a1d16" />
        <Bloom intensity={0.32} luminanceThreshold={0.82} luminanceSmoothing={0.35} mipmapBlur radius={0.7} />
        <Vignette offset={0.4} darkness={0.3} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  );
}
