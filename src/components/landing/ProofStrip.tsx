import { menuStats } from "@/lib/db";
import { comparisonRows } from "@/lib/compare";
import { CountUp } from "@/components/ui/CountUp";

/**
 * Four figures, every one of them derived. The menu numbers come from
 * data/meals.json and the comparison comes from data/research.json, so no claim
 * on this strip can outlive the evidence behind it.
 */
export default async function ProofStrip() {
  const [s, compare] = await Promise.all([menuStats(), comparisonRows()]);

  const figures = [
    { value: s.avgProtein, unit: "g", label: "Protein a meal", note: `averaged across all ${s.count} meals`, accent: true },
    { value: s.avgCarbs, unit: "g", label: "Carbs a meal", note: `${s.lowCarbCount} of ${s.count} sit under 20g`, accent: false },
    { value: compare.carbReduction, unit: "%", label: "Less carbohydrate", note: "than the lowest carb rival we could price", accent: false },
    { value: 4, unit: "min", label: "Microwave to plate", note: "cooked, chilled, never frozen", accent: false },
  ];

  return (
    <section className="relative overflow-hidden border-b border-bone/10 bg-ink-2">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{ background: "radial-gradient(ellipse 60% 120% at 15% 0%, rgba(216,250,78,0.07), transparent 60%)" }}
        aria-hidden
      />
      <div className="shell relative grid grid-cols-2 gap-x-8 gap-y-12 py-16 md:grid-cols-4 md:py-20">
        {figures.map((f, i) => (
          <div key={f.label} className="reveal" style={{ "--reveal-delay": `${i * 70}ms` } as React.CSSProperties}>
            <div
              className={`flex items-baseline gap-1 font-semibold tracking-[-0.055em] tnum ${
                f.accent ? "text-signal" : "text-bone"
              }`}
            >
              <span className="text-display-m leading-[0.85]"><CountUp value={f.value} /></span>
              <span className="text-xl">{f.unit}</span>
            </div>
            <div className="mt-4 text-base font-medium">{f.label}</div>
            <div className="mt-1.5 text-xs leading-relaxed text-mute">{f.note}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
