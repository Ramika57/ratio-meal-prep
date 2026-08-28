-- Reservations and analytics for the Workers deployment.
-- Replaces data/orders.json and data/events.json, which cannot exist on a
-- runtime with no writable filesystem.

CREATE TABLE IF NOT EXISTS orders (
  code        TEXT PRIMARY KEY,
  created_at  TEXT NOT NULL,
  plan        TEXT NOT NULL,   -- JSON: goal, dailyKcal, days, mealsPerDay, portion
  selection   TEXT NOT NULL,   -- JSON: [{ mealId, qty }]
  customer    TEXT NOT NULL,   -- JSON: name, email, postcode
  notes       TEXT,
  totals      TEXT NOT NULL    -- JSON: meals, subtotal, discount, delivery, total, ...
);

CREATE INDEX IF NOT EXISTS orders_created_at ON orders (created_at DESC);

CREATE TABLE IF NOT EXISTS events (
  id       TEXT PRIMARY KEY,
  ts       TEXT NOT NULL,
  session  TEXT NOT NULL,
  name     TEXT NOT NULL,
  path     TEXT NOT NULL,
  device   TEXT NOT NULL,
  source   TEXT,
  props    TEXT              -- JSON object or null
);

CREATE INDEX IF NOT EXISTS events_ts      ON events (ts);
CREATE INDEX IF NOT EXISTS events_session ON events (session);
CREATE INDEX IF NOT EXISTS events_name    ON events (name);
