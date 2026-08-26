import type { Goal, Macros, Meal, MealsPerDay, PlanSpec, PortionKey, SelectionLine } from "./types";

/**
 * The whole nutrition model lives here. Every number the site quotes is derived
 * from these constants, so the marketing copy and the builder can never disagree.
 */

export const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const;

/** Energy split by goal. Carbs stay low across all three, protein stays high. */
export const SPLIT: Record<Goal, { protein: number; carbs: number; fat: number }> = {
  cut: { protein: 0.4, carbs: 0.18, fat: 0.42 },
  maintain: { protein: 0.35, carbs: 0.22, fat: 0.43 },
  build: { protein: 0.3, carbs: 0.35, fat: 0.35 },
};

export const GOALS: { key: Goal; label: string; line: string; detail: string; band: [number, number]; suggested: number }[] = [
  {
    key: "cut",
    label: "Cut",
    line: "Lose fat, keep the muscle you built",
    detail:
      "Runs roughly a 20 percent deficit. Protein goes up, not down, because a deficit is exactly when you are most at risk of losing lean tissue.",
    band: [1500, 2400],
    suggested: 1900,
  },
  {
    key: "maintain",
    label: "Maintain",
    line: "Hold your weight, train hard",
    detail:
      "Sits at your maintenance intake. Enough carbs to finish a session properly, not so many that the week drifts upward.",
    band: [1900, 2900],
    suggested: 2300,
  },
  {
    key: "build",
    label: "Build",
    line: "Add size without adding a gut",
    detail:
      "Roughly a 10 percent surplus with carbs pushed up around training. Slower than a dirty bulk on purpose, because you keep less fat to strip later.",
    band: [2400, 3500],
    suggested: 2800,
  },
];

export const KCAL_MIN = 1500;
export const KCAL_MAX = 3500;
export const KCAL_STEP = 50;

/** Share of the day the plan covers. The rest is breakfast, shakes and snacks. */
export const COVERAGE: Record<MealsPerDay, number> = { 2: 0.55, 3: 0.75 };

/**
 * Four sizes rather than three. With three, a 1,900 kcal cut on three meals a
 * day landed 16 percent under target because the gap between Regular and Large
 * was wider than the accuracy the product promises.
 */
export const PORTIONS: { key: PortionKey; label: string; multiplier: number; price: number }[] = [
  { key: "regular", label: "Regular", multiplier: 1, price: 13.9 },
  { key: "large", label: "Large", multiplier: 1.28, price: 16.4 },
  { key: "xl", label: "XL", multiplier: 1.6, price: 19.4 },
  { key: "xxl", label: "XXL", multiplier: 1.95, price: 22.9 },
];

export const DAY_OPTIONS = [3, 5, 7, 10, 14];

/** Volume tiers. Cooking 45 trays costs less per tray than cooking 6. */
export const VOLUME_TIERS: { min: number; rate: number }[] = [
  { min: 45, rate: 0.14 },
  { min: 30, rate: 0.1 },
  { min: 15, rate: 0.06 },
  { min: 0, rate: 0 },
];

export const DELIVERY_FEE = 9.9;
export const FREE_DELIVERY_OVER = 120;

export function portion(key: PortionKey) {
  return PORTIONS.find((p) => p.key === key) ?? PORTIONS[0];
}

export function goalInfo(key: Goal) {
  return GOALS.find((g) => g.key === key) ?? GOALS[1];
}

/** Daily macro targets in grams for a given goal and calorie intake. */
export function dailyTargets(goal: Goal, dailyKcal: number): Macros {
  const s = SPLIT[goal];
  return {
    kcal: dailyKcal,
    protein: Math.round((dailyKcal * s.protein) / KCAL_PER_G.protein),
    carbs: Math.round((dailyKcal * s.carbs) / KCAL_PER_G.carbs),
    fat: Math.round((dailyKcal * s.fat) / KCAL_PER_G.fat),
  };
}

/** What RATIO is responsible for: the meals in the plan, not the whole day. */
export function coveredTargets(spec: PlanSpec): Macros {
  const day = dailyTargets(spec.goal, spec.dailyKcal);
  const share = COVERAGE[spec.mealsPerDay];
  return {
    kcal: Math.round(day.kcal * share),
    protein: Math.round(day.protein * share),
    carbs: Math.round(day.carbs * share),
    fat: Math.round(day.fat * share),
  };
}

/** Target for a single tray. */
export function perMealTarget(spec: PlanSpec): Macros {
  const covered = coveredTargets(spec);
  const n = spec.mealsPerDay;
  return {
    kcal: Math.round(covered.kcal / n),
    protein: Math.round(covered.protein / n),
    carbs: Math.round(covered.carbs / n),
    fat: Math.round(covered.fat / n),
  };
}

/** What the customer still has to eat themselves each day, before choosing meals. */
export function remainingPerDay(spec: PlanSpec): Macros {
  const day = dailyTargets(spec.goal, spec.dailyKcal);
  const covered = coveredTargets(spec);
  return {
    kcal: day.kcal - covered.kcal,
    protein: day.protein - covered.protein,
    carbs: day.carbs - covered.carbs,
    fat: day.fat - covered.fat,
  };
}

/**
 * What the chosen trays actually deliver in a day, and what that actually
 * leaves. The planned coverage above is a design target; this is the outcome,
 * and the two differ whenever the basket average misses the per meal target.
 * Every customer facing number after meal selection uses these.
 */
export function actualCoverage(spec: PlanSpec, selection: SelectionLine[], meals: Meal[]) {
  const avg = selectionAverage(selection, meals, spec.portion);
  const n = spec.mealsPerDay;
  const covered: Macros = {
    kcal: avg.kcal * n,
    protein: avg.protein * n,
    carbs: avg.carbs * n,
    fat: avg.fat * n,
  };
  const day = dailyTargets(spec.goal, spec.dailyKcal);
  return {
    perTray: avg,
    covered: {
      kcal: Math.round(covered.kcal),
      protein: Math.round(covered.protein),
      carbs: Math.round(covered.carbs),
      fat: Math.round(covered.fat),
    },
    remaining: {
      kcal: Math.round(day.kcal - covered.kcal),
      protein: Math.round(day.protein - covered.protein),
      carbs: Math.round(day.carbs - covered.carbs),
      fat: Math.round(day.fat - covered.fat),
    },
    /** Signed share by which the average tray misses its target, for display. */
    trayDrift: (() => {
      const target = perMealTarget(spec);
      if (!target.kcal || !avg.kcal) return 0;
      return (avg.kcal - target.kcal) / target.kcal;
    })(),
  };
}

export function scaleMeal(meal: Meal, key: PortionKey): Macros {
  const m = portion(key).multiplier;
  return {
    kcal: Math.round(meal.kcal * m),
    protein: Math.round(meal.protein * m),
    carbs: Math.round(meal.carbs * m),
    fat: Math.round(meal.fat * m),
  };
}

/**
 * Mean energy of the meals a given goal will actually draw from. Recommending a
 * tray size off the whole menu average is wrong when the goal filter skews the
 * pool low, which is exactly what "cut" does.
 */
export function goalMeanKcal(meals: Meal[], goal: Goal): number {
  const pool = meals.filter((m) => m.goals.includes(goal));
  const source = pool.length >= 4 ? pool : meals;
  if (!source.length) return 400;
  return source.reduce((s, m) => s + m.kcal, 0) / source.length;
}

/** Pick the portion whose scaled size lands closest to the per meal target. */
export function recommendPortion(spec: Omit<PlanSpec, "portion">, avgBaseKcal: number): PortionKey {
  const target = perMealTarget({ ...spec, portion: "regular" });
  let best = PORTIONS[0];
  let bestGap = Infinity;
  for (const p of PORTIONS) {
    const gap = Math.abs(avgBaseKcal * p.multiplier - target.kcal);
    if (gap < bestGap) {
      bestGap = gap;
      best = p;
    }
  }
  return best.key;
}

export function totalMeals(spec: PlanSpec) {
  return spec.days * spec.mealsPerDay;
}

export function selectionCount(selection: SelectionLine[]) {
  return selection.reduce((s, l) => s + l.qty, 0);
}

/** Average macros of the chosen basket, at the chosen portion size. */
export function selectionAverage(selection: SelectionLine[], meals: Meal[], key: PortionKey): Macros {
  const count = selectionCount(selection);
  if (count === 0) return { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  const sum = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  for (const line of selection) {
    const meal = meals.find((m) => m.id === line.mealId);
    if (!meal) continue;
    const s = scaleMeal(meal, key);
    sum.kcal += s.kcal * line.qty;
    sum.protein += s.protein * line.qty;
    sum.carbs += s.carbs * line.qty;
    sum.fat += s.fat * line.qty;
  }
  return {
    kcal: Math.round(sum.kcal / count),
    protein: Math.round(sum.protein / count),
    carbs: Math.round(sum.carbs / count),
    fat: Math.round(sum.fat / count),
  };
}

export function volumeRate(meals: number) {
  return VOLUME_TIERS.find((t) => meals >= t.min)?.rate ?? 0;
}

export function priceBreakdown(spec: PlanSpec, mealCount: number) {
  const unit = portion(spec.portion).price;
  const subtotal = unit * mealCount;
  const rate = volumeRate(mealCount);
  const discount = subtotal * rate;
  const afterDiscount = subtotal - discount;
  const delivery = afterDiscount >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE;
  return {
    unit,
    subtotal: round2(subtotal),
    rate,
    discount: round2(discount),
    delivery: round2(delivery),
    total: round2(afterDiscount + delivery),
    perMeal: mealCount ? round2((afterDiscount + delivery) / mealCount) : 0,
  };
}

/**
 * Fills the remaining slots with whichever meals move the basket average closest
 * to target. Greedy, one slot at a time, so it self corrects as it goes.
 */
export function autoFill(
  selection: SelectionLine[],
  meals: Meal[],
  spec: PlanSpec,
  slots: number,
): SelectionLine[] {
  const target = perMealTarget(spec);
  const pool = meals.filter((m) => m.goals.includes(spec.goal));
  const candidates = pool.length >= 4 ? pool : meals;
  const next = selection.map((l) => ({ ...l }));

  for (let i = 0; i < slots; i++) {
    let bestId = candidates[0].id;
    let bestScore = Infinity;
    for (const meal of candidates) {
      const trial = addTo(next, meal.id);
      const avg = selectionAverage(trial, meals, spec.portion);
      const used = trial.find((l) => l.mealId === meal.id)?.qty ?? 1;
      // Distance to target, plus a nudge away from ordering the same tray daily.
      const score =
        Math.abs(avg.kcal - target.kcal) / 40 +
        Math.abs(avg.protein - target.protein) / 6 +
        Math.max(0, avg.carbs - target.carbs) / 8 +
        used * 1.6;
      if (score < bestScore) {
        bestScore = score;
        bestId = meal.id;
      }
    }
    const line = next.find((l) => l.mealId === bestId);
    if (line) line.qty += 1;
    else next.push({ mealId: bestId, qty: 1 });
  }
  return next;
}

function addTo(selection: SelectionLine[], mealId: string): SelectionLine[] {
  const copy = selection.map((l) => ({ ...l }));
  const line = copy.find((l) => l.mealId === mealId);
  if (line) line.qty += 1;
  else copy.push({ mealId, qty: 1 });
  return copy;
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function money(n: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(n);
}

export function num(n: number) {
  return new Intl.NumberFormat("en-AU").format(Math.round(n));
}
