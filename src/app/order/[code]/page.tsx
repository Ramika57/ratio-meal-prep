import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MacroBar } from "@/components/ui/MacroBar";
import Footer from "@/components/site/Footer";
import { getMeal, getOrder } from "@/lib/db";
import {
  actualCoverage,
  goalInfo,
  money,
  num,
  portion as portionInfo,
  scaleMeal,
  selectionAverage,
} from "@/lib/plan";
import { getMeals } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reservation confirmed | RATIO",
  robots: { index: false },
};

export default async function OrderPage({ params }: PageProps<"/order/[code]">) {
  const { code } = await params;
  const order = await getOrder(code);
  if (!order) notFound();

  const meals = await getMeals();
  const avg = selectionAverage(order.selection, meals, order.plan.portion);
  const actual = actualCoverage(order.plan, order.selection, meals);

  const lines = await Promise.all(
    order.selection.map(async (line) => ({ line, meal: await getMeal(line.mealId) })),
  );

  const placed = new Date(order.createdAt).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <main id="main" className="shell py-24 md:py-32">
        <div className="mx-auto max-w-3xl">
          <p className="eyebrow text-signal">Reserved</p>
          <h1 className="mt-5 text-display-m font-semibold">
            You are in, {order.customer.name.split(" ")[0]}.
          </h1>
          <p className="mt-5 max-w-[52ch] text-[1rem] leading-relaxed text-bone/60">
            Nothing has been charged. We have your plan and your postcode, and we will email{" "}
            {order.customer.email} when {order.customer.postcode} opens for its first cook.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4 rounded-2xl border border-bone/12 bg-ink-2/60 p-7">
            <div>
              <p className="eyebrow text-mute">Reservation code</p>
              <p className="mt-2 font-mono text-[1.75rem] font-semibold tracking-[-0.02em]">{order.code}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="eyebrow text-mute">Placed</p>
              <p className="mt-2 text-[0.9375rem] tnum">{placed}</p>
            </div>
          </div>

          <section className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-bone/12 bg-ink-2/60 p-7">
              <h2 className="eyebrow text-mute">The plan</h2>
              <dl className="mt-5 space-y-3 text-[0.9375rem] tnum">
                <Row label="Goal" value={goalInfo(order.plan.goal).label} />
                <Row label="Daily target" value={`${num(order.plan.dailyKcal)} kcal`} />
                <Row label="Length" value={`${order.plan.days} days, ${order.plan.mealsPerDay} a day`} />
                <Row label="Tray size" value={portionInfo(order.plan.portion).label} />
                <Row label="Trays" value={String(order.totals.meals)} />
              </dl>
            </div>

            <div className="rounded-2xl border border-bone/12 bg-ink-2/60 p-7">
              <h2 className="eyebrow text-mute">Price held</h2>
              <dl className="mt-5 space-y-2.5 text-[0.9375rem] tnum">
                <Row label="Subtotal" value={money(order.totals.subtotal)} />
                {order.totals.discount > 0 ? (
                  <Row label="Volume discount" value={`−${money(order.totals.discount)}`} />
                ) : null}
                <Row label="Delivery" value={order.totals.delivery === 0 ? "Free" : money(order.totals.delivery)} />
              </dl>
              <p className="mt-5 border-t border-bone/12 pt-5 text-[2rem] font-semibold tracking-[-0.05em] tnum">
                {money(order.totals.total)}
              </p>
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-bone/12 bg-ink-2/60 p-7">
            <h2 className="eyebrow text-mute">What the trays deliver</h2>
            <p className="mt-4 text-[1.5rem] font-semibold tracking-[-0.04em] tnum">
              {avg.kcal} kcal and {avg.protein}g protein a tray
            </p>
            <MacroBar macros={avg} className="mt-4" />
            <p className="mt-5 text-[0.875rem] leading-relaxed text-bone/60 tnum">
              Across a day that is {num(actual.covered.kcal)} kcal and {actual.covered.protein}g of protein from
              us, computed from the trays you actually chose. You fill the remaining{" "}
              {num(actual.remaining.kcal)} kcal and {actual.remaining.protein}g yourself.
            </p>
          </section>

          <section className="mt-4 rounded-2xl border border-bone/12 bg-ink-2/60 p-7">
            <h2 className="eyebrow text-mute">Your {order.totals.meals} trays</h2>
            <ul className="mt-5 divide-y divide-bone/10">
              {lines.map(({ line, meal }) =>
                meal ? (
                  <li key={meal.id} className="flex items-baseline justify-between gap-4 py-3">
                    <span className="flex-1 text-[0.9375rem]">
                      <span className="text-mute tnum">{line.qty} &times; </span>
                      {meal.name}
                    </span>
                    <span className="text-[0.8125rem] text-mute tnum">
                      {scaleMeal(meal, order.plan.portion).kcal} kcal
                    </span>
                  </li>
                ) : null,
              )}
            </ul>
          </section>

          {order.notes ? (
            <section className="mt-4 rounded-2xl border border-bone/12 bg-ink-2/60 p-7">
              <h2 className="eyebrow text-mute">Your note</h2>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-bone/75">{order.notes}</p>
            </section>
          ) : null}

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/build"
              className="inline-flex h-12 items-center rounded-full border border-bone/20 px-6 text-[0.9375rem] transition-colors hover:border-bone/45"
            >
              Build another plan
            </Link>
            <Link
              href="/"
              className="inline-flex h-12 items-center rounded-full px-6 text-[0.9375rem] text-bone/60 transition-colors hover:text-bone"
            >
              Back to the site
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-bone/55">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
