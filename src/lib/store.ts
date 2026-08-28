import type { Order } from "./types";
import type { TrackedEvent } from "./analytics";

/**
 * One storage interface, two backends.
 *
 * On Cloudflare Workers there is no writable filesystem, so reservations and
 * analytics go to D1. Locally there is no D1, so they stay in data/*.json and
 * `npm run dev` keeps working with no Cloudflare account involved.
 *
 * The binding is looked up lazily and per request rather than cached at module
 * scope: a Worker isolate can be reused across requests with a different
 * context, and holding onto the first one is how you end up writing to the
 * wrong place under load.
 */

export type Store = {
  kind: "d1" | "file";
  listOrders(): Promise<Order[]>;
  getOrder(code: string): Promise<Order | undefined>;
  insertOrder(order: Order): Promise<void>;
  orderCodeExists(code: string): Promise<boolean>;
  listEvents(): Promise<TrackedEvent[]>;
  insertEvent(event: TrackedEvent): Promise<void>;
};

type D1Like = {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      all<T = unknown>(): Promise<{ results: T[] }>;
      first<T = unknown>(): Promise<T | null>;
      run(): Promise<unknown>;
    };
    all<T = unknown>(): Promise<{ results: T[] }>;
    run(): Promise<unknown>;
  };
};

async function getD1(): Promise<D1Like | null> {
  try {
    const mod = await import("@opennextjs/cloudflare");
    const ctx = mod.getCloudflareContext?.();
    const db = (ctx?.env as Record<string, unknown> | undefined)?.DB;
    return (db as D1Like) ?? null;
  } catch {
    // Not running on Workers, or the context is not available yet.
    return null;
  }
}

type OrderRow = {
  code: string;
  created_at: string;
  plan: string;
  selection: string;
  customer: string;
  notes: string | null;
  totals: string;
};

const rowToOrder = (r: OrderRow): Order => ({
  code: r.code,
  createdAt: r.created_at,
  plan: JSON.parse(r.plan),
  selection: JSON.parse(r.selection),
  customer: JSON.parse(r.customer),
  notes: r.notes ?? undefined,
  totals: JSON.parse(r.totals),
});

type EventRow = {
  id: string;
  ts: string;
  session: string;
  name: string;
  path: string;
  device: string;
  source: string | null;
  props: string | null;
};

const rowToEvent = (r: EventRow): TrackedEvent => ({
  id: r.id,
  ts: r.ts,
  session: r.session,
  name: r.name,
  path: r.path,
  device: r.device as TrackedEvent["device"],
  source: r.source ?? undefined,
  props: r.props ? JSON.parse(r.props) : undefined,
});

function d1Store(db: D1Like): Store {
  return {
    kind: "d1",
    async listOrders() {
      const { results } = await db
        .prepare("SELECT * FROM orders ORDER BY created_at DESC")
        .all<OrderRow>();
      return results.map(rowToOrder);
    },
    async getOrder(code) {
      const row = await db
        .prepare("SELECT * FROM orders WHERE code = ? COLLATE NOCASE")
        .bind(code)
        .first<OrderRow>();
      return row ? rowToOrder(row) : undefined;
    },
    async insertOrder(o) {
      await db
        .prepare(
          "INSERT INTO orders (code, created_at, plan, selection, customer, notes, totals) VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(
          o.code,
          o.createdAt,
          JSON.stringify(o.plan),
          JSON.stringify(o.selection),
          JSON.stringify(o.customer),
          o.notes ?? null,
          JSON.stringify(o.totals),
        )
        .run();
    },
    async orderCodeExists(code) {
      const row = await db.prepare("SELECT code FROM orders WHERE code = ?").bind(code).first();
      return row !== null;
    },
    async listEvents() {
      // Bounded: the insights dashboard aggregates, it does not paginate, and
      // an unbounded scan would eventually blow the request budget.
      const { results } = await db
        .prepare("SELECT * FROM events ORDER BY ts ASC LIMIT 50000")
        .all<EventRow>();
      return results.map(rowToEvent);
    },
    async insertEvent(e) {
      await db
        .prepare(
          "INSERT INTO events (id, ts, session, name, path, device, source, props) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(
          e.id,
          e.ts,
          e.session,
          e.name,
          e.path,
          e.device,
          e.source ?? null,
          e.props ? JSON.stringify(e.props) : null,
        )
        .run();
    },
  };
}

/* ------------------------------------------------------------ file store --- */

async function fileStore(): Promise<Store> {
  const { promises: fs } = await import("node:fs");
  const path = await import("node:path");
  const dir = path.join(process.cwd(), "data");
  const ordersFile = path.join(dir, "orders.json");
  const eventsFile = path.join(dir, "events.json");

  async function read<T>(file: string, fallback: T): Promise<T> {
    try {
      return JSON.parse(await fs.readFile(file, "utf8")) as T;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return fallback;
      throw err;
    }
  }
  async function write(file: string, value: unknown) {
    await fs.mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(value, null, 2) + "\n", "utf8");
    await fs.rename(tmp, file);
  }

  let queue: Promise<unknown> = Promise.resolve();
  const serialise = <T,>(job: () => Promise<T>): Promise<T> => {
    const run = queue.then(job, job);
    queue = run.catch(() => undefined);
    return run;
  };

  return {
    kind: "file",
    async listOrders() {
      const all = await read<Order[]>(ordersFile, []);
      return all.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async getOrder(code) {
      const all = await read<Order[]>(ordersFile, []);
      return all.find((o) => o.code.toLowerCase() === code.toLowerCase());
    },
    insertOrder(order) {
      return serialise(async () => {
        const all = await read<Order[]>(ordersFile, []);
        all.push(order);
        await write(ordersFile, all);
      });
    },
    async orderCodeExists(code) {
      const all = await read<Order[]>(ordersFile, []);
      return all.some((o) => o.code === code);
    },
    listEvents() {
      return read<TrackedEvent[]>(eventsFile, []);
    },
    insertEvent(event) {
      return serialise(async () => {
        const all = await read<TrackedEvent[]>(eventsFile, []);
        all.push(event);
        const trimmed = all.length > 50_000 ? all.slice(all.length - 50_000) : all;
        await write(eventsFile, trimmed);
      });
    },
  };
}

export async function getStore(): Promise<Store> {
  const db = await getD1();
  return db ? d1Store(db) : fileStore();
}
