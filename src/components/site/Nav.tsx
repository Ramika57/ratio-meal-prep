"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { track } from "@/lib/track";

const LINKS = [
  { href: "/#how", label: "How it works" },
  { href: "/#menu", label: "Menu" },
  { href: "/#pricing", label: "Pricing" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // A menu left open behind a route change is a classic mobile trap.
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("hashchange", close);
    return () => window.removeEventListener("hashchange", close);
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        scrolled || open ? "bg-ink/80 backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <div
        className={`absolute inset-x-0 bottom-0 h-px transition-opacity duration-500 ${
          scrolled || open ? "opacity-100" : "opacity-0"
        }`}
        style={{ background: "rgba(243,241,236,0.12)" }}
        aria-hidden
      />
      <nav className="shell flex h-14 items-center justify-between md:h-16" aria-label="Primary">
        <Link href="/" className="text-lg font-semibold tracking-[-0.05em]" onClick={() => setOpen(false)}>
          RATIO
        </Link>

        <div className="hidden items-center gap-9 md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-bone/65 transition-colors hover:text-bone">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/build"
            onClick={() => track("cta_click", { location: "nav", label: "build_your_plan" })}
            className="inline-flex h-11 items-center rounded-full bg-signal px-5 text-sm font-medium text-ink transition-colors hover:bg-[#dbff63] md:h-9 md:px-4 md:text-sm"
          >
            Build your plan
          </Link>
          <button
            type="button"
            className="-mr-2 grid size-11 place-items-center md:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="relative block h-3 w-4">
              <span
                className={`absolute inset-x-0 top-0 h-px bg-bone transition-transform duration-300 ${
                  open ? "translate-y-[6px] rotate-45" : ""
                }`}
              />
              <span
                className={`absolute inset-x-0 bottom-0 h-px bg-bone transition-transform duration-300 ${
                  open ? "-translate-y-[6px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </nav>

      <div
        className={`grid overflow-hidden transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0">
          <div className="shell flex flex-col gap-1 pb-5 pt-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-1 py-2.5 text-lg text-bone/80"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
