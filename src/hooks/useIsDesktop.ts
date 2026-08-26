"use client";

import { useEffect, useState } from "react";

/**
 * True only on a pointer driven screen wide enough to justify WebGL.
 *
 * Starts false and is never true during server render, which is deliberate:
 * the mobile path is the default, so a phone never evaluates the branch that
 * imports three.js, and there is no hydration mismatch to reconcile.
 */
export function useIsDesktop(query = "(min-width: 768px) and (pointer: fine)") {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);

  return isDesktop;
}
