#!/usr/bin/env node
/**
 * Submission gate for ECX2320 Stage 1.
 *
 * Checks the artefact against the "minimum standard for a pass" row for a
 * landing page, plus the evidence rules the brief sets. Exits non zero if a
 * hard requirement is unmet, so this can sit in a pre commit hook or CI.
 *
 * Run: npm run preflight
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (f, fallback) => {
  try {
    return JSON.parse(readFileSync(resolve(root, f), "utf8"));
  } catch {
    return fallback;
  }
};
const src = (f) => {
  try {
    return readFileSync(resolve(root, f), "utf8");
  } catch {
    return "";
  }
};

const fails = [];
const warns = [];
const passes = [];

const check = (ok, label, detail) => {
  if (ok) passes.push(label);
  else fails.push(`${label}\n     ${detail}`);
};
const soft = (ok, label, detail) => {
  if (ok) passes.push(label);
  else warns.push(`${label}\n     ${detail}`);
};

/* ------------------------ Part 1: the artefact must pass ------------------ */
const hero = src("src/components/landing/Hero.tsx");
const how = src("src/components/landing/HowItWorks.tsx");
const pricing = src("src/components/landing/Pricing.tsx");
const cta = src("src/components/ui/CtaLink.tsx");

check(
  /Hit your macros without cooking/.test(hero),
  "Headline names the job to be done, not the technology",
  "src/components/landing/Hero.tsx should lead with the customer's job.",
);

const steps = (how.match(/n: "0\d"/g) ?? []).length;
check(steps === 3, "How it works, in exactly three steps", `Found ${steps} steps in HowItWorks.tsx.`);

check(
  /\$\{p\.price\.toFixed\(2\)\}/.test(pricing),
  "A visible price on the page",
  "Pricing.tsx must render an actual dollar figure, not 'contact us'.",
);

check(
  cta.includes("track(\"cta_click\""),
  "One tracked call to action",
  "Every primary button must route through CtaLink so placements are measurable.",
);

/* ------------------------ the customer's own words ------------------------ */
const voice = read("data/voice.json", { status: "placeholder", quotes: [] });
const quotesOk =
  voice.status === "verified" &&
  Array.isArray(voice.quotes) &&
  voice.quotes.length >= 3 &&
  voice.quotes.every((q) => q.text && q.attribution && q.source && q.collected);

check(
  quotesOk,
  "The problem stated in the customer's own words",
  voice.status !== "verified"
    ? "data/voice.json is still marked 'placeholder'. Collect at least three real quotes, each with an attribution, a source and a collection date, then set status to 'verified'. The brief treats invented quotes as academic misconduct, so this cannot be filled in from an AI."
    : `Have ${voice.quotes?.length ?? 0} quotes, need 3, each with text, attribution, source and collected date.`,
);

/* ------------------------ analytics ---------------------------------------- */
const hasEvents = existsSync(resolve(root, "data/events.json"));
const events = read("data/events.json", []);
check(
  hasEvents,
  "Working analytics installed",
  "data/events.json is missing. The first party pipeline writes it on the first page view.",
);
soft(
  events.length >= 100,
  "Analytics has accumulated real traffic",
  `Only ${events.length} events recorded. Stage 2 is due end of Week 7 and needs traffic to have accumulated, so publish and drive visitors now rather than later.`,
);

const env = src(".env.local");
soft(
  /NEXT_PUBLIC_(GA_ID|PLAUSIBLE_DOMAIN)=\S/.test(env),
  "A second analytics source is configured",
  "Optional but cheap insurance. Copy .env.example to .env.local and add a GA4 measurement id or a Plausible domain, so you are not relying on one pipeline alone.",
);

/* ------------------------ Part 2: research --------------------------------- */
const research = read("data/research.json", { competitors: [], gaps: [] });
const priced = (research.competitors ?? []).filter((c) => c.priceRange && c.verified);
check(
  priced.length >= 3,
  "At least three named alternatives with actual current prices",
  `Only ${priced.length} competitors have a verified price. The brief asks for three.`,
);

const withMacros = (research.competitors ?? []).filter((c) => (c.mealsSampled ?? []).length > 0);
soft(
  withMacros.length >= 3,
  "Three or more competitors with published macros",
  `${withMacros.length} of ${(research.competitors ?? []).length} publish macros. Those that do not cannot appear in the comparison table.`,
);

const openGaps = (research.gaps ?? []).filter((g) => g.status !== "COLLECTED");
check(
  openGaps.length === 0,
  "Every market figure has a source and a date",
  `${openGaps.length} evidence gaps still open: ${openGaps.map((g) => g.id).join(", ")}.\n     ` +
    `These are the figures Parts 2 and 4 rest on. Fill them from published sources, set status to 'COLLECTED', ` +
    `and do not estimate them.`,
);

/* ------------------------ Part 4: calculations ----------------------------- */
const priceSeen = events.filter((e) => e.name === "price_seen").length;
soft(
  priceSeen >= 30,
  "Enough price observations for a demand schedule",
  `${priceSeen} recorded, want at least 30 before calculations 2 and 3 mean anything. To get real price points you must vary the price between visitors, not just observe one.`,
);

/* ------------------------ report ------------------------------------------- */
const line = "─".repeat(72);
console.log(`\n${line}\nECX2320 Stage 1 preflight\n${line}\n`);
console.log(`PASS (${passes.length})`);
for (const p of passes) console.log(`  ✓ ${p}`);

if (warns.length) {
  console.log(`\nWARN (${warns.length})`);
  for (const w of warns) console.log(`  ! ${w}`);
}

if (fails.length) {
  console.log(`\nBLOCKING (${fails.length})`);
  for (const f of fails) console.log(`  ✗ ${f}`);
}

console.log(`\n${line}`);
if (fails.length) {
  console.log(`Not ready to submit. ${fails.length} blocking item${fails.length === 1 ? "" : "s"} above.\n`);
  process.exit(1);
}
console.log("Artefact meets the Stage 1 pass criteria.\n");
