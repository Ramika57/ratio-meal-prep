import Link from "next/link";
import type { Metadata } from "next";
import { buildInsights } from "@/lib/insights";
import { money, num } from "@/lib/plan";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Demand insights | RATIO",
  robots: { index: false, follow: false },
};

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export default async function InsightsPage() {
  const data = await buildInsights();
  const empty = data.counts.events === 0;

  return (
    <main id="main" className="shell py-16 md:py-24">
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-bone/10 pb-8">
        <div>
          <p className="eyebrow text-mute">Internal</p>
          <h1 className="mt-3 text-display-s font-semibold">Demand insights</h1>
          <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-bone/60">
            First party analytics, read straight from <code className="text-bone/80">data/events.json</code> and{" "}
            <code className="text-bone/80">data/orders.json</code>. No cookies, no IP addresses, no third party
            script required.
          </p>
        </div>
        <Link href="/" className="text-sm text-bone/55 underline underline-offset-4 hover:text-bone">
          Back to the site
        </Link>
      </header>

      {empty ? (
        <p className="mt-16 rounded-2xl border border-dashed border-bone/20 p-10 text-center text-bone/60">
          No events recorded yet. Open the site, click through the builder, and refresh this page.
        </p>
      ) : null}

      <section className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Sessions" value={num(data.counts.sessions)} note="unique tabs" />
        <Stat label="Page views" value={num(data.counts.pageViews)} note={`${num(data.counts.events)} events total`} />
        <Stat label="Reservations" value={num(data.counts.orders)} note="written to orders.json" />
        <Stat label="Value reserved" value={money(data.revenue)} note="no payment taken" />
      </section>

      {/* Funnel */}
      <section className="mt-14">
        <h2 className="eyebrow text-mute">Funnel</h2>
        <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-bone/55">
          Counted by session, not by event, so a person who drags the calorie slider twenty times still counts
          once. The step with the largest drop is where the next test belongs.
        </p>
        <ol className="mt-7 space-y-2">
          {data.funnel.map((stage) => {
            const worst =
              stage.fromPrevious !== null &&
              stage.fromPrevious ===
                Math.min(...data.funnel.filter((s) => s.fromPrevious !== null).map((s) => s.fromPrevious as number));
            return (
              <li key={stage.key} className="rounded-xl border border-bone/10 bg-ink-2/50 p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <span className="text-base font-medium">{stage.label}</span>
                  <span className="text-xs text-mute tnum">
                    {stage.fromPrevious !== null ? (
                      <span className={worst ? "text-macro-fat" : ""}>
                        {pct(stage.fromPrevious)} of previous ·{" "}
                      </span>
                    ) : null}
                    {pct(stage.fromTop)} of sessions
                  </span>
                </div>
                <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-bone/10">
                  <div
                    className="h-full rounded-full bg-signal"
                    style={{ width: `${Math.max(stage.fromTop * 100, stage.sessions ? 1.5 : 0)}%` }}
                  />
                </div>
                <div className="mt-2 flex items-baseline justify-between gap-3">
                  <span className="text-2xs text-mute">{stage.note}</span>
                  <span className="text-lg font-semibold tnum">{num(stage.sessions)}</span>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Price */}
      <section className="mt-14">
        <h2 className="eyebrow text-mute">Price on screen</h2>
        <p className="mt-3 max-w-[64ch] text-sm leading-relaxed text-bone/55">
          Recorded when the review step loads, which is the first moment a complete plan and a total appear
          together. Comparing the two columns is the closest this artefact gets to a willingness to pay reading,
          and it is observed behaviour rather than a stated preference.
        </p>
        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          <Stat label="Saw a price" value={num(data.price.seen)} note={`median ${money(data.price.median)}`} />
          <Stat
            label="Reserved"
            value={num(data.price.reservedCount)}
            note={`median ${money(data.price.reservedMedian)} · mean ${money(data.price.reservedMean)}`}
          />
          <Stat
            label="Left without reserving"
            value={num(data.price.abandonedCount)}
            note={`median ${money(data.price.abandonedMedian)} · mean ${money(data.price.abandonedMean)}`}
          />
        </div>
      </section>

      {/* Distributions */}
      <section className="mt-14">
        <h2 className="eyebrow text-mute">What people are building</h2>
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {[...data.distributions, data.sources].map((d) => (
            <div key={d.label} className="rounded-2xl border border-bone/10 bg-ink-2/50 p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-base font-medium">{d.label}</h3>
                <span className="text-2xs text-mute tnum">n = {num(d.total)}</span>
              </div>
              {d.buckets.length === 0 ? (
                <p className="mt-4 text-sm text-mute">Nothing recorded yet.</p>
              ) : (
                <ul className="mt-4 space-y-2.5">
                  {d.buckets.map((b) => (
                    <li key={b.key}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="text-bone/75">{b.key}</span>
                        <span className="text-mute tnum">
                          {num(b.count)} · {pct(b.share)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bone/10">
                        <div className="h-full rounded-full bg-bone/45" style={{ width: `${b.share * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Reservations */}
      <section className="mt-14">
        <h2 className="eyebrow text-mute">Reservations</h2>
        {data.orders.length === 0 ? (
          <p className="mt-5 text-base text-mute">None yet.</p>
        ) : (
          <div className="mt-7 overflow-x-auto rounded-2xl border border-bone/10">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <thead className="bg-ink-2/70 text-mute">
                <tr>
                  {["Code", "Placed", "Postcode", "Goal", "kcal", "Plan", "Trays", "Total"].map((h) => (
                    <th key={h} className="px-4 py-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-bone/10">
                {data.orders.map((o) => (
                  <tr key={o.code}>
                    <td className="px-4 py-3 font-medium tracking-[0.04em] tnum">{o.code}</td>
                    <td className="px-4 py-3 text-mute tnum">{o.createdAt.slice(0, 10)}</td>
                    <td className="px-4 py-3 tnum">{o.customer.postcode}</td>
                    <td className="px-4 py-3 capitalize">{o.plan.goal}</td>
                    <td className="px-4 py-3 tnum">{num(o.plan.dailyKcal)}</td>
                    <td className="px-4 py-3 tnum">
                      {o.plan.days}d × {o.plan.mealsPerDay}
                    </td>
                    <td className="px-4 py-3 tnum">{o.totals.meals}</td>
                    <td className="px-4 py-3 font-medium tnum">{money(o.totals.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="mt-14 border-t border-bone/10 pt-6 text-xs text-mute tnum">
        Window: {data.firstEvent?.slice(0, 16).replace("T", " ") ?? "n/a"} to{" "}
        {data.lastEvent?.slice(0, 16).replace("T", " ") ?? "n/a"} · generated{" "}
        {data.generatedAt.slice(0, 16).replace("T", " ")}
      </p>
    </main>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-bone/10 bg-ink-2/50 p-6">
      <p className="eyebrow text-mute">{label}</p>
      <p className="mt-3 text-3xl font-semibold leading-none tracking-[-0.05em] tnum">{value}</p>
      <p className="mt-2 text-xs text-mute tnum">{note}</p>
    </div>
  );
}
