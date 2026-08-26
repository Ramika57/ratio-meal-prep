# Appendix B: Calculations

Generated 2026-08-26 by `scripts/calculations.mjs`.

Every number below is computed from a file in `data/`. Nothing is typed in by hand, so re-running this script after changing the menu or the evidence file regenerates the whole appendix. Calculations marked **BLOCKED** are missing a verified input; the missing input is named rather than estimated.

## 4. Competitor price comparison

Read from each company's own live website on the access date, not from a coupon or comparison site. Prices are per meal in AUD.

| Provider | Base | Price per meal | Protein | Carbs | kcal | Protein per 100 kcal | Scale signal | Accessed |
|---|---|---|---|---|---|---|---|---|
| My Muscle Chef | National, delivers chilled Australia wide | $10.95 to $12.95 | 46.3g | 29.3g | 452 | 10.2g | 4.3 from 3,233 reviews shown on the homepage. Claims '#1 Healthy Ready Meal Brand', sourced on their page to Nielsen data to 09.09.25. | 2026-08-26 |
| Dineamic | Melbourne, Australian owned independent | $11.95 to $12.95 | 32.8g | 36.8g | 426 | 7.7g | Homepage claims 'OVER 3700+ 5 STAR REVIEWS', plus '4.5-star across 1,200+ reviews' and '4.6-star across 220+ reviews' from two named platforms. | 2026-08-26 |
| Muscle Meals Direct | Delivers to Melbourne among other cities | $15.95 | not published | not published | not published | n/a | No review count or customer number published on the homepage. | 2026-08-26 |
| Youfoodz | National | not published | not published | not published | not published | n/a | States over 80 meal options every week. | 2026-08-26 |
| **RATIO (this artefact)** | Melbourne | $13.90 to $22.90 by tray size | **43.5g** | **16.3g** | **409** | **10.6g** | pre revenue | 2026-08-26 |

Sample sizes: My Muscle Chef n=7, Dineamic n=4, Muscle Meals Direct n=0, Youfoodz n=0, RATIO n=20.

### What this table actually says

- **Protein density is not a differentiator.** RATIO sits at 10.6g of protein per 100 kcal. My Muscle Chef sits at 10.2g from its own published macros. The gap is 0.4g per 100 kcal, which is inside the noise of a seven meal convenience sample. Any claim to be "higher protein" than the incumbents is not supported.
- **Carbohydrate is the real gap.** RATIO averages 16.3g of carbohydrate a meal against 29.3g for the lowest carbohydrate competitor sampled (My Muscle Chef), a reduction of 45 percent. That is the defensible claim.
- **The segment supports a higher price than the mass market.** Muscle Meals Direct, the closest positioned competitor, charges $15.95 a meal. The mass market ready meal players sit at $10.95 to $12.95. RATIO's entry price of $13.90 sits between the two, which is the position that has to be defended.

## 2. Demand schedule and total revenue

**BLOCKED. Insufficient sample.** The artefact records the exact price on screen at the review step (`price_seen`) and whether that session went on to reserve. Right now there are **0** price observations and **0** reservations, which is far too few to build a demand schedule.

This is a data collection task, not a modelling task. Drive traffic to the artefact, let this accumulate, then re-run this script. The schedule below will populate itself. Note that observed conversion at a price you set is a demand *reading*, not a full schedule: to get three genuine price points you have to vary the price between visitors and record which one they saw.

## 1. Market sizing: population, share with the problem, realistically reachable

`reachable = population × share with the problem × share you can serve`

**BLOCKED.** Missing inputs:

- `segment_population` — Number of people in Greater Melbourne who train regularly with strength or physique goals. Source: AusPlay participation data by state and activity at clearinghouseforsport.gov.au, filtered to Victoria and to fitness or gym activities. Cross check against ABS Estimated Resident Population for Greater Melbourne.
- `problem_share` — Share of that population who both track macros and say time is what stops them prepping. Source: Your own intercept survey at a gym, with the instrument and raw responses kept for Appendix C. A published industry report is acceptable if you can cite the page.
- `kitchen_capacity` — Trays a week your kitchen can actually produce. Source: A quoted commercial kitchen hire rate and hours, or a named co packer's stated minimum and maximum run.

## 5. Capacity share

`capacity share = your weekly tray capacity ÷ estimated weekly market quantity`

**BLOCKED.** Missing inputs:

- `kitchen_capacity` — Trays a week your kitchen can actually produce. Source: A quoted commercial kitchen hire rate and hours, or a named co packer's stated minimum and maximum run.
- `segment_population` — Number of people in Greater Melbourne who train regularly with strength or physique goals. Source: AusPlay participation data by state and activity at clearinghouseforsport.gov.au, filtered to Victoria and to fitness or gym activities. Cross check against ABS Estimated Resident Population for Greater Melbourne.
- `problem_share` — Share of that population who both track macros and say time is what stops them prepping. Source: Your own intercept survey at a gym, with the instrument and raw responses kept for Appendix C. A published industry report is acceptable if you can cite the page.

## 6. Innovation rent

`rent per unit = (your price − your cost) − (incumbent price − estimated incumbent cost)`

**BLOCKED.** Missing inputs:

- `cost_to_serve` — Ingredient, packaging, labour and delivery cost of one tray. Source: Price a single recipe at wholesale, for example Bidfood or a market supplier, plus tray and film cost, plus a costed labour minute rate, plus a courier quote for a Melbourne metro drop.

Your price and the incumbent price are both verified in calculation 4. Only the two cost figures are missing, and the incumbent's cost has to be reasoned about openly rather than asserted.

## 7. Opportunity cost and economic cost

`economic cost = explicit cash cost + forgone earnings from the hours committed`

**BLOCKED.** Missing inputs:

- your own hourly rate and the hours a week this venture takes

This one only you can supply. It is not a research gap, it is a personal input.

## 8. Cost to serve one customer versus price

`gap = price per tray − (ingredients + packaging + labour + delivery share) per tray`

**BLOCKED.** Missing inputs:

- `cost_to_serve` — Ingredient, packaging, labour and delivery cost of one tray. Source: Price a single recipe at wholesale, for example Bidfood or a market supplier, plus tray and film cost, plus a costed labour minute rate, plus a courier quote for a Melbourne metro drop.

---

**Status: 1 of 8 calculations complete.** Calculation 4 is done from primary sources. Calculations 2 and 3 populate automatically once the artefact has collected roughly 30 price observations. The remaining five are blocked on 5 named evidence gaps listed in `data/research.json`, none of which have been filled with an estimate.

