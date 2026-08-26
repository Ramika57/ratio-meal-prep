"use client";

import { useCallback, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { ACESFilmicToneMapping, type Group } from "three";
import { MealTray, type TrayContents } from "./MealTray";

/**
 * The mobile renderer. Same tray, same geometry, no post processing.
 *
 * The EffectComposer stack (N8AO, bloom, vignette) is where both the bundle
 * weight and the per frame GPU cost live: `postprocessing` alone is 2.7MB in
 * node_modules and most of the 360KB the desktop scene ships over the wire.
 * Importing it from a separate module means a phone never downloads it, while
 * still getting the real render rather than a photograph.
 *
 * Ambient occlusion is the one real loss. It is compensated with a tighter
 * contact shadow and a slightly deeper key, which at the size a tray occupies
 * on a phone reads close enough.
 */
function StudioLite() {
  return (
    <Environment resolution={128} frames={1}>
      <Lightformer
        form="rect"
        intensity={3}
        color="#fff2de"
        position={[2.2, 5, 2.4]}
        rotation={[-Math.PI / 2.6, 0.35, 0]}
        scale={[9, 7, 1]}
      />
      <Lightformer
        form="rect"
        intensity={1.2}
        color="#cfe0ff"
        position={[-5.5, 1.6, 2]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={[8, 6, 1]}
      />
      <Lightformer
        form="rect"
        intensity={2.6}
        color="#ffb56b"
        position={[3.4, 2.2, -4.6]}
        rotation={[0, Math.PI / 2.6, 0]}
        scale={[6, 3.5, 1]}
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
      g.rotation.x += (targetX - g.rotation.x) * t * 3.2;
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
      <MealTray contents={contents} lid={readLid} lite />
    </group>
  );
}

export default function TraySceneLite({
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
      /* Capped at 1.5 rather than the display's full density: on a phone the
         GPU is the constraint, not the panel. */
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "default",
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.06,
      }}
      /* Pulled back from the desktop framing so the tray sits inside a narrow
         portrait canvas instead of running off both edges. */
      camera={{ position: [0, 3.05, 5.0], fov: 30 }}
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[1.5, 7, 2.4]} intensity={1.1} color="#fff4e2" />
      <StudioLite />
      <Rig contents={contents} mode={mode} progressRef={progressRef} />
      <ContactShadows position={[0, -0.31, 0]} opacity={0.8} scale={7} blur={1.8} far={2.2} resolution={256} />
    </Canvas>
  );
}
