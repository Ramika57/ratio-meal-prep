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

## What the script says, checked against evidence (updated 2026-10-23)

My first version of this section said the MACROS claims could not be supported. That was wrong for MACROS: I had relied on a search
summary. On 23 October the company's own pages were read (Stage 4 round 2, `evidence/macros_*_2026-10-23.*` in the ECX2320 `stage4` folder).

**Confirmed, and now on the site (the "Where this sits" line):**

- **MACROS exists, serves Melbourne and publishes macros.** 120 products, 72 single meals that pass the Stage 2 rule, delivery to over 1,900
  postcodes, a Melbourne page.
- **"A flat $15 fee, waived above a minimum spend": true of MACROS.** Its Melbourne page says "Orders over $150 enjoy free shipping and orders
  under $150 with a flat $15 delivery fee", and its cart enforces a $65 minimum order.
- **"$10.50 to $17.70": the top end is MACROS's dearest single meal** (a 450g Japanese Miso Salmon at $17.70). The lowest single meal price
  found anywhere is $10.79 (Youfoodz) and $10.95 (My Muscle Chef), so the script's "ten fifty" is about 30 cents under anything on a menu. With
  the range $10.79 to $17.70, Regular ($13.90) and Large ($16.40) sit inside it and XL ($19.40) and XXL ($22.90) sit above it, as the script says.

**Still not supported:**

- **Workout Meals.** One search found nothing to read. It is in no group evidence.
- **"My Muscle Chef ... use the same approach of a flat fee that disappears above a minimum spend."** Stage 2 recorded that My Muscle Chef waives
  shipping on a subscription, not above a spend. Youfoodz charges $9.99 a box at every size and never waives it. So "competitors" in general is
  too wide; MACROS is the one that does exactly this.
- **"Eight-meal minimum".** No competitor's rule and not RATIO's: MACROS's minimum is $65 (about 5.6 of its cheapest meals), and RATIO's smallest
  profitable order is 1 to 3 trays depending on the courier cost. Stage 4 found that RATIO's free-delivery line at $120 is the thing that bites:
  an order that crosses it earns $2.68 to $5.65 less than one tray smaller.
- **"30.4% ... about 1,620,000".** 30.4% of Greater Melbourne's 5,435,590 is about 1,650,000. The survey behind the percentage is not in the
  group's files.

## Where it is deployed

- **Presentation build:** https://ratio-meals-pitch.dry-star-c5f7.workers.dev (Worker `ratio-meals-pitch`, version
  `cdc3252e`, redeployed 2026-10-23 with the MACROS band; first deployed 2026-10-12). Config: `wrangler.pitch.jsonc`. It has its own D1 database, `ratio-meals-pitch-db`, so
  clicking through it while presenting writes nothing to the Stage 1 analytics.
- **Submitted Stage 1 site:** the `ratio-meals` Worker, version `2c8ad02f` (2026-08-30). Not touched, and the
  `main` branch is not touched, so the GitHub Pages site is unchanged.
- **Deploy again:** `npm run build:cf` then `npx wrangler deploy -c wrangler.pitch.jsonc`.
- **Undo:** `npx wrangler delete --name ratio-meals-pitch`.
- **Put this wording on the live Stage 1 site instead:** merge `pitch-alignment` into `main` and run
  `npm run build:cf` then `npx wrangler deploy`. Do that only if the Stage 1 submission no longer needs to look
  as it did when it was handed in.
