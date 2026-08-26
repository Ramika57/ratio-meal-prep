import { comparisonRows } from "@/lib/compare";

/**
 * Published comparison against named competitors, built from their own live
 * menus. It includes the figure that does not flatter us, because a comparison
 * table that only contains wins is an advertisement, not information.
 */
export default async function Compare() {
  const { rows, carbReduction, densityGap, highestOtherDensity } = await comparisonRows();
  const us = rows.find((r) => r.us);
  if (!us || rows.length < 2) return null;

  return (
    <section id="compare" className="scroll-mt-20 border-y border-bone/10 bg-espresso">
      <div className="shell py-24 md:py-32">
        <div className="max-w-[54ch]">
          <p className="eyebrow reveal text-mute">06 · How we compare</p>
          <h2 className="reveal mt-5 text-display-m font-semibold">
            The number we beat them on, and the one we do not.
          </h2>
          <p className="reveal mt-6 text-base leading-relaxed text-bone/60">
            Every figure below was read off each company&rsquo;s own live menu on the date shown. Where a company
            does not publish macros, it is not in the table.
          </p>
        </div>

        <div className="reveal mt-12 overflow-x-auto">
          <table className="w-full min-w-[42rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-bone/15 text-mute">
                {["Provider", "Carbs per meal", "Protein per meal", "Protein per 100 kcal", "Price per meal", "Read on"].map(
                  (h) => (
                    <th key={h} className="eyebrow py-4 pr-6 font-medium">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-bone/10">
              {rows.map((r) => (
                <tr key={r.name} className={r.us ? "bg-signal/[0.06]" : ""}>
                  <td className="py-4 pr-6">
                    <span className={`text-base ${r.us ? "font-semibold" : ""}`}>{r.name}</span>
                    <span className="ml-2 text-2xs text-mute tnum">n={r.sample}</span>
                  </td>
                  <td className={`py-4 pr-6 tnum ${r.us ? "text-xl font-semibold text-signal" : "text-bone/80"}`}>
                    {r.carbs}g
                  </td>
                  <td className="py-4 pr-6 text-bone/80 tnum">{r.protein}g</td>
                  <td className="py-4 pr-6 text-bone/80 tnum">{r.density}g</td>
                  <td className="py-4 pr-6 text-bone/80 tnum">
                    {r.price ? (r.price.low === r.price.high ? `$${r.price.low.toFixed(2)}` : `$${r.price.low.toFixed(2)} to $${r.price.high.toFixed(2)}`) : "not published"}
                  </td>
                  <td className="py-4 pr-6 text-xs text-mute tnum">{r.accessed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="reveal rounded-2xl border border-signal/30 bg-signal/[0.05] p-7">
            <p className="eyebrow text-signal">Where we win</p>
            <p className="mt-4 text-lg leading-relaxed text-bone/85 tnum">
              {carbReduction} percent less carbohydrate a meal than the lowest carbohydrate provider in the table,
              at the same protein. If you are holding carbs down, that is the whole difference.
            </p>
          </div>
          <div className="reveal rounded-2xl border border-bone/12 bg-ink-2/60 p-7" style={{ "--reveal-delay": "90ms" } as React.CSSProperties}>
            <p className="eyebrow text-mute">Where we do not</p>
            <p className="mt-4 text-lg leading-relaxed text-bone/85 tnum">
              Protein density is a tie. We run {us.density}g of protein per 100 kcal against {highestOtherDensity}g
              for the best of them, a difference of {Math.abs(densityGap)}g. Anyone telling you their meals are
              dramatically higher in protein is rounding in their own favour, and so would we be.
            </p>
          </div>
        </div>

        <p className="reveal mt-8 max-w-[76ch] text-xs leading-relaxed text-mute">
          Competitor figures are averages of the meals each company featured on its own homepage on the date shown,
          which is a convenience sample and is likely to flatter them. RATIO figures are the average of the full
          published menu. Prices exclude delivery and any introductory discount.
        </p>
      </div>
    </section>
  );
}
