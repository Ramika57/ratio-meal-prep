import { promises as fs } from "node:fs";
import path from "node:path";

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

const DATA_DIR = path.join(process.cwd(), "data");
const EVENTS_FILE = path.join(DATA_DIR, "events.json");

/** Ring buffer ceiling. Old events fall off the front rather than filling a disk. */
const MAX_EVENTS = 50_000;

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

let queue: Promise<unknown> = Promise.resolve();
function serialise<T>(job: () => Promise<T>): Promise<T> {
  const run = queue.then(job, job);
  queue = run.catch(() => undefined);
  return run;
}

async function readEvents(): Promise<TrackedEvent[]> {
  try {
    return JSON.parse(await fs.readFile(EVENTS_FILE, "utf8")) as TrackedEvent[];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

export async function getEvents(): Promise<TrackedEvent[]> {
  return readEvents();
}

export async function recordEvent(input: EventInput): Promise<TrackedEvent> {
  const event: TrackedEvent = {
    ...input,
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    ts: new Date().toISOString(),
  };

  return serialise(async () => {
    const events = await readEvents();
    events.push(event);
    const trimmed = events.length > MAX_EVENTS ? events.slice(events.length - MAX_EVENTS) : events;
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${EVENTS_FILE}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(trimmed, null, 2) + "\n", "utf8");
    await fs.rename(tmp, EVENTS_FILE);
    return event;
  });
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
