import { promises as fs } from "node:fs";
import path from "node:path";
import { menuStats } from "./db";

type SampledMeal = { kcal: number; protein: number; carbs: number };

type Competitor = {
  name: string;
  url: string;
  accessed: string;
  base: string;
  positioning: string;
  priceRange: { low: number; high: number } | null;
  scale: string;
  mealsSampled: SampledMeal[];
  sampleNote: string;
};

/**
 * The comparison shown on the landing page is read from the same evidence file
 * the coursework appendix is generated from, so the public claim and the cited
 * workings cannot drift apart.
 */
export async function comparisonRows() {
  const raw = await fs
    .readFile(path.join(process.cwd(), "data", "research.json"), "utf8")
    .then((t) => JSON.parse(t) as { competitors: Competitor[] })
    .catch(() => ({ competitors: [] as Competitor[] }));

  const stats = await menuStats();

  const rows = raw.competitors
    .filter((c) => c.mealsSampled?.length)
    .map((c) => {
      const n = c.mealsSampled.length;
      const avg = (k: keyof SampledMeal) => c.mealsSampled.reduce((s, m) => s + m[k], 0) / n;
      const protein = avg("protein");
      const kcal = avg("kcal");
      return {
        name: c.name,
        url: c.url,
        accessed: c.accessed,
        sample: n,
        price: c.priceRange,
        protein: Math.round(protein * 10) / 10,
        carbs: Math.round(avg("carbs") * 10) / 10,
        kcal: Math.round(kcal),
        density: Math.round((protein / kcal) * 1000) / 10,
        us: false,
      };
    });

  rows.push({
    name: "RATIO",
    url: "",
    accessed: new Date().toISOString().slice(0, 10),
    sample: stats.count,
    price: { low: 13.9, high: 22.9 },
    protein: stats.avgProtein,
    carbs: stats.avgCarbs,
    kcal: stats.avgKcal,
    density: stats.proteinPer100Kcal,
    us: true,
  });

  const others = rows.filter((r) => !r.us);
  const lowestOtherCarbs = others.length ? Math.min(...others.map((r) => r.carbs)) : 0;
  const highestOtherDensity = others.length ? Math.max(...others.map((r) => r.density)) : 0;

  return {
    rows: rows.sort((a, b) => a.carbs - b.carbs),
    lowestOtherCarbs,
    highestOtherDensity,
    carbReduction: lowestOtherCarbs ? Math.round((1 - stats.avgCarbs / lowestOtherCarbs) * 100) : 0,
    densityGap: Math.round((stats.proteinPer100Kcal - highestOtherDensity) * 10) / 10,
  };
}
