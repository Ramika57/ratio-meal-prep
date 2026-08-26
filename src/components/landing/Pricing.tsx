import { CtaLink } from "@/components/ui/CtaLink";
import { menuStats } from "@/lib/db";
import { DELIVERY_FEE, FREE_DELIVERY_OVER, PORTIONS, VOLUME_TIERS, money, priceBreakdown } from "@/lib/plan";

const PORTION_NOTE: Record<string, string> = {
  regular: "Suits roughly a 1,500 to 1,900 calorie day",
  large: "Suits roughly a 1,900 to 2,400 calorie day",
  xl: "Suits roughly a 2,400 to 2,900 calorie day",
  xxl: "Suits roughly a 2,900 to 3,500 calorie day",
};

export default async function Pricing() {
  const stats = await menuStats();

  // The worked example is computed by the same function that prices a real
  // basket, so the number on this page cannot drift from the number at checkout.
  const example = priceBreakdown(
    { goal: "maintain", dailyKcal: 2400, days: 5, mealsPerDay: 3, portion: "xl" },
    15,
  );

  return (
    <section id="pricing" className="scroll-mt-20 bg-bone text-ink">
      <div className="shell py-24 md:py-32">
        <div className="max-w-[46ch]">
          <p className="eyebrow reveal text-ink/45">07 · Pricing</p>
          <h2 className="reveal mt-5 text-display-m font-semibold">Priced by the tray, not by the month.</h2>
          <p className="reveal mt-6 text-base leading-relaxed text-ink/65">
            No subscription, no lock in, no minimum term. Order three days or fourteen. The only thing that
            moves the price is how much food is in the tray and how many trays you order.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:mt-16 md:grid-cols-2 lg:grid-cols-4">
          {PORTIONS.map((p, i) => {
            const kcal = Math.round(stats.avgKcal * p.multiplier);
            const protein = Math.round(stats.avgProtein * p.multiplier);
            return (
              <div
                key={p.key}
                className={`reveal flex flex-col rounded-2xl border p-8 ${
                  p.key === "large" ? "border-ink bg-ink text-bone" : "border-ink/15 bg-white"
                }`}
                style={{ "--reveal-delay": `${i * 90}ms` } as React.CSSProperties}
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="text-lg font-semibold tracking-[-0.035em]">{p.label}</h3>
                  {p.key === "large" ? (
                    <span className="eyebrow rounded-full bg-signal px-2.5 py-1 text-ink">Most ordered</span>
                  ) : null}
                </div>

                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="text-4xl font-semibold leading-none tracking-[-0.055em] tnum">
                    ${p.price.toFixed(2)}
                  </span>
                  <span className={`text-sm ${p.key === "large" ? "text-bone/55" : "text-ink/50"}`}>
                    per meal
                  </span>
                </div>

                <p className={`mt-4 text-sm leading-relaxed ${p.key === "large" ? "text-bone/60" : "text-ink/60"}`}>
                  {PORTION_NOTE[p.key]}
                </p>

                <dl
                  className={`mt-6 space-y-2 border-t pt-6 text-sm tnum ${
                    p.key === "large" ? "border-bone/15" : "border-ink/10"
                  }`}
                >
                  <div className="flex justify-between">
                    <dt className={p.key === "large" ? "text-bone/55" : "text-ink/55"}>Typical energy</dt>
                    <dd className="font-medium">{kcal} kcal</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className={p.key === "large" ? "text-bone/55" : "text-ink/55"}>Typical protein</dt>
                    <dd className="font-medium">{protein}g</dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>

        {/* Volume and delivery, stated plainly rather than buried in a footnote. */}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="reveal rounded-2xl border border-ink/15 bg-white p-8">
            <h3 className="eyebrow text-ink/45">Order more, pay less per tray</h3>
            <table className="mt-5 w-full text-base tnum">
              <tbody className="divide-y divide-ink/10">
                {VOLUME_TIERS.slice()
                  .reverse()
                  .map((t) => (
                    <tr key={t.min}>
                      <td className="py-2.5 text-ink/65">
                        {t.min === 0 ? "Under 15 meals" : `${t.min} meals or more`}
                      </td>
                      <td className="py-2.5 text-right font-medium">
                        {t.rate === 0 ? "List price" : `${Math.round(t.rate * 100)}% off`}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <p className="mt-5 text-sm leading-relaxed text-ink/55">
              Delivery is {money(DELIVERY_FEE)} across Melbourne metro, free over {money(FREE_DELIVERY_OVER)}.
            </p>
          </div>

          <div className="reveal rounded-2xl border border-ink/15 bg-white p-8" style={{ "--reveal-delay": "90ms" } as React.CSSProperties}>
            <h3 className="eyebrow text-ink/45">A typical week, priced</h3>
            <p className="mt-5 text-base text-ink/65">
              Five days, three meals a day, XL trays. Fifteen meals.
            </p>
            <dl className="mt-5 space-y-2.5 text-base tnum">
              <div className="flex justify-between">
                <dt className="text-ink/60">15 &times; {money(example.unit)}</dt>
                <dd>{money(example.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-ink/60">
                <dt>Volume discount, {Math.round(example.rate * 100)}%</dt>
                <dd>&minus;{money(example.discount)}</dd>
              </div>
              <div className="flex justify-between text-ink/60">
                <dt>Delivery</dt>
                <dd>{example.delivery === 0 ? "Free" : money(example.delivery)}</dd>
              </div>
              <div className="flex justify-between border-t border-ink/15 pt-3 text-xl font-semibold">
                <dt>Total</dt>
                <dd>{money(example.total)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-sm text-ink/50 tnum">
              {money(example.perMeal)} a meal, delivered.
            </p>
          </div>
        </div>

        <div className="reveal mt-12 text-center">
          <CtaLink href="/build" location="pricing" label="build_your_plan">
            Build your plan
          </CtaLink>
        </div>
      </div>
    </section>
  );
}
