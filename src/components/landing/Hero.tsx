import Link from "next/link";
import { TrayHero } from "@/components/three/TrayHero";
import { menuStats } from "@/lib/db";
import { CtaLink } from "@/components/ui/CtaLink";

export default async function Hero() {
  const stats = await menuStats();

  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden">
      {/* A single soft pool of light behind the product, nothing more. */}
      <div
        className="pointer-events-none absolute left-1/2 top-[46%] -z-10 h-[70vh] w-[110vw] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "radial-gradient(ellipse 42% 46% at 50% 50%, rgba(205,245,70,0.09), transparent 70%)",
        }}
        aria-hidden
      />

      <div className="shell relative z-10 pt-24 text-center">
        <p className="eyebrow reveal text-signal/90">Melbourne · High protein · Low carb</p>

        <h1 className="reveal mx-auto mt-5 max-w-[16ch] text-display-xl font-semibold" style={{ "--reveal-delay": "90ms" } as React.CSSProperties}>
          Hit your macros without cooking.
        </h1>

        <p
          className="reveal mx-auto mt-6 max-w-[54ch] text-[1.0625rem] leading-relaxed text-bone/65 md:text-[1.125rem]"
          style={{ "--reveal-delay": "170ms" } as React.CSSProperties}
        >
          Set a goal, set the calories you actually want to eat, and choose how many days.
          We cook to that number, print the macros on the lid, and deliver it chilled.
        </p>

        <div
          className="reveal mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row"
          style={{ "--reveal-delay": "250ms" } as React.CSSProperties}
        >
          <CtaLink href="/build" location="hero" label="build_your_plan" className="w-full sm:w-auto">
            Build your plan
          </CtaLink>
          <Link
            href="/#menu"
            className="inline-flex h-14 w-full items-center justify-center rounded-full border border-bone/20 px-8 text-[1.0625rem] transition-colors hover:border-bone/50 hover:bg-bone/5 sm:w-auto"
          >
            See the menu
          </Link>
        </div>

        <p
          className="reveal mt-5 text-[0.8125rem] text-mute tnum"
          style={{ "--reveal-delay": "320ms" } as React.CSSProperties}
        >
          {stats.count} meals · {stats.avgProtein}g protein and {stats.avgCarbs}g carbs on average · from $11.95 a meal
        </p>
      </div>

      {/* The product itself, given the bottom half of the screen. */}
      <div className="relative min-h-[32vh] flex-1">
        <TrayHero className="absolute inset-0" />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex items-center justify-center gap-2 text-mute">
        <span className="eyebrow">Scroll</span>
        <span className="block h-px w-8 bg-bone/25" aria-hidden />
      </div>
    </section>
  );
}
