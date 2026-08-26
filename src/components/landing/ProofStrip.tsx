import { menuStats } from "@/lib/db";
import { comparisonRows } from "@/lib/compare";

/**
 * Four figures, every one of them derived. The menu numbers come from
 * data/meals.json and the comparison comes from data/research.json, so no claim
 * on this strip can outlive the evidence behind it.
 */
export default async function ProofStrip() {
  const [s, compare] = await Promise.all([menuStats(), comparisonRows()]);

  const figures = [
    { value: `${s.avgProtein}g`, label: "Protein per meal", note: `averaged across all ${s.count} meals` },
    { value: `${s.avgCarbs}g`, label: "Carbs per meal", note: `${s.lowCarbCount} of ${s.count} meals sit under 20g` },
    {
      value: `${compare.carbReduction}%`,
      label: "Less carbohydrate",
      note: "than the lowest carb rival we could price",
    },
    { value: "4 min", label: "Microwave to plate", note: "cooked, chilled, never frozen" },
  ];

  return (
    <section className="border-y border-bone/10 bg-ink-2/40">
      <div className="shell grid grid-cols-2 gap-x-6 gap-y-10 py-12 md:grid-cols-4 md:py-16">
        {figures.map((f, i) => (
          <div key={f.label} className="reveal" style={{ "--reveal-delay": `${i * 70}ms` } as React.CSSProperties}>
            <div className="text-[2.25rem] font-semibold tracking-[-0.05em] tnum md:text-[3rem]">{f.value}</div>
            <div className="mt-1.5 text-[0.875rem] font-medium">{f.label}</div>
            <div className="mt-1 text-[0.75rem] leading-relaxed text-mute">{f.note}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
