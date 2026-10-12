# Pitch alignment

The landing page's wording was changed to match the group presentation script ("Pitch Ratio"). Only copy and
two derived figures changed. The builder, prices, portions, delivery rule and every API are untouched.

## What changed

| Where | Was | Now |
| --- | --- | --- |
| Hero | "Hit your macros without cooking." for people who train | "Eating well, made easy." for people just starting out |
| Problem | "Nobody quits because the training got hard." | The busy Wednesday, the Sunday promise, and "not the bodybuilder" (the script's problem section) |
| How it works | Cut, maintain or build, "Regular, Large or XL" | Plain wording, and the four sizes Regular to XXL (the old text left XXL out) |
| Pricing | Large badged "Most ordered" | "A good place to start". `data/orders.json` is empty, so "Most ordered" had nothing behind it |
| Pricing | No protein cost | Cents a gram of protein on each size, computed from the displayed protein: 32c Regular, 27c XXL |
| Pricing | No price positioning | "Where this sits": the four brands' single-meal range, computed from `data/market-prices.json` |
| Proof strip | "Less carbohydrate than the lowest carb rival" | Cents a gram of protein, XXL against Regular |
| FAQ | Led with how macros are calculated | Leads with "I am new to this. Where do I start?" |
| Tagline, metadata, footer, CTA | Macro and gym wording | "Eating well, made easy" |

## What the script says that the repo cannot support

These were left off the site on purpose. Each needs a source before it is said or published.

- **MACROS and Workout Meals.** Neither is in `data/research.json` or the Stage 2 census. The brands the group
  priced are My Muscle Chef, Dineamic, Muscle Meals Direct and Youfoodz.
- **"$10.50 to $17.70".** The Stage 2 bands run from $10.79 (Youfoodz) to $16.95 (Dineamic). With that range
  Regular ($13.90) and Large ($16.40) sit inside it and XL ($19.40) and XXL ($22.90) sit above it, which is the
  structure the script describes.
- **"A flat $15 fee, waived above a minimum spend", for MACROS, My Muscle Chef and Workout Meals.** Not in any
  group evidence. Stage 2 recorded the opposite for Youfoodz ($9.99 shipping at every box size, never waived) and
  that My Muscle Chef waives shipping on subscription.
- **"Eight-meal minimum".** The site has no such rule. Free delivery is $120 after discount: eight Large meals
  ($131.20) clear it, eight Regular ($111.20) do not.
- **"30.4% ... about 1,620,000".** 30.4% of Greater Melbourne's 5,435,590 is about 1,650,000. The survey behind
  the percentage is not in the group's files.

## Where it is deployed

- **Presentation build:** https://ratio-meals-pitch.dry-star-c5f7.workers.dev (Worker `ratio-meals-pitch`, version
  `de43d8c1`, 2026-10-12). Config: `wrangler.pitch.jsonc`. It has its own D1 database, `ratio-meals-pitch-db`, so
  clicking through it while presenting writes nothing to the Stage 1 analytics.
- **Submitted Stage 1 site:** the `ratio-meals` Worker, version `2c8ad02f` (2026-08-30). Not touched, and the
  `main` branch is not touched, so the GitHub Pages site is unchanged.
- **Deploy again:** `npm run build:cf` then `npx wrangler deploy -c wrangler.pitch.jsonc`.
- **Undo:** `npx wrangler delete --name ratio-meals-pitch`.
- **Put this wording on the live Stage 1 site instead:** merge `pitch-alignment` into `main` and run
  `npm run build:cf` then `npx wrangler deploy`. Do that only if the Stage 1 submission no longer needs to look
  as it did when it was handed in.
