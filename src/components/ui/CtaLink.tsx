"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { track } from "@/lib/track";

/**
 * The single primary call to action, used everywhere it appears so that every
 * placement is measured. If a button is not this component, it is not the CTA.
 */
export function CtaLink({
  href = "/build",
  location,
  label = "build_your_plan",
  className = "",
  children,
}: {
  href?: string;
  location: string;
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={() => track("cta_click", { location, label })}
      className={`group inline-flex h-14 items-center justify-center gap-2.5 rounded-full bg-signal px-8 text-lg font-medium text-ink shadow-[0_0_50px_-14px_rgba(216,250,78,0.55)] transition-[background-color,transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#e4ff70] hover:shadow-[0_0_60px_-10px_rgba(216,250,78,0.7)] active:scale-[0.97] ${className}`}
    >
      {children}
      <svg
        width="15"
        height="15"
        viewBox="0 0 15 15"
        fill="none"
        aria-hidden
        className="transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1"
      >
        <path d="M2.5 7.5h9m-3.75-4L11.5 7.5l-3.75 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
