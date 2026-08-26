"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MacroBar } from "@/components/ui/MacroBar";
import {
  actualCoverage,
  DELIVERY_FEE,
  FREE_DELIVERY_OVER,
  goalInfo,
  money,
  num,
  perMealTarget,
  portion as portionInfo,
  priceBreakdown,
  scaleMeal,
  selectionAverage,
  selectionCount,
} from "@/lib/plan";
import { track } from "@/lib/track";
import type { Meal } from "@/lib/types";
import type { BuilderAction, BuilderState } from "./state";

export function StepReview({
  state,
  dispatch,
  meals,
}: {
  state: BuilderState;
  dispatch: (a: BuilderAction) => void;
  meals: Meal[];
}) {
  const router = useRouter();
  const count = selectionCount(state.selection);
  const price = priceBreakdown(state, count);
  const avg = selectionAverage(state.selection, meals, state.portion);
  const target = perMealTarget(state);
  const actual = actualCoverage(state, state.selection, meals);
  const started = useRef(false);
  const priceLogged = useRef(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [postcode, setPostcode] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The price the customer actually saw, recorded once. This is the figure a
  // willingness to pay reading has to be anchored on.
  useEffect(() => {
    if (priceLogged.current) return;
    priceLogged.current = true;
    track("review_view", { meals: count, goal: state.goal });
    track("price_seen", {
      total: price.total,
      per_meal: price.perMeal,
      portion: state.portion,
      meals: count,
      days: state.days,
      kcal: state.dailyKcal,
      goal: state.goal,
    });
    // Fires once per arrival at review, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function markStarted() {
    if (started.current) return;
    started.current = true;
    track("reserve_start", { total: price.total, meals: count });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: {
            goal: state.goal,
            dailyKcal: state.dailyKcal,
            days: state.days,
            mealsPerDay: state.mealsPerDay,
            portion: state.portion,
          },
          selection: state.selection,
          customer: { name: name.trim(), email: email.trim(), postcode: postcode.trim() },
          notes: notes.trim() || undefined,
        }),
      });

      const body = await response.json();
      if (!response.ok) {
        setError(body?.error ?? "Something went wrong. Try again.");
        track("reserve_error", { status: response.status });
        setBusy(false);
        return;
      }

      track("reserve_complete", { total: price.total, meals: count, code: body.code });
      router.push(`/order/${body.code}`);
    } catch {
      setError("Could not reach the kitchen. Check your connection and try again.");
      track("reserve_error", { status: 0 });
      setBusy(false);
    }
  }

  const lines = state.selection
    .map((line) => ({ line, meal: meals.find((m) => m.id === line.mealId) }))
    .filter((x): x is { line: typeof x.line; meal: Meal } => Boolean(x.meal));

  return (
    <div>
      <div className="max-w-[52ch]">
        <p className="eyebrow text-mute">Step four</p>
        <h1 className="mt-4 text-display-m font-semibold">Check the numbers.</h1>
        <p className="mt-5 text-base leading-relaxed text-bone/60">
          No payment is taken. Reserving holds a place in the first cook for your postcode and sends you the
          full macro breakdown by email.
        </p>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        <div>
          <section className="rounded-2xl border border-bone/12 bg-ink-2/60 p-7">
            <h2 className="eyebrow text-mute">The plan</h2>
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-base tnum">
              <Item label="Goal" value={goalInfo(state.goal).label} />
              <Item label="Daily target" value={`${num(state.dailyKcal)} kcal`} />
              <Item label="Plan length" value={`${state.days} days`} />
              <Item label="Meals a day" value={String(state.mealsPerDay)} />
              <Item label="Tray size" value={portionInfo(state.portion).label} />
              <Item label="Total trays" value={String(count)} />
            </dl>

            <div className="mt-7 border-t border-bone/12 pt-6">
              <div className="flex items-baseline justify-between">
                <h3 className="eyebrow text-mute">Average tray</h3>
                <p className="text-xs text-mute tnum">
                  target {target.kcal} kcal · {target.protein}g protein
                </p>
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.045em] tnum">
                {avg.kcal} kcal · {avg.protein}g protein
              </p>
              <MacroBar macros={avg} className="mt-4" />
            </div>

            {/* Computed from the meals actually chosen, not from the planned
                coverage share, so the shortfall shown here is the real one. */}
            <div className="mt-7 border-t border-bone/12 pt-6">
              <h3 className="eyebrow text-signal">Across a day, these trays give you</h3>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] tnum">
                {num(actual.covered.kcal)} kcal · {actual.covered.protein}g protein
              </p>
              <p className="mt-3 text-sm leading-relaxed text-bone/60 tnum">
                Against your {num(state.dailyKcal)} kcal target that leaves{" "}
                <strong className="font-semibold text-bone">{num(actual.remaining.kcal)} kcal</strong> and{" "}
                <strong className="font-semibold text-bone">{actual.remaining.protein}g of protein</strong> for
                breakfast, shakes and snacks.
              </p>
              {Math.abs(actual.trayDrift) >= 0.08 ? (
                <p className="mt-3 text-sm leading-relaxed text-macro-carbs tnum">
                  Your trays run {Math.abs(Math.round(actual.trayDrift * 100))} percent{" "}
                  {actual.trayDrift < 0 ? "under" : "over"} the per tray target. That is a real gap, not a rounding
                  error, and it is why the figure above is larger than the usual estimate.
                </p>
              ) : null}
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-bone/12 bg-ink-2/60 p-7">
            <div className="flex items-center justify-between">
              <h2 className="eyebrow text-mute">Your {count} trays</h2>
              <button
                type="button"
                onClick={() => dispatch({ type: "step", step: 2 })}
                className="text-sm text-bone/60 underline underline-offset-4 transition-colors hover:text-bone"
              >
                Change
              </button>
            </div>
            <ul className="mt-5 divide-y divide-bone/10">
              {lines.map(({ line, meal }) => {
                const m = scaleMeal(meal, state.portion);
                return (
                  <li key={meal.id} className="flex items-baseline justify-between gap-4 py-3">
                    <span className="flex-1 text-base">
                      <span className="text-mute tnum">{line.qty} &times; </span>
                      {meal.name}
                    </span>
                    <span className="text-sm text-mute tnum">
                      {m.kcal} kcal · {m.protein}g
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-2xl border border-bone/12 bg-ink-2/60 p-7">
            <h2 className="eyebrow text-mute">Price</h2>
            <dl className="mt-5 space-y-2.5 text-base tnum">
              <Line label={`${count} × ${money(price.unit)}`} value={money(price.subtotal)} />
              {price.rate > 0 ? (
                <Line label={`Volume discount, ${Math.round(price.rate * 100)}%`} value={`−${money(price.discount)}`} muted />
              ) : null}
              <Line
                label="Delivery"
                value={price.delivery === 0 ? "Free" : money(price.delivery)}
                muted
              />
              <div className="flex justify-between border-t border-bone/15 pt-3 text-2xl font-semibold tracking-[-0.04em]">
                <dt>Total</dt>
                <dd>{money(price.total)}</dd>
              </div>
            </dl>
            <p className="mt-2 text-sm text-mute tnum">{money(price.perMeal)} a meal, delivered.</p>
            {price.delivery > 0 ? (
              <p className="mt-3 text-xs text-mute tnum">
                Delivery is {money(DELIVERY_FEE)} under {money(FREE_DELIVERY_OVER)}. You are{" "}
                {money(FREE_DELIVERY_OVER - (price.subtotal - price.discount))} away from free delivery.
              </p>
            ) : null}
          </section>

          <form
            onSubmit={submit}
            onFocus={markStarted}
            onInput={markStarted}
            className="mt-4 rounded-2xl border border-bone/12 bg-ink-2/60 p-7"
          >
            <h2 className="eyebrow text-mute">Reserve your first week</h2>

            <Field id="name" label="Name" value={name} onChange={setName} autoComplete="name" required />
            <Field
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              required
            />
            <Field
              id="postcode"
              label="Postcode"
              value={postcode}
              onChange={(v) => setPostcode(v.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              autoComplete="postal-code"
              pattern="\d{4}"
              required
              hint="We open suburbs in order of demand, so this decides your cook date."
            />
            <Field
              id="notes"
              label="Anything we should know"
              value={notes}
              onChange={setNotes}
              optional
            />

            {error ? (
              <p role="alert" className="mt-4 rounded-lg border border-macro-fat/40 bg-macro-fat/10 px-4 py-3 text-sm">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy || count === 0}
              className="mt-6 h-14 w-full rounded-full bg-signal text-lg font-medium text-ink transition-[background-color,opacity] duration-300 hover:bg-[#dbff63] disabled:opacity-35"
            >
              {busy ? "Reserving..." : `Reserve ${count} meals`}
            </button>
            <p className="mt-3 text-center text-xs text-mute">
              No card required. Nothing is charged today.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-mute">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}

function Line({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? "text-bone/60" : ""}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required = false,
  optional = false,
  hint,
  ...rest
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
} & Omit<React.ComponentProps<"input">, "id" | "value" | "onChange" | "type" | "required">) {
  return (
    <div className="mt-5">
      <label htmlFor={id} className="flex items-baseline justify-between text-sm text-bone/70">
        {label}
        {optional ? <span className="text-2xs text-mute">Optional</span> : null}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-12 w-full rounded-xl border border-bone/15 bg-ink px-4 text-base text-bone transition-colors placeholder:text-mute focus:border-bone/45"
        {...rest}
      />
      {hint ? <p className="mt-1.5 text-xs leading-relaxed text-mute">{hint}</p> : null}
    </div>
  );
}
