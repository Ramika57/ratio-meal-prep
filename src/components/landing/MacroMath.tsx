"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MacroBar } from "@/components/ui/MacroBar";
import { track } from "@/lib/track";
import {
  COVERAGE,
  GOALS,
  KCAL_MAX,
  KCAL_MIN,
  KCAL_PER_G,
  KCAL_STEP,
  SPLIT,
  dailyTargets,
  num,
} from "@/lib/plan";
import type { Goal } from "@/lib/types";

/**
 * The macro math, shown rather than claimed.
 *
 * This is the same arithmetic the builder runs. Putting it on the landing page
 * lets someone check the logic before they trust us with a week of food.
 */
export default function MacroMath() {
  const [goal, setGoal] = useState<Goal>("maintain");
  const [kcal, setKcal] = useState(2300);

  const targets = useMemo(() => dailyTargets(goal, kcal), [goal, kcal]);
  const split = SPLIT[goal];
  const covered = Math.round(kcal * COVERAGE[3]);
  const coveredProtein = Math.round(targets.protein * COVERAGE[3]);

  const rows = [
    { key: "protein", label: "Protein", pct: split.protein, grams: targets.protein, per: KCAL_PER_G.protein, color: "var(--color-macro-protein)" },
    { key: "carbs", label: "Carbs", pct: split.carbs, grams: targets.carbs, per: KCAL_PER_G.carbs, color: "var(--color-macro-carbs)" },
    { key: "fat", label: "Fat", pct: split.fat, grams: targets.fat, per: KCAL_PER_G.fat, color: "var(--color-macro-fat)" },
  ];

  const fill = ((kcal - KCAL_MIN) / (KCAL_MAX - KCAL_MIN)) * 100;

  return (
    <section id="macros" className="scroll-mt-20 border-y border-bone/10 bg-ink-2">
      <div className="shell py-24 md:py-32">
        <div className="max-w-[54ch]">
          <p className="eyebrow reveal text-mute">04 · The macro math</p>
          <h2 className="reveal mt-5 text-display-m font-semibold">
            Here is the arithmetic. Check it before you trust it.
          </h2>
          <p className="reveal mt-6 text-base leading-relaxed text-bone/60">
            Protein and carbohydrate carry four calories a gram, fat carries nine. Everything below is that
            one fact, a percentage split, and a division.
          </p>
        </div>

        <div className="mt-14 grid gap-10 md:mt-16 md:grid-cols-2 md:gap-16">
          {/* Controls */}
          <div className="reveal">
            <fieldset>
              <legend className="eyebrow text-mute">Goal</legend>
              <div className="mt-4 grid grid-cols-3 gap-1 rounded-full border border-bone/15 p-1">
                {GOALS.map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => {
                      setGoal(g.key);
                      setKcal(g.suggested);
                      track("goal_select", { location: "macro_math", goal: g.key });
                    }}
                    aria-pressed={goal === g.key}
                    className={`h-10 rounded-full text-sm font-medium transition-colors duration-300 ${
                      goal === g.key ? "bg-bone text-ink" : "text-bone/60 hover:text-bone"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <p className="mt-4 min-h-[3.5rem] text-sm leading-relaxed text-bone/55">
              {GOALS.find((g) => g.key === goal)?.detail}
            </p>

            <div className="mt-10">
              <div className="flex items-end justify-between">
                <label htmlFor="macro-kcal" className="eyebrow text-mute">
                  Calories a day
                </label>
                <output htmlFor="macro-kcal" className="text-4xl font-semibold leading-none tracking-[-0.05em] tnum">
                  {num(kcal)}
                </output>
              </div>
              <input
                id="macro-kcal"
                type="range"
                className="ratio-range mt-3"
                min={KCAL_MIN}
                max={KCAL_MAX}
                step={KCAL_STEP}
                value={kcal}
                style={{ "--fill": `${fill}%` } as React.CSSProperties}
                onChange={(e) => setKcal(Number(e.target.value))}
                onPointerUp={() => track("calories_set", { location: "macro_math", kcal, goal })}
              />
              <div className="flex justify-between text-2xs text-mute tnum">
                <span>{num(KCAL_MIN)}</span>
                <span>{num(KCAL_MAX)}</span>
              </div>
            </div>
          </div>

          {/* Working */}
          <div className="reveal" style={{ "--reveal-delay": "110ms" } as React.CSSProperties}>
            <MacroBar macros={targets} showLabels={false} height={10} />

            <dl className="mt-8 divide-y divide-bone/10 border-y border-bone/10">
              {rows.map((r) => (
                <div key={r.key} className="grid grid-cols-[1fr_auto] items-baseline gap-4 py-4">
                  <dt className="flex items-center gap-2.5 text-base font-medium">
                    <span className="size-2 rounded-full" style={{ background: r.color }} aria-hidden />
                    {r.label}
                  </dt>
                  <dd className="text-right">
                    <div className="text-xs text-mute tnum">
                      {Math.round(r.pct * 100)}% of {num(kcal)} = {num(kcal * r.pct)} kcal &divide; {r.per}
                    </div>
                    <div className="mt-0.5 text-xl font-semibold tracking-[-0.04em] tnum">{r.grams}g</div>
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-7 rounded-2xl border border-bone/10 bg-bone/[0.03] p-6">
              <p className="text-base leading-relaxed text-bone/75">
                On three meals a day RATIO covers about {Math.round(COVERAGE[3] * 100)} percent of that:{" "}
                <strong className="font-semibold text-bone tnum">{num(covered)} kcal</strong> and{" "}
                <strong className="font-semibold text-bone tnum">{coveredProtein}g protein</strong>.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-mute">
                The remaining {num(kcal - covered)} kcal and {targets.protein - coveredProtein}g of protein are
                breakfast, shakes and snacks. We tell you the gap rather than pretending it is not there.
              </p>
              <Link
                href={`/build?goal=${goal}&kcal=${kcal}`}
                onClick={() => track("cta_click", { location: "macro_math", label: "take_into_builder", goal, kcal })}
                className="mt-6 inline-flex h-11 items-center rounded-full bg-signal px-6 text-base font-medium text-ink transition-colors hover:bg-[#dbff63]"
              >
                Take this into the builder
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
