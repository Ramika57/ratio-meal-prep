"use client";

import Link from "next/link";
import { useEffect, useMemo, useReducer, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { StepGoal, StepMeals, StepTargets } from "./Steps";
import { StepReview } from "./StepReview";
import { STEPS, initialState, reducer } from "./state";
import { goalMeanKcal, money, num, priceBreakdown, recommendPortion, selectionCount } from "@/lib/plan";
import { track } from "@/lib/track";
import type { Goal, Meal } from "@/lib/types";

const GOAL_KEYS: Goal[] = ["cut", "maintain", "build"];

export default function Builder({ meals }: { meals: Meal[] }) {
  const params = useSearchParams();

  // The landing page calculator hands its values across in the query string, so
  // nobody has to answer the same two questions twice.
  const seed = useMemo(() => {
    const g = params.get("goal");
    const k = Number(params.get("kcal"));
    const goal: Goal = GOAL_KEYS.includes(g as Goal) ? (g as Goal) : "maintain";
    const kcal = Number.isFinite(k) && k >= 1500 && k <= 3500 ? Math.round(k / 50) * 50 : 2300;
    return { goal, kcal };
  }, [params]);

  const [state, dispatch] = useReducer(reducer, seed, (s) => initialState(s.goal, s.kcal));
  const top = useRef<HTMLDivElement>(null);
  const startLogged = useRef(false);

  const avgBaseKcal = useMemo(() => goalMeanKcal(meals, state.goal), [meals, state.goal]);

  useEffect(() => {
    // Guarded because React StrictMode double invokes effects in development,
    // which would otherwise double every top of funnel count.
    if (startLogged.current) return;
    startLogged.current = true;
    track("builder_start", { goal: seed.goal, kcal: seed.kcal, prefilled: params.has("goal") });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the tray size matched to the target until the customer overrides it.
  useEffect(() => {
    if (state.portionTouched) return;
    const next = recommendPortion(
      { goal: state.goal, dailyKcal: state.dailyKcal, days: state.days, mealsPerDay: state.mealsPerDay },
      avgBaseKcal,
    );
    if (next !== state.portion) dispatch({ type: "portion", portion: next, auto: true });
  }, [state.goal, state.dailyKcal, state.mealsPerDay, state.days, state.portion, state.portionTouched, avgBaseKcal]);

  useEffect(() => {
    top.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [state.step]);

  const need = state.days * state.mealsPerDay;
  const chosen = selectionCount(state.selection);
  const price = priceBreakdown(state, chosen);
  // Before any trays are picked, quote the full plan rather than an empty basket,
  // which would otherwise read as the delivery fee alone.
  const estimate = priceBreakdown(state, need);
  const canContinue = state.step === 2 ? chosen === need : state.step < 3;

  const go = (step: number) => {
    track(step > state.step ? "step_advance" : "step_back", { from: state.step, to: step });
    dispatch({ type: "step", step });
  };

  return (
    <div className="flex min-h-[100svh] flex-col">
      <header className="sticky top-0 z-40 border-b border-bone/10 bg-ink/85 backdrop-blur-xl">
        <div className="shell flex h-16 items-center justify-between gap-6">
          <Link href="/" className="text-[1.0625rem] font-semibold tracking-[-0.05em]">
            RATIO
          </Link>

          <ol className="hidden items-center gap-1 md:flex" aria-label="Progress">
            {STEPS.map((label, i) => {
              const done = i < state.step;
              const active = i === state.step;
              return (
                <li key={label} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => (i <= state.step ? go(i) : undefined)}
                    disabled={i > state.step}
                    aria-current={active ? "step" : undefined}
                    className={`h-8 rounded-full px-3.5 text-[0.8125rem] transition-colors duration-300 ${
                      active ? "bg-bone text-ink" : done ? "text-bone/70 hover:text-bone" : "text-mute"
                    }`}
                  >
                    {label}
                  </button>
                  {i < STEPS.length - 1 ? <span className="h-px w-4 bg-bone/15" aria-hidden /> : null}
                </li>
              );
            })}
          </ol>

          <Link href="/" className="text-[0.8125rem] text-bone/55 transition-colors hover:text-bone">
            Exit
          </Link>
        </div>

        {/* Mobile progress: a bar rather than four labels that will not fit. */}
        <div className="h-0.5 w-full bg-bone/10 md:hidden" aria-hidden>
          <div
            className="h-full bg-signal transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ width: `${((state.step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </header>

      <main id="main" className="shell flex-1 pb-40 pt-12 md:pt-16">
        <div ref={top} className="scroll-mt-24" />
        {state.step === 0 ? <StepGoal state={state} dispatch={dispatch} meals={meals} /> : null}
        {state.step === 1 ? <StepTargets state={state} dispatch={dispatch} meals={meals} /> : null}
        {state.step === 2 ? <StepMeals state={state} dispatch={dispatch} meals={meals} /> : null}
        {state.step === 3 ? <StepReview state={state} dispatch={dispatch} meals={meals} /> : null}
      </main>

      {state.step < 3 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-bone/10 bg-ink/90 backdrop-blur-xl">
          <div className="shell flex h-20 items-center justify-between gap-4">
            <div className="min-w-0">
              {state.step === 2 ? (
                <>
                  <p className="text-[1.0625rem] font-semibold tnum">
                    {chosen} of {need} chosen
                  </p>
                  <p className="truncate text-[0.75rem] text-mute tnum">
                    {chosen > 0 ? `${money(price.total)} total, ${money(price.perMeal)} a meal` : "Pick your trays"}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[1.0625rem] font-semibold tnum">
                    {num(state.dailyKcal)} kcal · {state.days} days
                  </p>
                  <p className="truncate text-[0.75rem] text-mute tnum">
                    {need} trays, about {money(estimate.total)}
                  </p>
                </>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {state.step > 0 ? (
                <button
                  type="button"
                  onClick={() => go(state.step - 1)}
                  className="h-12 rounded-full border border-bone/20 px-5 text-[0.9375rem] transition-colors hover:border-bone/45"
                >
                  Back
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => go(state.step + 1)}
                disabled={!canContinue}
                className="h-12 rounded-full bg-signal px-7 text-[0.9375rem] font-medium text-ink transition-[background-color,opacity] duration-300 hover:bg-[#dbff63] disabled:opacity-30"
              >
                {state.step === 2 ? "Review" : "Continue"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
