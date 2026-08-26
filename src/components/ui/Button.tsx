import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "signal" | "solid" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-[-0.01em] " +
  "transition-[transform,background-color,color,border-color,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] " +
  "active:scale-[0.97] disabled:opacity-35 disabled:pointer-events-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  signal: "bg-signal text-ink hover:bg-[#dbff63]",
  solid: "bg-bone text-ink hover:bg-white",
  outline: "border border-bone/25 text-bone hover:border-bone/60 hover:bg-bone/5",
  ghost: "text-bone/70 hover:text-bone",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[0.8125rem]",
  md: "h-11 px-6 text-[0.9375rem]",
  lg: "h-14 px-8 text-[1.0625rem]",
};

export function buttonClass(variant: Variant = "signal", size: Size = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

export function ButtonLink({
  href,
  variant = "signal",
  size = "md",
  className = "",
  children,
  ...rest
}: { href: string; variant?: Variant; size?: Size; className?: string; children: ReactNode } & Omit<
  ComponentProps<typeof Link>,
  "href" | "className" | "children"
>) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}

export function Button({
  variant = "signal",
  size = "md",
  className = "",
  children,
  ...rest
}: { variant?: Variant; size?: Size } & ComponentProps<"button">) {
  return (
    <button className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}
