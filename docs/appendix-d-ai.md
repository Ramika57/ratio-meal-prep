# Appendix D: AI tools, prompt log, added value and limitations

The brief caps this at 400 words plus the prompt log, and asks for three things: the tools used,
what value AI added with a concrete example, and **where AI was wrong, shallow or misleading**
with a specific example of what you changed or rejected and why.

This is a factual record of what happened while the artefact was built. Edit it into your own
voice, cut it to length, and verify anything you are not sure of. The third section is the one
markers weight most and the one most submissions fake, so the real examples are recorded in
detail below.

---

## 1. Tools used

| Tool | Used for |
|---|---|
| Claude (Opus 5) via Claude Code | Building the Next.js artefact, the nutrition model, the analytics pipeline, and reading competitor pricing pages in a browser |
| Node.js and TypeScript | The artefact itself |
| A browser, driven directly | Reading competitor prices and macros off live sites |

Add anything else you used before submitting.

---

## 2. What AI added

**Concrete example: the tray sizing bug.**

The nutrition model originally had three tray sizes at 1.0, 1.35 and 1.7 times a base recipe.
Rather than assume that worked, a short script swept all 36 combinations of goal, calorie target
and meals per day, and printed the gap between the tray the model would recommend and the tray
the target actually needed.

Six combinations came back more than 10 percent off, and one common case (a 1,900 kcal cut on
three meals a day) was 16 percent under. A fourth tray size was added and the recommendation was
changed to draw from the goal's own meal pool rather than the whole menu average. That took the
result to 30 of 36 combinations inside 10 percent, with the six failures all at 3,500 kcal where
a single tray would have to carry 960 kcal.

The value was not the code. It was the sweep: checking a product rule against its whole input
space in seconds, which surfaced a flaw that a demo of one happy path would never have shown.

---

## 3. Where AI was wrong, shallow or misleading

**Concrete example: an unsupported competitive claim, written confidently.**

The first version of the landing page carried a proof point reading "10.6g protein per 100 kcal,
protein density, not just total". It was generated from the menu data, so the arithmetic was
correct, and it was framed as a competitive advantage. Nothing in the process that produced it
had checked a single competitor.

Reading My Muscle Chef's own homepage gave macros for seven featured meals. Averaged, they come
to 10.2g of protein per 100 kcal against RATIO's 10.6g. **The claimed advantage was 0.4g per 100
kcal, which is inside the noise of a seven meal sample.** The differentiator did not exist.

What changed as a result:

1. The proof point was removed and replaced with carbohydrate per meal (16.3g against 29.3g, a
   45 percent reduction), which the same evidence does support.
2. A "How we compare" section was added to the landing page that publishes both figures,
   including the one that does not flatter the venture, with access dates and sample sizes.
3. The number is now computed from `data/research.json` at request time rather than typed into
   the component, so the public claim cannot outlive the evidence behind it.

The general lesson, stated plainly: **a model will produce a fluent, arithmetically correct
competitive claim without having looked at a single competitor.** The output was not a
hallucination in the usual sense, because every figure in it was real. It was a real number
presented as a comparison that had never been made. That is harder to catch than an invented
statistic, because it survives a fact check of its own contents.

**Second, smaller example: analytics that double counted.**

The first version of the funnel reported two price observations from one session, and reported
"0.0% of previous" for a stage whose predecessor was zero. The first was React StrictMode
double invoking an effect in development; the second was dividing by zero and formatting the
result as a percentage. Both were only visible because the dashboard was read against a session
whose real behaviour was known. Generated analytics code looked correct and was not.

---

## 4. What AI was not used for

No customer quote, survey response, interview, market statistic or population figure in this
submission was generated. `data/voice.json` ships empty and the landing page renders no quotes
section at all rather than a plausible placeholder. `data/research.json` lists five named
evidence gaps and `scripts/calculations.mjs` prints five of the eight required calculations as
BLOCKED rather than filling them with estimates.

This was a deliberate constraint, because the brief classes simulated customers and invented
survey data as academic misconduct, and because a plausible placeholder is exactly the thing
that gets submitted by accident.

---

## 5. Prompt log

Keep this as a chronological list of what you asked for and what you did with the output. A
marker is looking for evidence that you directed the work and reviewed it, not that you accepted
it. Entries where you rejected or changed the output are worth more than entries where you did not.

| # | What was asked | What came back | What you did with it |
|---|---|---|---|
| 1 | Build a modern landing page for a high protein, low carb meal prep business aimed at gym goers, with a plan builder and a file based database | Full Next.js artefact | Accepted as the base, then iterated |
| 2 | Attack the orders API with invalid payloads | 10 test cases, all rejections behaving correctly | Kept |
| 3 | Test concurrent writes to the file database | 12 simultaneous POSTs, 12 records, 12 unique codes | Kept |
| 4 | Read competitor prices from primary sources | Real prices and macros from four Australian providers | Kept, and it disproved the protein claim above |
| 5 | *(add your own entries from here)* | | |
