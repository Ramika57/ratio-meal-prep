"use client";

import { useMemo } from "react";
import { MealCard } from "@/components/ui/MealCard";
import { MacroBar } from "@/components/ui/MacroBar";
import {
  DAY_OPTIONS,
  GOALS,
  KCAL_MAX,
  KCAL_MIN,
  KCAL_STEP,
  PORTIONS,
  autoFill,
  coveredTargets,
  dailyTargets,
  goalMeanKcal,
  money,
  num,
  perMealTarget,
  remainingPerDay,
  selectionAverage,
  selectionCount,
} from "@/lib/plan";
import { track } from "@/lib/track";
import type { Meal, MealsPerDay } from "@/lib/types";
import type { BuilderAction, BuilderState } from "./state";

type StepProps = {
  state: BuilderState;
  dispatch: (a: BuilderAction) => void;
  meals: Meal[];
};

/* --------------------------------------------------------------- Step 1 */

export function StepGoal({ state, dispatch }: StepProps) {
  return (
    <div>
      <StepHead
        eyebrow="Step one"
        title="What is this week for?"
        note="This sets the macro split and steers which meals get recommended. You can change the calorie number on the next screen."
      />
      <div className="mt-10 grid gap-3 md:grid-cols-3">
        {GOALS.map((g) => {
          const active = state.goal === g.key;
          return (
            <button
              key={g.key}
              type="button"
              aria-pressed={active}
              onClick={() => {
                dispatch({ type: "goal", goal: g.key, suggested: g.suggested });
                track("goal_select", { location: "builder", goal: g.key });
              }}
              className={`flex flex-col rounded-2xl border p-7 text-left transition-[border-color,background-color] duration-300 ${
                active ? "border-signal bg-signal/[0.07]" : "border-bone/12 hover:border-bone/35"
              }`}
            >
              <span className="flex items-center justify-between">
                <span className="text-[1.375rem] font-semibold tracking-[-0.035em]">{g.label}</span>
                <Tick active={active} />
              </span>
              <span className="mt-2 text-[0.9375rem] text-bone/70">{g.line}</span>
              <span className="mt-4 text-[0.8125rem] leading-relaxed text-mute">{g.detail}</span>
              <span className="mt-5 eyebrow text-mute tnum">
                Typical {num(g.band[0])} to {num(g.band[1])} kcal
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- Step 2 */

export function StepTargets({ state, dispatch, meals }: StepProps) {
  const day = dailyTargets(state.goal, state.dailyKcal);
  const covered = coveredTargets(state);
  const left = remainingPerDay(state);
  const perMeal = perMealTarget(state);
  const avgBase = useMemo(() => goalMeanKcal(meals, state.goal), [meals, state.goal]);
  const fill = ((state.dailyKcal - KCAL_MIN) / (KCAL_MAX - KCAL_MIN)) * 100;

  return (
    <div>
      <StepHead
        eyebrow="Step two"
        title="Set the number."
        note="Everything downstream is derived from this. The split comes from your goal, and the tray size comes from the split."
      />

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
        <div>
          <div className="flex items-end justify-between">
            <label htmlFor="kcal" className="eyebrow text-mute">
              Calories a day
            </label>
            <output htmlFor="kcal" className="text-[3rem] font-semibold leading-none tracking-[-0.055em] tnum">
              {num(state.dailyKcal)}
            </output>
          </div>
          <input
            id="kcal"
            type="range"
            className="ratio-range mt-3"
            min={KCAL_MIN}
            max={KCAL_MAX}
            step={KCAL_STEP}
            value={state.dailyKcal}
            style={{ "--fill": `${fill}%` } as React.CSSProperties}
            onChange={(e) => dispatch({ type: "kcal", kcal: Number(e.target.value) })}
            onPointerUp={() => track("calories_set", { location: "builder", kcal: state.dailyKcal, goal: state.goal })}
          />
          <div className="flex justify-between text-[0.6875rem] text-mute tnum">
            <span>{num(KCAL_MIN)}</span>
            <span>{num(KCAL_MAX)}</span>
          </div>

          <MacroBar macros={day} className="mt-8" height={8} />

          <Choice
            className="mt-10"
            label="Meals a day from RATIO"
            options={[
              { value: 2, label: "2 meals", note: "covers about 55% of the day" },
              { value: 3, label: "3 meals", note: "covers about 75% of the day" },
            ]}
            value={state.mealsPerDay}
            onChange={(v) => {
              dispatch({ type: "mealsPerDay", mealsPerDay: v as MealsPerDay });
              track("meals_per_day_set", { value: v });
            }}
          />

          <div className="mt-10">
            <span className="eyebrow text-mute">Days in the plan</span>
            <div className="mt-4 flex flex-wrap gap-2">
              {DAY_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={state.days === d}
                  onClick={() => {
                    dispatch({ type: "days", days: d });
                    track("days_set", { days: d });
                  }}
                  className={`h-12 min-w-[4.5rem] rounded-full border px-5 text-[0.9375rem] font-medium transition-colors duration-300 tnum ${
                    state.days === d ? "border-bone bg-bone text-ink" : "border-bone/15 text-bone/70 hover:border-bone/40"
                  }`}
                >
                  {d} days
                </button>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <span className="eyebrow text-mute">Tray size</span>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {PORTIONS.map((p) => {
                const kcal = Math.round(avgBase * p.multiplier);
                const active = state.portion === p.key;
                const recommended = !state.portionTouched && active;
                return (
                  <button
                    key={p.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      dispatch({ type: "portion", portion: p.key });
                      track("portion_set", { portion: p.key });
                    }}
                    className={`rounded-2xl border p-5 text-left transition-colors duration-300 ${
                      active ? "border-signal bg-signal/[0.07]" : "border-bone/12 hover:border-bone/35"
                    }`}
                  >
                    <span className="flex items-center justify-between text-[1rem] font-semibold">
                      {p.label}
                      <Tick active={active} />
                    </span>
                    <span className="mt-1.5 block text-[0.8125rem] text-mute tnum">
                      about {kcal} kcal · {money(p.price)}
                    </span>
                    {recommended ? (
                      <span className="mt-2 inline-block eyebrow text-signal">Matched to your target</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live readout of what the plan does and does not cover. */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-bone/12 bg-ink-2/60 p-7">
            <h3 className="eyebrow text-mute">Your day at {num(state.dailyKcal)} kcal</h3>
            <dl className="mt-5 space-y-3 text-[0.9375rem] tnum">
              <Row label="Protein" value={`${day.protein}g`} />
              <Row label="Carbs" value={`${day.carbs}g`} />
              <Row label="Fat" value={`${day.fat}g`} />
            </dl>

            <div className="mt-6 border-t border-bone/12 pt-6">
              <h4 className="eyebrow text-signal">RATIO covers</h4>
              <p className="mt-3 text-[1.75rem] font-semibold tracking-[-0.045em] tnum">
                {num(covered.kcal)} kcal
              </p>
              <p className="mt-1 text-[0.875rem] text-bone/60 tnum">
                {covered.protein}g protein across {state.mealsPerDay} trays, so about {perMeal.kcal} kcal and{" "}
                {perMeal.protein}g a tray.
              </p>
            </div>

            <div className="mt-6 border-t border-bone/12 pt-6">
              <h4 className="eyebrow text-mute">You fill</h4>
              <p className="mt-3 text-[1.75rem] font-semibold tracking-[-0.045em] tnum">{num(left.kcal)} kcal</p>
              <p className="mt-1 text-[0.875rem] text-bone/60 tnum">
                {left.protein}g protein from breakfast, shakes and snacks.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- Step 3 */

export function StepMeals({ state, dispatch, meals }: StepProps) {
  const need = state.days * state.mealsPerDay;
  const chosen = selectionCount(state.selection);
  const target = perMealTarget(state);
  const avg = selectionAverage(state.selection, meals, state.portion);
  const qty = (id: string) => state.selection.find((l) => l.mealId === id)?.qty ?? 0;

  const sorted = useMemo(() => {
    // Meals that suit the goal first, then by protein density.
    return meals.slice().sort((a, b) => {
      const fa = a.goals.includes(state.goal) ? 0 : 1;
      const fb = b.goals.includes(state.goal) ? 0 : 1;
      if (fa !== fb) return fa - fb;
      return b.protein / b.kcal - a.protein / a.kcal;
    });
  }, [meals, state.goal]);

  return (
    <div>
      <StepHead
        eyebrow="Step three"
        title={`Choose ${need} meals.`}
        note={`Aim for about ${target.kcal} kcal and ${target.protein}g of protein a tray. The bar at the bottom tracks your running average against that.`}
      />

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            const slots = need - chosen;
            if (slots <= 0) return;
            dispatch({ type: "setSelection", selection: autoFill(state.selection, meals, state, slots) });
            track("autofill_used", { slots, goal: state.goal });
          }}
          disabled={chosen >= need}
          className="h-11 rounded-full bg-bone px-6 text-[0.9375rem] font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-30"
        >
          Fill the remaining {Math.max(0, need - chosen)}
        </button>
        {chosen > 0 ? (
          <button
            type="button"
            onClick={() => dispatch({ type: "clearSelection" })}
            className="h-11 rounded-full border border-bone/20 px-5 text-[0.9375rem] text-bone/70 transition-colors hover:border-bone/45 hover:text-bone"
          >
            Clear
          </button>
        ) : null}
        <p className="text-[0.8125rem] text-mute">
          Auto fill picks whatever moves your average closest to target, and spreads repeats.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((meal) => {
          const n = qty(meal.id);
          const fits = meal.goals.includes(state.goal);
          return (
            <MealCard
              key={meal.id}
              meal={meal}
              portion={state.portion}
              selected={n > 0}
              action={
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-[0.75rem] ${fits ? "text-signal" : "text-mute"}`}>
                    {fits ? `Suits ${state.goal}` : "Off goal"}
                  </span>
                  <Stepper
                    value={n}
                    canAdd={chosen < need}
                    onAdd={() => {
                      dispatch({ type: "add", mealId: meal.id });
                      track("meal_add", { meal: meal.id, goal: state.goal });
                    }}
                    onRemove={() => {
                      dispatch({ type: "remove", mealId: meal.id });
                      track("meal_remove", { meal: meal.id });
                    }}
                  />
                </div>
              }
            />
          );
        })}
      </div>

      {chosen > 0 ? <DriftNote avg={avg.kcal} target={target.kcal} protein={avg.protein} targetProtein={target.protein} /> : null}
    </div>
  );
}

/* --------------------------------------------------------------- Shared */

/**
 * States the miss rather than burying it. A tray average that lands 15 percent
 * under target is the difference between the promise and the product, so it is
 * said out loud with a way to fix it.
 */
function DriftNote({
  avg,
  target,
  protein,
  targetProtein,
}: {
  avg: number;
  target: number;
  protein: number;
  targetProtein: number;
}) {
  const drift = target ? (avg - target) / target : 0;
  const off = Math.abs(drift) >= 0.08;
  return (
    <div className="mt-10 text-center">
      <p className="text-[0.875rem] text-mute tnum">
        Running average: {avg} kcal and {protein}g protein a tray, against a target of {target} and {targetProtein}g.
      </p>
      {off ? (
        <p className={`mx-auto mt-2 max-w-[54ch] text-[0.8125rem] tnum ${drift < 0 ? "text-macro-carbs" : "text-macro-fat"}`}>
          That is {Math.abs(Math.round(drift * 100))} percent {drift < 0 ? "under" : "over"} target. Change the tray
          size on the previous step to close the gap, or leave it and we will show you the real shortfall at review.
        </p>
      ) : null}
    </div>
  );
}

function StepHead({ eyebrow, title, note }: { eyebrow: string; title: string; note: string }) {
  return (
    <div className="max-w-[52ch]">
      <p className="eyebrow text-mute">{eyebrow}</p>
      <h1 className="mt-4 text-display-m font-semibold">{title}</h1>
      <p className="mt-5 text-[1rem] leading-relaxed text-bone/60">{note}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-bone/55">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function Tick({ active }: { active: boolean }) {
  return (
    <span
      className={`grid size-5 place-items-center rounded-full border transition-colors duration-300 ${
        active ? "border-signal bg-signal" : "border-bone/25"
      }`}
      aria-hidden
    >
      {active ? (
        <svg viewBox="0 0 10 8" className="size-2.5 fill-none stroke-ink" strokeWidth={2}>
          <path d="M1 4l2.5 2.5L9 1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </span>
  );
}

function Choice({
  label,
  options,
  value,
  onChange,
  className = "",
}: {
  label: string;
  options: { value: number; label: string; note: string }[];
  value: number;
  onChange: (v: number) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <span className="eyebrow text-mute">{label}</span>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={`rounded-2xl border p-5 text-left transition-colors duration-300 ${
              value === o.value ? "border-signal bg-signal/[0.07]" : "border-bone/12 hover:border-bone/35"
            }`}
          >
            <span className="flex items-center justify-between text-[1rem] font-semibold">
              {o.label}
              <Tick active={value === o.value} />
            </span>
            <span className="mt-1.5 block text-[0.8125rem] text-mute">{o.note}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Stepper({
  value,
  canAdd,
  onAdd,
  onRemove,
}: {
  value: number;
  canAdd: boolean;
  onAdd: () => void;
  onRemove: () => void;
}) {
  if (value === 0) {
    return (
      <button
        type="button"
        onClick={onAdd}
        disabled={!canAdd}
        className="h-11 rounded-full bg-bone px-5 text-[0.875rem] font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-25 md:h-9 md:px-4 md:text-[0.8125rem]"
      >
        Add
      </button>
    );
  }
  return (
    <span className="flex items-center gap-1 rounded-full border border-signal/50 bg-signal/10 p-1">
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove one"
        className="grid size-9 place-items-center rounded-full text-bone transition-colors hover:bg-bone/10 md:size-7"
      >
        <span className="block h-px w-3 bg-current" />
      </button>
      <span className="min-w-5 text-center text-[0.875rem] font-semibold tnum">{value}</span>
      <button
        type="button"
        onClick={onAdd}
        disabled={!canAdd}
        aria-label="Add one"
        className="grid size-9 place-items-center rounded-full text-bone transition-colors hover:bg-bone/10 disabled:opacity-25 md:size-7"
      >
        <span className="relative block size-3">
          <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current" />
          <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-current" />
        </span>
      </button>
    </span>
  );
}

