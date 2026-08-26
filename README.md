# RATIO

High protein, low carb meal prep for people who train, portioned to a calorie target the
customer sets. Built as the customer facing artefact for **ECX2320 Venture Sprint, Stage 1**.

Melbourne. Prototype. No payment is processed and no meals are cooked.

---

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:8110.

| Route | What it is |
|---|---|
| `/` | The landing page |
| `/build` | The four step plan builder, ending in a reservation |
| `/order/[code]` | Reservation confirmation, read back out of the file database |
| `/insights` | First party analytics dashboard: funnel, price seen, demand shape |
| `/api/meals` | The menu as JSON |
| `/api/orders` | `GET` all reservations, `POST` a new one |
| `/api/events` | `POST` an analytics event, `GET` the log |

## Scripts

```bash
npm run dev           # dev server on 8110
npm run build         # production build
npm run typecheck     # tsc --noEmit
npm run seed          # regenerate data/meals.json from scripts/seed-meals.mjs
npm run calculations  # regenerate docs/appendix-b-calculations.md from the data files
npm run preflight     # check the artefact against the Stage 1 pass criteria
```

---

## Putting it on a public URL

```bash
npm run build && npm start -- -p 8110
ngrok http 8110
```

**Set `RATIO_ADMIN_TOKEN` in `.env.local` before you do.** Three routes read back what customers
submit, and the reservation store holds a name, an email and a postcode for every person who
fills in the form:

| Route | Public | Why |
|---|---|---|
| `GET /api/orders` | token required | returns every reservation, including names and emails |
| `GET /api/events` | token required | behaviour data tied to identifiable sessions |
| `/insights` | token required, `?key=...` | reservations table |
| `GET /api/meals` | open | the menu, no personal data in it |
| `POST /api/events`, `POST /api/orders` | open | the funnel and the form; they only write |

The guard fails closed: with no token set in production those routes deny rather than allow, so
a misconfigured deploy locks you out instead of exposing other people's details. In development
with no token set they stay open for convenience.

The free ngrok URL changes every restart, which matters for Stage 2: analytics accumulate
against whatever URL people actually visited, so note the URL alongside the traffic you drive to
it, or use a reserved domain so the link is stable.

## The file database

There is no database server. Everything persists as JSON under `data/`.

| File | Written by | Notes |
|---|---|---|
| `data/meals.json` | `scripts/seed-meals.mjs` | The menu. Calories are **derived** from macros at 4/4/9, so the menu cannot contradict itself. |
| `data/orders.json` | `POST /api/orders` | Reservations. Append only. |
| `data/events.json` | `POST /api/events` | Analytics. Ring buffer capped at 50,000 events. |
| `data/research.json` | you, by hand | Competitor evidence and the named gaps. |
| `data/voice.json` | you, by hand | Real customer quotes. Starts empty on purpose. |

**Every filesystem read and write goes through `src/lib/db.ts` and `src/lib/analytics.ts`.**
Those two files are the only ones that touch disk. Moving to Postgres or Supabase means
rewriting the bodies of the exported functions and nothing else: keep the signatures, swap
`readJson`/`writeJson` for queries.

Two things the naive version of this gets wrong, both handled here:

- **Concurrent writes.** Two checkouts in the same second would otherwise read the same array
  and one would clobber the other. Writes are serialised through a promise chain. Verified with
  twelve simultaneous POSTs: twelve records, twelve unique codes, no corruption.
- **Torn files.** A crash mid write would leave invalid JSON. Writes go to a temp file and are
  then renamed, which is atomic on the same filesystem.

Pages use `export const dynamic = "force-dynamic"`, so editing a JSON file shows up on the next
request with no rebuild.

---

## Analytics

The rubric calls for working analytics twice, and warns that Stage 2 needs traffic to have
accumulated. There are two pipelines.

**First party, always on.** `src/lib/track.ts` sends events to `/api/events`, which appends to
`data/events.json`. It uses `navigator.sendBeacon`, so an event queued as the tab closes still
arrives, which is the entire point when measuring abandonment.

No cookies, no IP addresses, no raw user agent. The session id is a random string in
`sessionStorage` that dies with the tab, and the only device signal recorded is a coarse class
derived from viewport width. Event names are restricted to an allowlist and props are stripped
to short scalars, so nothing personal can ride along by accident.

**Third party, optional.** Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_GA_ID` or
`NEXT_PUBLIC_PLAUSIBLE_DOMAIN`. Neither script loads unless its variable is set.

### Why bother writing one

Page views do not answer the question this venture has. `/insights` answers three that matter:

1. **Where do people leave?** The funnel is counted by session, not by event, so dragging the
   calorie slider twenty times still counts once.
2. **What plan were they building?** Goal, calorie band, plan length and tray size, all captured
   at the review step where the plan is complete.
3. **What price was on screen when they left?** `price_seen` records the exact total at review.
   Comparing the median price among sessions that reserved against those that did not is the
   closest this artefact gets to a willingness to pay reading, and it is observed behaviour
   rather than a stated preference.

That third one is the input to Stage 1 calculations 2 and 3, and it is why
`npm run calculations` refuses to build a demand schedule until roughly thirty price
observations exist.

**A caveat that has to be said out loud:** observed conversion at one price is a demand
*reading*, not a demand *schedule*. To get three genuine price points you have to vary the
price between visitors and record which one each visitor saw. The event payload already carries
the price, so the instrumentation is ready; the experiment is not run.

---

## Photography, and where the render still lives

The hero is a photograph. The procedural three.js tray was there first and never stopped
reading as plastic, because hand written geometry cannot beat a camera at the one job that
section has. Every competitor in `data/research.json` uses photography for the same reason.

The render survives in section 03, where the job is explaining how the tray is built and a
schematic is the honest answer. It is lazy mounted, so it costs nothing until approached.

Images are Unsplash, under a licence permitting commercial use. `data/photos.json` records the
photo id, photographer, URL, licence and access date for every one, because Stage 1 requires
assets to be traceable. **They are stand ins.** Before a real launch they have to be replaced
with photographs of the actual product: showing someone else's meal as your own is a
misrepresentation regardless of the image licence, and that note is in the data file too.

## Design system

All visual decisions live in the `@theme` block of `src/app/globals.css` and nowhere else.

- **Palette.** Warm near black (`ink` steps plus `espresso`), warm off white (`bone` steps), and
  two accents with fixed jobs: `signal` lime for actions and live figures, `ember` for heat and
  appetite. If lime appears on decoration, something has drifted.
- **Type.** Eight sizes (`text-2xs` through `text-4xl`) plus four display clamps. No arbitrary
  `text-[...]` values anywhere in `src/`; the sweep that enforced this replaced fifteen ad hoc
  sizes, which was the main reason the layout read as uneven.
- **Radius and rhythm.** Six radius tokens, and section padding is `py-24 md:py-32` everywhere.
- **The 3D tray** (`src/components/three/`) is procedural: an extruded shell with the
  compartments cut through it, food displaced by seeded fractal noise (`src/lib/noise.ts`),
  a canvas drawn label, N8AO ambient occlusion and ACES tone mapping. Pixel ratio is capped at
  the display's native density and walks down under load; ambient occlusion runs at half
  resolution because it is low frequency and the difference is invisible.

### Load performance

The page serves fully rendered HTML in well under 100ms; what used to feel slow was client side
work, and it is bounded now:

- Only the hero canvas exists at page load. The scroll section's canvas mounts when the reader
  is a viewport away, and reuses every buffer through a module level cache, since both render
  the same meal.
- All geometry and generated textures are cached by key, so the whole tray is built once per
  session, not once per canvas.
- The grains and garnish are merged into single geometries: what was 233 draw calls is 2.
- The sealed film no longer uses `transmission`, which compiled the heaviest shader three.js has
  and re-rendered the scene every frame. It is a near transparent clearcoat with boosted
  reflections instead.
- Reveal animations only hide content once an inline script has stamped `.js` on the root
  element, so a reader without JavaScript, or still waiting for it, sees the page instead of a
  blank screen.

### Dev server memory and HMR

`next dev` plus a WebGL tab accumulates memory across long editing sessions: Turbopack keeps the
module graph in RAM and every hot reload of a three.js component can strand the previous
render targets until the tab reloads. If the dev process or the browser balloons after heavy
editing, restart `npm run dev` and reload the tab; a production build carries none of this.

Turbopack's HMR has also been seen to panic outright on this app (websocket dies, script chunks
404, the page serves but renders black). When that happens, restarting dev sometimes recurs; the
reliable fallback is `npm run build && npm start -- -p 8110`, which has no HMR at all.

## The nutrition model

All of it lives in `src/lib/plan.ts`. Nothing is hardcoded in a component.

- Protein and carbohydrate at 4 kcal a gram, fat at 9.
- Energy split by goal: cut 40/18/42, maintain 35/22/43, build 30/35/35, as protein/carbs/fat.
- Coverage: two meals a day covers 55 percent of intake, three covers 75 percent. The rest is
  the customer's own breakfast and snacks, and the builder shows the gap rather than hiding it.
- Four tray sizes at 1.0, 1.28, 1.6 and 1.95 times the base recipe.

### One thing worth knowing before you demo it

There were originally three tray sizes. On a 1,900 kcal cut across three meals a day, that put
the average tray 16 percent under target, and the "you fill the rest" figure was computed from
the *planned* coverage share rather than from the meals actually chosen, so the page understated
the shortfall.

Both are fixed. A fourth size closed most of the gap, and `actualCoverage()` now derives the
remainder from the selected basket. Across all 36 combinations of goal, calorie target and meals
per day, 30 land within 10 percent of target. The six that do not are all at 3,500 kcal, where a
single tray would have to carry 960 kcal, and the builder says so on screen instead of quietly
missing.

---

## Stage 1 status

Run `npm run preflight`. At the time of writing it passes six criteria, warns on four and blocks
on two, both of which need evidence only you can collect:

- `data/voice.json` is empty. The landing page needs the problem in the customer's own words,
  and the brief treats invented quotes as academic misconduct, so this section renders nothing
  until you put real sourced quotes in the file.
- `data/research.json` lists five open evidence gaps. Five of the eight required calculations
  are blocked on them and print as BLOCKED rather than being filled with an estimate.

See `docs/ecx2320-stage1.md` for the full submission map.
