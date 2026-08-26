import type { Macros } from "@/lib/types";
import { KCAL_PER_G } from "@/lib/plan";

const TRACKS = [
  { key: "protein", label: "Protein", color: "var(--color-macro-protein)" },
  { key: "carbs", label: "Carbs", color: "var(--color-macro-carbs)" },
  { key: "fat", label: "Fat", color: "var(--color-macro-fat)" },
] as const;

/** Stacked bar showing where the energy in a meal actually comes from. */
export function MacroBar({
  macros,
  showLabels = true,
  height = 6,
  className = "",
}: {
  macros: Macros;
  showLabels?: boolean;
  height?: number;
  className?: string;
}) {
  const energy = {
    protein: macros.protein * KCAL_PER_G.protein,
    carbs: macros.carbs * KCAL_PER_G.carbs,
    fat: macros.fat * KCAL_PER_G.fat,
  };
  const total = energy.protein + energy.carbs + energy.fat || 1;

  return (
    <div className={className}>
      <div
        className="flex w-full overflow-hidden rounded-full bg-bone/10"
        style={{ height }}
        role="img"
        aria-label={`${macros.protein} grams protein, ${macros.carbs} grams carbohydrate, ${macros.fat} grams fat`}
      >
        {TRACKS.map((t) => (
          <div
            key={t.key}
            style={{ width: `${(energy[t.key] / total) * 100}%`, background: t.color }}
            className="transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          />
        ))}
      </div>
      {showLabels ? (
        <div className="mt-2.5 flex items-center gap-4 text-2xs text-mute tnum">
          {TRACKS.map((t) => (
            <span key={t.key} className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full" style={{ background: t.color }} aria-hidden />
              {t.label} {macros[t.key]}g
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
