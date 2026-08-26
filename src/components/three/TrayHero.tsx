"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { useInView } from "@/hooks/useInView";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import type { TrayContents } from "./MealTray";

/**
 * Two renderers, chosen by device.
 *
 * Both draw the same tray from the same geometry. The desktop scene adds the
 * post processing stack (ambient occlusion, bloom, vignette), which is most of
 * the bundle weight; the lite scene omits it and caps the pixel ratio. Because
 * they are separate modules behind separate dynamic imports, a phone never
 * downloads the postprocessing chunk at all.
 */
const TrayScene = dynamic(() => import("./TrayScene"), { ssr: false });
const TraySceneLite = dynamic(() => import("./TraySceneLite"), { ssr: false });

const DEFAULT: TrayContents = {
  seed: "chargrilled-chicken-broccolini",
  name: "Chargrilled Chicken",
  protein: "#C98F45",
  carb: "#DDBC85",
  veg: "#3E7A22",
  macros: { kcal: 402, protein: 48, carbs: 12, fat: 18 },
};

/** Auto rotating hero tray. Parks the render loop when scrolled out of view. */
export function TrayHero({ contents = DEFAULT, className = "" }: { contents?: TrayContents; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const visible = useInView(box);
  const isDesktop = useIsDesktop();
  const Scene = isDesktop ? TrayScene : TraySceneLite;

  return (
    <div ref={box} className={className}>
      <Scene contents={contents} mode="hero" active={visible} />
    </div>
  );
}

/**
 * Scroll driven tray. Progress is measured on the tall outer section rather
 * than here, because this element is sticky and its own rect barely moves.
 */
export function TrayScroll({
  contents = DEFAULT,
  className = "",
  progressRef,
}: {
  contents?: TrayContents;
  className?: string;
  progressRef: React.RefObject<number>;
}) {
  const box = useRef<HTMLDivElement>(null);
  const visible = useInView(box);
  const isDesktop = useIsDesktop();
  const Scene = isDesktop ? TrayScene : TraySceneLite;

  return (
    <div ref={box} className={className}>
      <Scene contents={contents} mode="scroll" progressRef={progressRef} active={visible} />
    </div>
  );
}
