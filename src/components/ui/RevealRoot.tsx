"use client";

import { useEffect } from "react";

/**
 * One observer for the whole document. Any element with class "reveal" is held
 * hidden by CSS until it scrolls in, at which point data-shown flips and the
 * transition runs. Server components can opt in with a class name alone, no
 * wrapper component and no client boundary.
 */
export default function RevealRoot() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      document.querySelectorAll<HTMLElement>(".reveal").forEach((el) => {
        el.dataset.shown = "true";
      });
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.shown = "true";
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.01 },
    );

    const scan = () => {
      document
        .querySelectorAll<HTMLElement>(".reveal:not([data-shown])")
        .forEach((el) => io.observe(el));
    };

    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
