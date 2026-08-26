"use client";

import { useState } from "react";
import { MealCard } from "@/components/ui/MealCard";
import { track } from "@/lib/track";
import type { Goal, Meal } from "@/lib/types";

const FILTERS: { key: Goal | "all"; label: string }[] = [
  { key: "all", label: "Everything" },
  { key: "cut", label: "Cut" },
  { key: "maintain", label: "Maintain" },
  { key: "build", label: "Build" },
];

export default function MenuGrid({ meals, limit = 8 }: { meals: Meal[]; limit?: number }) {
  const [filter, setFilter] = useState<Goal | "all">("all");
  const [expanded, setExpanded] = useState(false);

  const filtered = filter === "all" ? meals : meals.filter((m) => m.goals.includes(filter));
  const shown = expanded ? filtered : filtered.slice(0, limit);

  return (
    <>
      <div className="mt-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            aria-pressed={filter === f.key}
            onClick={() => {
              setFilter(f.key);
              track("menu_filter", { filter: f.key });
            }}
            className={`h-11 rounded-full border px-5 text-[0.875rem] transition-colors duration-300 md:h-9 md:px-4 md:text-[0.8125rem] ${
              filter === f.key
                ? "border-bone bg-bone text-ink"
                : "border-bone/15 text-bone/65 hover:border-bone/40 hover:text-bone"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto self-center text-[0.75rem] text-mute tnum">
          {filtered.length} {filtered.length === 1 ? "meal" : "meals"}
        </span>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {shown.map((meal, i) => (
          <div key={meal.id} className="reveal" style={{ "--reveal-delay": `${(i % 4) * 70}ms` } as React.CSSProperties}>
            <MealCard meal={meal} />
          </div>
        ))}
      </div>

      {filtered.length > limit ? (
        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex h-11 items-center rounded-full border border-bone/20 px-6 text-[0.9375rem] transition-colors hover:border-bone/50 hover:bg-bone/5"
          >
            {expanded ? "Show fewer" : `Show all ${filtered.length}`}
          </button>
        </div>
      ) : null}
    </>
  );
}
