"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Progress of an element through the viewport, 0 when its top hits the bottom
 * of the screen and 1 when its bottom leaves the top. Written to a ref rather
 * than state so scrolling never triggers a React render.
 */
export function useScrollProgress<T extends HTMLElement>(
  target: RefObject<T | null>,
): RefObject<number> {
  const progress = useRef(0);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const el = target.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const span = rect.height + window.innerHeight;
      if (span <= 0) return;
      const travelled = window.innerHeight - rect.top;
      progress.current = Math.min(1, Math.max(0, travelled / span));
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [target]);

  return progress;
}
