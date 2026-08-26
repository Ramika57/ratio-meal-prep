"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { useInView } from "@/hooks/useInView";
import type { TrayContents } from "./MealTray";

// WebGL cannot render on the server, and loading three on the server would add
// roughly half a megabyte to the initial payload for nothing.
const TrayScene = dynamic(() => import("./TrayScene"), {
  ssr: false,
  loading: () => <TrayFallback />,
});

function TrayFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center" aria-hidden>
      <div className="h-24 w-40 rounded-2xl border border-bone/10 bg-bone/[0.03] animate-pulse" />
    </div>
  );
}

const DEFAULT: TrayContents = {
  seed: "chargrilled-chicken-broccolini",
  name: "Chargrilled Chicken",
  protein: "#D89A4A",
  carb: "#C9A46E",
  veg: "#57A82E",
  macros: { kcal: 402, protein: 48, carbs: 12, fat: 18 },
};

/** Auto rotating hero tray. Parks the render loop when scrolled out of view. */
export function TrayHero({ contents = DEFAULT, className = "" }: { contents?: TrayContents; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const visible = useInView(box);

  return (
    <div ref={box} className={className}>
      <TrayScene contents={contents} mode="hero" active={visible} />
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

  return (
    <div ref={box} className={className}>
      <TrayScene contents={contents} mode="scroll" progressRef={progressRef} active={visible} />
    </div>
  );
}
