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
      className={`inline-flex h-14 items-center justify-center gap-2 rounded-full bg-signal px-8 text-[1.0625rem] font-medium text-ink transition-[background-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#dbff63] active:scale-[0.97] ${className}`}
    >
      {children}
    </Link>
  );
}
