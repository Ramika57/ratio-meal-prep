"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts a figure up when it scrolls into view.
 *
 * Driven by an interval that reads performance.now() inside each tick rather
 * than by requestAnimationFrame. rAF hands the callback the frame's timestamp,
 * and in a throttled tab that timestamp can be stale, which left the counter
 * frozen near zero. A tick that computes its own elapsed time cannot be lied
 * to: if the tab was starved, the next tick simply lands on the final value.
 * Renders the real value on the server so a no-JS reader never sees a zero.
 */
export function CountUp({ value, duration = 1100 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);
  const played = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || played.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let interval = 0;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || played.current) return;
        played.current = true;
        io.disconnect();

        const t0 = performance.now();
        interval = window.setInterval(() => {
          const p = Math.min(1, Math.max(0, (performance.now() - t0) / duration));
          const eased = 1 - Math.pow(1 - p, 4);
          setDisplay(Math.round(value * eased));
          if (p >= 1) window.clearInterval(interval);
        }, 32);
      },
      { threshold: 0.5 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      if (interval) window.clearInterval(interval);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className="tnum">
      {display}
    </span>
  );
}
