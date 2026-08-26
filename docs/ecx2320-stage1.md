# ECX2320 Stage 1: submission map

What the brief asks for, where it currently stands, and what is still yours to do.
Run `npm run preflight` for the machine checkable version of this table.

---

## Part 1: the artefact

The artefact is a landing page plus a working plan builder. Against the "minimum standard for a
pass" row for a landing page:

| Required | Status | Where |
|---|---|---|
| A headline naming the job to be done, not the technology | Done | "Hit your macros without cooking." No mention of an app, a platform or AI. |
| The problem in the customer's own words | **Blocked on you** | `src/components/landing/Problem.tsx` reads `data/voice.json`. The file is empty and the section renders nothing until it is filled. See the warning below. |
| How it works in three steps | Done | `HowItWorks.tsx`, three steps, checked by preflight. |
| A visible price or pricing page | Done | Pricing section with four tray sizes, a volume table, a delivery rule and a fully worked example. The price is also live in the builder footer from step one. |
| One call to action | Done | "Build your plan" ends in a reservation. Every instance routes through `CtaLink`, so each placement is measured separately. |
| Working analytics installed | Done | First party pipeline plus an optional GA4 or Plausible slot. Dashboard at `/insights`. |

### The one warning that matters

> The brief states that AI may not generate evidence, and that simulated customers, synthetic
> interview responses and invented survey data are **academic misconduct**.

Nothing in this repository contains a customer quote, a survey figure or a market statistic that
was generated rather than collected. `data/voice.json` ships empty and the quotes section renders
nothing rather than showing a plausible placeholder, because a plausible placeholder is exactly
the thing that gets accidentally submitted.

To fill it: collect three or four real statements, put them in `quotes[]` with an attribution, a
source and a collection date, set `status` to `verified`, and run `npm run preflight`. Acceptable
routes are listed in the file itself.

---

## Part 2: market research

| Must establish | Status |
|---|---|
| Size of the population your segment sits inside | **Open.** `segment_population` in `data/research.json`. |
| How many plausibly have the problem | **Open.** `problem_share`. |
| How many you could realistically reach and serve | **Open.** `kitchen_capacity`. |
| Who currently serves this need, and at what price | **Done.** Four named competitors, three with verified current prices, two with published macros. Read from each company's own live site on 2026-08-26, not from a comparison site. |
| What changed recently to make this a live opportunity | **Open.** `why_now`, with three candidates to verify listed. |

The competitor work is in `data/research.json` and rendered publicly on the landing page in the
"How we compare" section, which cites the access date and states the sample size.

### The finding that should shape your argument

The research contradicted the first version of this artefact, and the copy was changed to match
the evidence rather than the other way round.

- **Protein density is not a differentiator.** RATIO averages 10.6g of protein per 100 kcal. My
  Muscle Chef averages 10.2g across the seven meals it featured on its own homepage. That gap is
  noise. The landing page originally claimed protein density as a proof point; that claim has
  been removed.
- **Carbohydrate is the differentiator.** 16.3g a meal against 29.3g for the lowest carbohydrate
  competitor sampled, a 45 percent reduction at equivalent protein. This is the claim the
  evidence supports.
- **The segment tolerates a higher price than the mass market.** Muscle Meals Direct, the closest
  positioned competitor, charges $15.95 a meal against $10.95 to $12.95 for the mass market ready
  meal players. RATIO's $13.90 entry price sits between them, and that position is what needs
  defending in your pricing section.

Note the honest weakness: competitor macros come from meals each company chose to feature on its
own homepage. That is a convenience sample and it flatters them. Say so in the analysis.

---

## Part 3: economic concepts

See `docs/concept-checklist.md`. Every Week 1 to 4 concept is listed with what the brief asks you
to do with it, and where the artefact already gives you material for it.

---

## Part 4: calculations

`npm run calculations` regenerates `docs/appendix-b-calculations.md` from the data files.

| # | Calculation | Status |
|---|---|---|
| 1 | Market sizing | Blocked on `segment_population`, `problem_share`, `kitchen_capacity` |
| 2 | Demand schedule and total revenue | Instrumented, needs about 30 price observations |
| 3 | Own price elasticity, midpoint | Computes automatically once 2 has data |
| 4 | Competitor price comparison | **Done**, from primary sources |
| 5 | Capacity share | Blocked on `kitchen_capacity` |
| 6 | Innovation rent | Blocked on `cost_to_serve` |
| 7 | Opportunity cost and economic cost | Needs your hourly rate and hours a week |
| 8 | Cost to serve versus price | Blocked on `cost_to_serve` |

Calculations 2 and 3 are the interesting ones: the artefact is the instrument that collects them.
`price_seen` records the exact total on screen at the review step along with the plan that
produced it, and whether that session went on to reserve.

**Do not skip the caveat.** One price point observed passively is a reading, not a schedule. For
three genuine points you have to vary the price between visitors. The event payload already
carries the price, so you would add a variant assignment and read it back out of the same log.

---

## Suggested shape for the 1,000 words

The brief caps the analysis at 1,000 words and says markers stop at 1,100. Appendices are not
counted.

| Section | Words | What it has to do |
|---|---|---|
| Market definition, the problem, and the "why now" | 200 | State the market definition formula filled in. Name the current alternative and why it is not good enough. The "why now" needs a dated source and is currently open. |
| Market size and competitive landscape | 200 | Interpret calculation 1 and calculation 4. The competitor table is done; the sizing is not. |
| Demand, willingness to pay and elasticity | 250 | Interpret calculations 2 and 3. If the sample is still thin at submission, say so and state what you would need, rather than computing an elasticity from four observations. |
| Price architecture, pricing power and the first cost check | 250 | Four tray sizes are already a price discrimination structure: say why each segment self selects. Then calculations 6, 7 and 8. |
| The single assumption most likely to be wrong, and how you will test it in Stage 2 | 100 | See below. |

### A candidate for "the assumption most likely to be wrong"

That people will pay a premium over My Muscle Chef for lower carbohydrate.

It is the load bearing assumption, it is the one the evidence does not yet touch, and it is
cheaply testable: the artefact already records the price on screen and whether the session
converted, so varying the displayed price between visitors during Stage 2 tests it directly.

It is also genuinely uncertain rather than comfortable. A stronger submission argues it honestly
than one that picks an assumption it already knows the answer to.

---

## Submission checklist

- [ ] Artefact link or file
- [ ] Analysis, 1,000 words maximum
- [ ] Appendix A: artefact evidence and screenshots
- [ ] Appendix B: calculations (`npm run calculations` generates it)
- [ ] Appendix C: sources (`data/research.json` has the URLs and access dates)
- [ ] Appendix D: AI tools, prompt log, added value and limitations (`docs/appendix-d-ai.md` has a start)
