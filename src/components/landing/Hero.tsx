import Image from "next/image";
import Link from "next/link";
import { menuStats } from "@/lib/db";
import { CtaLink } from "@/components/ui/CtaLink";

/**
 * The hero leads with a photograph, not a render.
 *
 * A procedural three.js tray was here first, and it never stopped reading as
 * plastic: hand written geometry cannot compete with a camera at the one job
 * this section has, which is making someone want to eat. Every competitor
 * researched for this venture uses photography for the same reason. The render
 * survives further down the page, where the job is explaining how the tray is
 * built and a schematic is the right answer.
 *
 * It is also faster: no WebGL context, no shader compile, no geometry build on
 * the main thread before first paint.
 */
export default async function Hero() {
  const stats = await menuStats();

  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute left-1/2 top-[46%] -z-10 h-[70vh] w-[110vw] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "radial-gradient(ellipse 38% 42% at 48% 44%, rgba(216,250,78,0.10), transparent 70%), " +
            "radial-gradient(ellipse 46% 40% at 62% 74%, rgba(255,107,53,0.13), transparent 72%)",
        }}
        aria-hidden
      />

      <div className="shell relative z-10 pt-24 text-center">
        <p className="eyebrow reveal text-signal/90">Melbourne · High protein · Low carb</p>

        <h1
          className="reveal mx-auto mt-5 max-w-[16ch] text-display-xl font-semibold"
          style={{ "--reveal-delay": "90ms" } as React.CSSProperties}
        >
          Hit your macros without cooking.
        </h1>

        <p
          className="reveal mx-auto mt-6 max-w-[54ch] text-lg leading-relaxed text-bone/65"
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
            className="inline-flex h-14 w-full items-center justify-center rounded-full border border-bone/20 px-8 text-lg transition-colors hover:border-bone/50 hover:bg-bone/5 sm:w-auto"
          >
            See the menu
          </Link>
        </div>

        <p
          className="reveal mt-5 text-sm text-mute tnum"
          style={{ "--reveal-delay": "320ms" } as React.CSSProperties}
        >
          {stats.count} meals · {stats.avgProtein}g protein and {stats.avgCarbs}g carbs on average · from $11.95 a meal
        </p>
      </div>

      {/* The product. Bleeds off the bottom of the fold so the page invites a
          scroll rather than ending on a hard edge. */}
      {/* Positioned absolutely rather than chained through h-full: the parent
          is a flex item with no definite height, so a percentage height on a
          descendant resolves to zero and the photograph collapses. */}
      <div className="relative mt-10 min-h-[30vh] flex-1">
        <div
          className="reveal absolute inset-0 mx-auto w-full max-w-[84rem] px-5 md:px-10"
          style={{ "--reveal-delay": "380ms" } as React.CSSProperties}
        >
          <div className="relative h-full overflow-hidden rounded-t-3xl ring-1 ring-bone/12">
            <Image
              src="/photos/tray-overhead.jpg"
              alt="Three black meal prep trays photographed from above, each divided into compartments of protein, grains and greens"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 84rem"
              className="object-cover object-center"
            />
            {/* Scrim: lets the photograph sit on a near black page without a
                hard rectangular edge fighting the layout. */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(18,16,16,0.34) 0%, transparent 22%, transparent 74%, rgba(18,16,16,0.55) 100%)",
              }}
              aria-hidden
            />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex items-center justify-center gap-2 text-mute">
        <span className="eyebrow">Scroll</span>
        <span className="block h-px w-8 bg-bone/25" aria-hidden />
      </div>
    </section>
  );
}
