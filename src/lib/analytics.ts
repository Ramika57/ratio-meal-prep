import { getStore } from "./store";

/**
 * First party analytics.
 *
 * Written rather than bolted on because the evidence this venture needs is not
 * page views, it is where people leave the plan builder and what price they
 * were looking at when they left. No third party script can answer that.
 *
 * Privacy: no IP address, no raw user agent, no cookie. The session id is a
 * random string held in sessionStorage and forgotten when the tab closes, and
 * the only device signal stored is a coarse class derived from viewport width.
 */

export type Device = "mobile" | "tablet" | "desktop";

export type TrackedEvent = {
  id: string;
  ts: string;
  session: string;
  name: string;
  path: string;
  device: Device;
  /** Referrer host only, never the full URL. */
  source?: string;
  props?: Record<string, string | number | boolean | null>;
};

export type EventInput = Omit<TrackedEvent, "id" | "ts">;

/** Every event name the app is allowed to send. Anything else is dropped. */
export const EVENT_NAMES = [
  "page_view",
  "cta_click",
  "builder_start",
  "goal_select",
  "calories_set",
  "days_set",
  "meals_per_day_set",
  "portion_set",
  "meal_add",
  "meal_remove",
  "autofill_used",
  "step_advance",
  "step_back",
  "review_view",
  "price_seen",
  "reserve_start",
  "reserve_complete",
  "reserve_error",
  "menu_filter",
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

export async function getEvents(): Promise<TrackedEvent[]> {
  return (await getStore()).listEvents();
}

export async function recordEvent(input: EventInput): Promise<TrackedEvent> {
  const event: TrackedEvent = {
    ...input,
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    ts: new Date().toISOString(),
  };
  await (await getStore()).insertEvent(event);
  return event;
}

export function isEventName(value: unknown): value is EventName {
  return typeof value === "string" && (EVENT_NAMES as readonly string[]).includes(value);
}

/** Strips anything that is not a short scalar, so no PII can ride along in props. */
export function cleanProps(input: unknown): TrackedEvent["props"] {
  if (!input || typeof input !== "object") return undefined;
  const out: NonNullable<TrackedEvent["props"]> = {};
  let n = 0;
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (n >= 12) break;
    if (!/^[a-z0-9_]{1,32}$/i.test(key)) continue;
    if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
    else if (typeof value === "boolean" || value === null) out[key] = value;
    else if (typeof value === "string" && value.length <= 64) out[key] = value;
    else continue;
    n++;
  }
  return Object.keys(out).length ? out : undefined;
}
