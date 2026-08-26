"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useInView } from "@/hooks/useInView";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useScrollProgress } from "@/hooks/useScrollProgress";

/**
 * three.js and its post processing stack are a 1.2MB chunk. Importing it from
 * inside this branch, rather than at module scope, means a phone never requests
 * it at all: on mobile the section shows a photograph, which is both lighter
 * and more appetising than a real time render on a small screen.
 */
const TrayScroll = dynamic(() => import("@/components/three/TrayHero").then((m) => m.TrayScroll), {
  ssr: false,
});

const CALLOUTS = [
  {
    label: "Sealed at three degrees",
    body:
      "Cooked Saturday, sealed under film, held at three degrees. Chilled and never frozen, so the protein does not weep on reheat and the vegetables keep their bite.",
  },
  {
    label: "Three compartments, on purpose",
    body:
      "Protein is weighed to the gram. Carbohydrate is confined to one compartment, which is what keeps the number low. Vegetables get as much tray as the protein does.",
  },
  {
    label: "Printed on the lid",
    body:
      "Calories and all three macros on every tray. Five seconds to log, no weighing, no guessing what the sauce added.",
  },
];

export default function ProductShowcase() {
  const section = useRef<HTMLElement>(null);
  const progress = useScrollProgress(section);
  const near = useInView(section, "80%");
  const isDesktop = useIsDesktop();
  const [stage, setStage] = useState(0);

  // Discrete stages rather than a continuous value: three renders across the
  // whole section instead of one per frame.
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const p = progress.current;
      const next = p < 0.38 ? 0 : p < 0.62 ? 1 : 2;
      setStage((prev) => (prev === next ? prev : next));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [progress]);

  return (
    <section ref={section} className="relative h-[190vh] bg-espresso md:h-[280vh]">
      <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden">
        {isDesktop && near ? (
          <TrayScroll className="absolute inset-0" progressRef={progress} />
        ) : (
          <div className="absolute inset-0">
            <Image
              src="/photos/tray-angle.jpg"
              alt="A black meal prep tray at an angle, divided into compartments of protein, grains and greens"
              fill
              sizes="100vw"
              className="object-cover object-center"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(28,20,16,0.93) 0%, rgba(28,20,16,0.62) 18%, rgba(28,20,16,0.10) 42%, rgba(28,20,16,0.58) 62%, rgba(28,20,16,0.90) 80%, rgba(28,20,16,0.97) 100%)",
              }}
              aria-hidden
            />
          </div>
        )}

        <div className="shell relative z-10 flex h-full flex-col justify-between py-20 md:py-24">
          <div className="max-w-[46ch]">
            <p className="eyebrow text-mute">03 · The tray</p>
            <h2 className="mt-4 text-display-s font-semibold md:text-display-m">
              Built for the fridge, not the photograph.
            </h2>
          </div>

          <div className="relative h-[10.5rem] max-w-[42ch] md:h-[9rem]">
            {CALLOUTS.map((c, i) => (
              <div
                key={c.label}
                className="absolute inset-x-0 bottom-0 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  opacity: stage === i ? 1 : 0,
                  transform: stage === i ? "none" : "translateY(14px)",
                  pointerEvents: stage === i ? "auto" : "none",
                }}
                aria-hidden={stage !== i}
              >
                <div className="flex items-center gap-3">
                  <span className="eyebrow text-signal tnum">0{i + 1}</span>
                  <span className="h-px flex-1 bg-bone/15" aria-hidden />
                </div>
                <h3 className="mt-4 text-xl font-semibold tracking-[-0.035em]">{c.label}</h3>
                <p className="mt-2.5 text-base leading-relaxed text-bone/60">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
