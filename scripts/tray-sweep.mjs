#!/usr/bin/env node
/**
 * Tray sizing sweep. For every combination of goal, daily calorie target and
 * meals per day, take the tray the builder would recommend and measure how far
 * the average tray lands from the per-meal target. Reports how many of the
 * combinations land within 10 percent, and lists the ones that do not.
 *
 * The grid is 3 goals x 6 calorie targets x 2 meal counts = 36 combinations,
 * and it runs on whatever sizes are in src/lib/plan.ts, so it can be re-run
 * after any change to PORTIONS.
 *
 * Run: node scripts/tray-sweep.mjs   (Node 22.18 or later strips the types)
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { GOALS as GOAL_INFO, PORTIONS, goalMeanKcal, perMealTarget, recommendPortion } from "../src/lib/plan.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const raw = JSON.parse(readFileSync(resolve(root, "data/meals.json"), "utf8"));
// Same energy rule as the catalogue: protein and carbs 4 kcal a gram, fat 9.
const meals = raw.map((m) => ({ ...m, kcal: Math.round(m.protein * 4 + m.carbs * 4 + m.fat * 9) }));

const GOALS = ["cut", "maintain", "build"];
const TARGETS = [1500, 1900, 2300, 2800, 3200, 3500];
const MEALS_PER_DAY = [2, 3];
const TOLERANCE = 0.1;

let within = 0;
let total = 0;
let bandWithin = 0;
let bandTotal = 0;
const misses = [];
for (const goal of GOALS) {
  const avgBase = goalMeanKcal(meals, goal);
  for (const dailyKcal of TARGETS) {
    for (const mealsPerDay of MEALS_PER_DAY) {
      const spec = { goal, dailyKcal, mealsPerDay, days: 5 };
      const key = recommendPortion(spec, avgBase);
      const size = PORTIONS.find((p) => p.key === key);
      const target = perMealTarget({ ...spec, portion: "regular" }).kcal;
      const gap = (avgBase * size.multiplier - target) / target;
      const ok = Math.abs(gap) <= TOLERANCE;
      const [lo, hi] = GOAL_INFO.find((g) => g.key === goal).band;
      const inBand = dailyKcal >= lo && dailyKcal <= hi;
      total++;
      if (ok) within++;
      if (inBand) {
        bandTotal++;
        if (ok) bandWithin++;
      }
      if (!ok) misses.push(`${goal} ${dailyKcal} kcal x${mealsPerDay}: ${size.label}, ${(gap * 100).toFixed(1)}% from target${inBand ? "" : " (outside this goal's own band)"}`);
    }
  }
}

const EXPECTED_COMBINATIONS = 36;
if (total !== EXPECTED_COMBINATIONS) {
  console.error(`Swept ${total} combinations, expected ${EXPECTED_COMBINATIONS}. The grid has been narrowed.`);
  process.exit(1);
}
console.log(`Sizes: ${PORTIONS.map((p) => `${p.label} x${p.multiplier}`).join(", ")}`);
console.log(`${within} of ${total} combinations land within ${TOLERANCE * 100} percent of the per meal target.`);
console.log(`${bandWithin} of ${bandTotal} of those inside each goal's own calorie band (cut, maintain and build suggest different ranges).`);
if (misses.length) console.log(`Outside it:\n  ${misses.join("\n  ")}`);
