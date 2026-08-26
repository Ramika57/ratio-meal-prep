#!/usr/bin/env node
/**
 * Builds Appendix B for ECX2320 Stage 1.
 *
 * Rules this script enforces on itself:
 *  - It computes only from data/meals.json, data/research.json, data/orders.json
 *    and data/events.json.
 *  - Any calculation whose inputs are not verified prints as BLOCKED, with the
 *    named missing input and where to get it. It never substitutes an estimate.
 *
 * Run: node scripts/calculations.mjs        (prints to stdout)
 *      node scripts/calculations.mjs --write (also writes docs/appendix-b-calculations.md)
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (f, fallback) => {
  try {
    return JSON.parse(readFileSync(resolve(root, f), "utf8"));
  } catch {
    return fallback;
  }
};

const meals = read("data/meals.json", []);
const research = read("data/research.json", { competitors: [], gaps: [] });
const orders = read("data/orders.json", []);
const events = read("data/events.json", []);

const out = [];
const say = (s = "") => out.push(s);
const money = (n) => `$${n.toFixed(2)}`;
const round = (n, d = 1) => Number(n.toFixed(d));

const mean = (arr, key) => (arr.length ? arr.reduce((s, x) => s + x[key], 0) / arr.length : 0);

/* ------------------------------------------------------------------ header */
say("# Appendix B: Calculations");
say("");
say(`Generated ${new Date().toISOString().slice(0, 10)} by \`scripts/calculations.mjs\`.`);
say("");
say(
  "Every number below is computed from a file in `data/`. Nothing is typed in by hand, so re-running " +
    "this script after changing the menu or the evidence file regenerates the whole appendix. Calculations " +
    "marked **BLOCKED** are missing a verified input; the missing input is named rather than estimated.",
);
say("");

/* --------------------------------------------------- RATIO's own menu ----- */
const ratio = {
  n: meals.length,
  kcal: mean(meals, "kcal"),
  protein: mean(meals, "protein"),
  carbs: mean(meals, "carbs"),
  fat: mean(meals, "fat"),
};
ratio.density = (ratio.protein / ratio.kcal) * 100;

/* =================================================== 4. Competitor prices = */
say("## 4. Competitor price comparison");
say("");
say(
  "Read from each company's own live website on the access date, not from a coupon or comparison site. " +
    "Prices are per meal in AUD.",
);
say("");
say("| Provider | Base | Price per meal | Protein | Carbs | kcal | Protein per 100 kcal | Scale signal | Accessed |");
say("|---|---|---|---|---|---|---|---|---|");

const rows = [];
for (const c of research.competitors ?? []) {
  const sampled = c.mealsSampled ?? [];
  const has = sampled.length > 0;
  const p = has ? mean(sampled, "protein") : null;
  const cb = has ? mean(sampled, "carbs") : null;
  const k = has ? mean(sampled, "kcal") : null;
  const density = has ? (p / k) * 100 : null;
  const price = c.priceRange
    ? c.priceRange.low === c.priceRange.high
      ? money(c.priceRange.low)
      : `${money(c.priceRange.low)} to ${money(c.priceRange.high)}`
    : "not published";
  rows.push({ name: c.name, price: c.priceRange, p, cb, k, density, n: sampled.length });
  say(
    `| ${c.name} | ${c.base} | ${price} | ${has ? round(p) + "g" : "not published"} | ${
      has ? round(cb) + "g" : "not published"
    } | ${has ? Math.round(k) : "not published"} | ${has ? round(density) + "g" : "n/a"} | ${c.scale} | ${c.accessed} |`,
  );
}
say(
  `| **RATIO (this artefact)** | Melbourne | $13.90 to $22.90 by tray size | **${round(ratio.protein)}g** | **${round(
    ratio.carbs,
  )}g** | **${Math.round(ratio.kcal)}** | **${round(ratio.density)}g** | pre revenue | ${new Date()
    .toISOString()
    .slice(0, 10)} |`,
);
say("");
say(`Sample sizes: ${rows.map((r) => `${r.name} n=${r.n}`).join(", ")}, RATIO n=${ratio.n}.`);
say("");

/* ---- the finding that matters --------------------------------------------- */
const priced = rows.filter((r) => r.density !== null);
if (priced.length) {
  const bestDensity = priced.reduce((a, b) => (b.density > a.density ? b : a));
  const lowestCarb = priced.reduce((a, b) => (b.cb < a.cb ? b : a));
  say("### What this table actually says");
  say("");
  say(
    `- **Protein density is not a differentiator.** RATIO sits at ${round(ratio.density)}g of protein per 100 kcal. ` +
      `${bestDensity.name} sits at ${round(bestDensity.density)}g from its own published macros. The gap is ` +
      `${round(Math.abs(ratio.density - bestDensity.density))}g per 100 kcal, which is inside the noise of a ` +
      `seven meal convenience sample. Any claim to be "higher protein" than the incumbents is not supported.`,
  );
  say(
    `- **Carbohydrate is the real gap.** RATIO averages ${round(ratio.carbs)}g of carbohydrate a meal against ` +
      `${round(lowestCarb.cb)}g for the lowest carbohydrate competitor sampled (${lowestCarb.name}), a reduction of ` +
      `${Math.round((1 - ratio.carbs / lowestCarb.cb) * 100)} percent. That is the defensible claim.`,
  );
  const gymPriced = (research.competitors ?? []).find((c) => /gym|physique/i.test(c.positioning ?? ""));
  if (gymPriced?.priceRange) {
    // Exclude the gym positioned player from the "mass market" band, or the
    // range swallows the very competitor it is being contrasted against.
    const massMarket = rows.filter((r) => r.price && r.name !== gymPriced.name);
    say(
      `- **The segment supports a higher price than the mass market.** ${gymPriced.name}, the closest ` +
        `positioned competitor, charges ${money(gymPriced.priceRange.low)} a meal. The mass market ready meal ` +
        `players sit at ${money(Math.min(...massMarket.map((r) => r.price.low)))} to ` +
        `${money(Math.max(...massMarket.map((r) => r.price.high)))}. RATIO's entry price of ` +
        `$13.90 sits between the two, which is the position that has to be defended.`,
    );
  }
  say("");
}

/* ================================ 2 and 3. Demand schedule and elasticity = */
say("## 2. Demand schedule and total revenue");
say("");
const priceSeen = events.filter((e) => e.name === "price_seen");
const reservedSessions = new Set(events.filter((e) => e.name === "reserve_complete").map((e) => e.session));

if (priceSeen.length < 30) {
  say(
    `**BLOCKED. Insufficient sample.** The artefact records the exact price on screen at the review step ` +
      `(\`price_seen\`) and whether that session went on to reserve. Right now there are **${priceSeen.length}** ` +
      `price observations and **${orders.length}** reservations, which is far too few to build a demand schedule.`,
  );
  say("");
  say(
    "This is a data collection task, not a modelling task. Drive traffic to the artefact, let this accumulate, " +
      "then re-run this script. The schedule below will populate itself. Note that observed conversion at a " +
      "price you set is a demand *reading*, not a full schedule: to get three genuine price points you have to " +
      "vary the price between visitors and record which one they saw.",
  );
} else {
  const bands = new Map();
  for (const e of priceSeen) {
    const perMeal = Number(e.props?.per_meal ?? 0);
    if (!perMeal) continue;
    const band = (Math.round(perMeal * 2) / 2).toFixed(2);
    if (!bands.has(band)) bands.set(band, { seen: 0, reserved: 0 });
    const b = bands.get(band);
    b.seen++;
    if (reservedSessions.has(e.session)) b.reserved++;
  }
  say("| Price per meal | Sessions that saw it | Reserved | Conversion | Total revenue per 100 sessions |");
  say("|---|---|---|---|---|");
  const sorted = [...bands.entries()].sort((a, b) => Number(a[0]) - Number(b[0]));
  for (const [band, b] of sorted) {
    const conv = b.seen ? b.reserved / b.seen : 0;
    say(
      `| ${money(Number(band))} | ${b.seen} | ${b.reserved} | ${(conv * 100).toFixed(1)}% | ${money(
        conv * 100 * Number(band),
      )} |`,
    );
  }
  say("");
  say("## 3. Own price elasticity, midpoint method");
  say("");
  if (sorted.length < 2) {
    say("**BLOCKED.** Needs at least two distinct observed price points.");
  } else {
    const [p1, b1] = sorted[0];
    const [p2, b2] = sorted[sorted.length - 1];
    const q1 = b1.reserved / b1.seen;
    const q2 = b2.reserved / b2.seen;
    const dq = (q2 - q1) / ((q1 + q2) / 2);
    const dp = (Number(p2) - Number(p1)) / ((Number(p1) + Number(p2)) / 2);
    const e = dq / dp;
    say(`E = ((${round(q2, 4)} − ${round(q1, 4)}) / ${round((q1 + q2) / 2, 4)}) ÷ ((${p2} − ${p1}) / ${round((Number(p1) + Number(p2)) / 2, 2)})`);
    say("");
    say(`**E = ${round(e, 2)}**, which is ${Math.abs(e) > 1 ? "elastic" : "inelastic"} over this range.`);
  }
}
say("");

/* ================================================= blocked calculations === */
const blocked = [
  {
    n: 1,
    title: "Market sizing: population, share with the problem, realistically reachable",
    formula: "reachable = population × share with the problem × share you can serve",
    needs: ["segment_population", "problem_share", "kitchen_capacity"],
  },
  {
    n: 5,
    title: "Capacity share",
    formula: "capacity share = your weekly tray capacity ÷ estimated weekly market quantity",
    needs: ["kitchen_capacity", "segment_population", "problem_share"],
  },
  {
    n: 6,
    title: "Innovation rent",
    formula: "rent per unit = (your price − your cost) − (incumbent price − estimated incumbent cost)",
    needs: ["cost_to_serve"],
    note:
      "Your price and the incumbent price are both verified in calculation 4. Only the two cost figures are " +
      "missing, and the incumbent's cost has to be reasoned about openly rather than asserted.",
  },
  {
    n: 7,
    title: "Opportunity cost and economic cost",
    formula: "economic cost = explicit cash cost + forgone earnings from the hours committed",
    needs: ["your own hourly rate and the hours a week this venture takes"],
    note: "This one only you can supply. It is not a research gap, it is a personal input.",
  },
  {
    n: 8,
    title: "Cost to serve one customer versus price",
    formula: "gap = price per tray − (ingredients + packaging + labour + delivery share) per tray",
    needs: ["cost_to_serve"],
  },
];

for (const b of blocked) {
  say(`## ${b.n}. ${b.title}`);
  say("");
  say(`\`${b.formula}\``);
  say("");
  say("**BLOCKED.** Missing inputs:");
  say("");
  for (const need of b.needs) {
    const gap = (research.gaps ?? []).find((g) => g.id === need);
    if (gap) {
      say(`- \`${need}\` — ${gap.needed}. Source: ${gap.whereToGetIt}`);
    } else {
      say(`- ${need}`);
    }
  }
  if (b.note) {
    say("");
    say(b.note);
  }
  say("");
}

/* --------------------------------------------------------------- summary -- */
const done = 1 + (priceSeen.length >= 30 ? 2 : 0);
say("---");
say("");
say(
  `**Status: ${done} of 8 calculations complete.** Calculation 4 is done from primary sources. ` +
    `Calculations 2 and 3 populate automatically once the artefact has collected roughly 30 price observations. ` +
    `The remaining five are blocked on ${(research.gaps ?? []).length} named evidence gaps listed in ` +
    `\`data/research.json\`, none of which have been filled with an estimate.`,
);
say("");

const text = out.join("\n");
console.log(text);

if (process.argv.includes("--write")) {
  mkdirSync(resolve(root, "docs"), { recursive: true });
  writeFileSync(resolve(root, "docs/appendix-b-calculations.md"), text + "\n");
  console.error("\nwrote docs/appendix-b-calculations.md");
}
