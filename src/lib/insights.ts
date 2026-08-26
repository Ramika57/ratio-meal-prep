import { getEvents, type TrackedEvent } from "./analytics";
import { listOrders } from "./db";
import type { Order } from "./types";

/**
 * Turns the raw event log into the handful of numbers that actually inform a
 * decision: where people leave, what plan they were building when they left,
 * and what price was on screen at the time.
 */

export type FunnelStage = {
  key: string;
  label: string;
  note: string;
  sessions: number;
  /** Share of the stage above, so the drop is readable without arithmetic. */
  fromPrevious: number | null;
  fromTop: number;
};

export type Distribution = {
  label: string;
  buckets: { key: string; count: number; share: number }[];
  total: number;
};

function sessionsWhere(events: TrackedEvent[], test: (e: TrackedEvent) => boolean) {
  const set = new Set<string>();
  for (const e of events) if (test(e)) set.add(e.session);
  return set;
}

const PRETTY: Record<string, string> = {
  cut: "Cut",
  maintain: "Maintain",
  build: "Build",
  regular: "Regular",
  large: "Large",
  xl: "XL",
  xxl: "XXL",
  mobile: "Mobile",
  tablet: "Tablet",
  desktop: "Desktop",
};

function distribution(values: (string | number)[], label: string, order?: string[]): Distribution {
  const counts = new Map<string, number>();
  for (const v of values) {
    const key = String(v);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const total = values.length;
  const entries = [...counts.entries()];
  if (order) {
    entries.sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
  } else {
    entries.sort((a, b) => b[1] - a[1]);
  }
  return {
    label,
    total,
    buckets: entries.map(([key, count]) => ({
      key: PRETTY[key] ?? key,
      count,
      share: total ? count / total : 0,
    })),
  };
}

/** Calorie choices grouped into 400 kcal bands so the shape is visible. */
function kcalBands(values: number[]): Distribution {
  const bands = values.map((v) => {
    const lo = Math.floor(v / 400) * 400;
    return `${lo} to ${lo + 399}`;
  });
  const d = distribution(bands, "Daily calorie target chosen");
  d.buckets.sort((a, b) => Number(a.key.split(" ")[0]) - Number(b.key.split(" ")[0]));
  return d;
}

export async function buildInsights() {
  const [events, orders] = await Promise.all([getEvents(), listOrders()]);

  const allSessions = new Set(events.map((e) => e.session));
  const pageViews = events.filter((e) => e.name === "page_view");

  const stageDefs: { key: string; label: string; note: string; test: (e: TrackedEvent) => boolean }[] = [
    { key: "session", label: "Sessions", note: "any activity on the site", test: () => true },
    { key: "landing", label: "Viewed the landing page", note: "page_view on /", test: (e) => e.name === "page_view" && e.path === "/" },
    { key: "cta", label: "Clicked the call to action", note: "cta_click anywhere", test: (e) => e.name === "cta_click" },
    { key: "builder", label: "Opened the builder", note: "builder_start", test: (e) => e.name === "builder_start" },
    { key: "targets", label: "Reached the targets step", note: "step_advance to step 2", test: (e) => e.name === "step_advance" && e.props?.to === 1 },
    { key: "mealsStep", label: "Reached the meal picker", note: "step_advance to step 3", test: (e) => e.name === "step_advance" && e.props?.to === 2 },
    { key: "meals", label: "Chose at least one meal", note: "meal_add or autofill_used", test: (e) => e.name === "meal_add" || e.name === "autofill_used" },
    { key: "price", label: "Saw the price", note: "price_seen on review", test: (e) => e.name === "price_seen" },
    { key: "reserveStart", label: "Started the form", note: "reserve_start", test: (e) => e.name === "reserve_start" },
    { key: "reserved", label: "Reserved", note: "reserve_complete", test: (e) => e.name === "reserve_complete" },
  ];

  const top = allSessions.size || 1;
  let previous: number | null = null;
  const funnel: FunnelStage[] = stageDefs.map((s) => {
    const n = sessionsWhere(events, s.test).size;
    const stage: FunnelStage = {
      key: s.key,
      label: s.label,
      note: s.note,
      sessions: n,
      fromPrevious: previous === null || previous === 0 ? null : n / previous,
      fromTop: n / top,
    };
    previous = n;
    return stage;
  });

  // Plan shape, taken from the price_seen event because that is the point where
  // the customer has a complete plan and a number in front of them.
  const priceSeen = events.filter((e) => e.name === "price_seen");
  const reservedSessions = sessionsWhere(events, (e) => e.name === "reserve_complete");

  const totals = priceSeen.map((e) => Number(e.props?.total ?? 0)).filter((n) => n > 0);
  const abandonedTotals = priceSeen
    .filter((e) => !reservedSessions.has(e.session))
    .map((e) => Number(e.props?.total ?? 0))
    .filter((n) => n > 0);
  const reservedTotals = priceSeen
    .filter((e) => reservedSessions.has(e.session))
    .map((e) => Number(e.props?.total ?? 0))
    .filter((n) => n > 0);

  const distributions: Distribution[] = [
    distribution(
      events.filter((e) => e.name === "goal_select").map((e) => String(e.props?.goal ?? "unknown")),
      "Goal chosen",
      ["cut", "maintain", "build"],
    ),
    kcalBands(priceSeen.map((e) => Number(e.props?.kcal ?? 0)).filter((n) => n > 0)),
    distribution(priceSeen.map((e) => `${e.props?.days ?? "?"} days`), "Plan length reached at review"),
    distribution(priceSeen.map((e) => String(e.props?.portion ?? "?")), "Tray size at review", ["regular", "large", "xl"]),
    distribution(
      [...new Map(events.map((e) => [e.session, e.device])).values()],
      "Device",
      ["mobile", "tablet", "desktop"],
    ),
    distribution(
      events.filter((e) => e.name === "cta_click").map((e) => String(e.props?.location ?? "unknown")),
      "Which call to action was clicked",
    ),
  ];

  const sources = distribution(
    pageViews.map((e) => e.source ?? "direct or unknown"),
    "Referrer",
  );

  return {
    generatedAt: new Date().toISOString(),
    counts: {
      events: events.length,
      sessions: allSessions.size,
      pageViews: pageViews.length,
      orders: orders.length,
    },
    firstEvent: events[0]?.ts ?? null,
    lastEvent: events[events.length - 1]?.ts ?? null,
    funnel,
    distributions,
    sources,
    price: {
      seen: totals.length,
      mean: mean(totals),
      median: median(totals),
      abandonedMean: mean(abandonedTotals),
      abandonedMedian: median(abandonedTotals),
      reservedMean: mean(reservedTotals),
      reservedMedian: median(reservedTotals),
      abandonedCount: abandonedTotals.length,
      reservedCount: reservedTotals.length,
    },
    orders: orders.slice(0, 25) as Order[],
    revenue: orders.reduce((s, o) => s + o.totals.total, 0),
  };
}

function mean(values: number[]) {
  if (!values.length) return 0;
  return Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 100) / 100;
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const value = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return Math.round(value * 100) / 100;
}
