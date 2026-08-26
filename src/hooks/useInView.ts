"use client";

import { useEffect, useState, type RefObject } from "react";

/** Simple visibility flag. Used to stop rendering WebGL frames offscreen. */
export function useInView<T extends HTMLElement>(target: RefObject<T | null>, rootMargin = "35%") {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = target.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      // No observer available, for instance a very old browser or a test
      // environment. Treat the element as visible so content is never trapped
      // behind a capability check that cannot run. Deferred by a frame because
      // setting state synchronously in an effect body cascades renders.
      const frame = requestAnimationFrame(() => setInView(true));
      return () => cancelAnimationFrame(frame);
    }
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [target, rootMargin]);

  return inView;
}
