import type { Meal, PortionKey } from "@/lib/types";
import { scaleMeal } from "@/lib/plan";
import { TrayIso } from "./TrayIso";
import { MacroBar } from "./MacroBar";
import type { ReactNode } from "react";

const HEAT_LABEL = ["", "Mild heat", "Hot"];

export function MealCard({
  meal,
  portion = "regular",
  action,
  selected = false,
}: {
  meal: Meal;
  portion?: PortionKey;
  action?: ReactNode;
  selected?: boolean;
}) {
  const m = scaleMeal(meal, portion);

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-ink-2/60 transition-[border-color,background-color,transform,box-shadow] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:shadow-[0_28px_60px_-24px_rgba(0,0,0,0.75)] ${
        selected ? "border-signal/60 bg-signal/[0.06]" : "border-bone/10 hover:border-bone/25"
      }`}
    >
      <div className="relative aspect-[4/3] bg-gradient-to-b from-ink-3/50 to-ink-2/20 pt-2">
        <TrayIso components={meal.components} className="h-full w-full" />
        <div className="absolute right-3 top-3 rounded-full bg-ink/70 px-2.5 py-1 text-2xs font-medium backdrop-blur tnum">
          {m.kcal} kcal
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold leading-tight tracking-[-0.025em]">{meal.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-mute">{meal.blurb}</p>

        <div className="mt-4 flex items-baseline gap-3 tnum">
          <span className="text-2xl font-semibold tracking-[-0.045em] text-signal">{m.protein}g</span>
          <span className="text-xs text-mute">protein</span>
          <span className="ml-auto text-xs text-mute">{m.carbs}g carbs</span>
        </div>

        <MacroBar macros={m} showLabels={false} height={4} className="mt-3" />

        <div className="mt-4 flex items-center gap-2 text-2xs text-mute">
          <span className="rounded-full border border-bone/15 px-2 py-0.5 capitalize">{meal.category}</span>
          {meal.heat > 0 ? (
            <span className="rounded-full border border-ember/40 px-2 py-0.5 text-ember">{HEAT_LABEL[meal.heat]}</span>
          ) : null}
        </div>

        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </article>
  );
}
