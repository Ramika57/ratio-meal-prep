const QA = [
  {
    q: "How are the macros actually calculated?",
    a: "Each meal is built to a recipe with weighed ingredients, and the macro figures come from those weights. Calories are then derived as protein times four, plus carbohydrate times four, plus fat times nine. We publish the derived figure rather than a rounder marketing number, which is why the totals look specific.",
  },
  {
    q: "Why does the plan only cover part of my day?",
    a: "Because a tray that carried a third of a 3,000 calorie day would not fit in a fridge. Two meals a day covers roughly 55 percent of your intake and three covers roughly 75 percent. The builder shows you the exact gap left over so you can fill it with breakfast, a shake or whatever you already eat.",
  },
  {
    q: "Is low carb the right call if I train hard?",
    a: "Not always. Low carb suits a cut and most maintenance weeks. If you are training twice a day or building, choose Build: that setting moves carbohydrate up to 35 percent of your energy and pulls fat back, and the builder will steer you toward the higher carbohydrate meals on the menu.",
  },
  {
    q: "How long do the meals keep?",
    a: "Cooked Saturday, delivered Sunday, chilled at three degrees and best inside five days. Nothing is frozen at any point. If you order ten or fourteen days, the second delivery arrives the following Sunday rather than sitting in your fridge for a fortnight.",
  },
  {
    q: "What if I do not like one of the meals?",
    a: "You choose every tray in the plan, so nothing arrives that you did not pick. The auto fill button is there for speed, and everything it picks can be swapped before you confirm.",
  },
  {
    q: "Is this a subscription?",
    a: "No. You order a block of days and that is the whole commitment. There is no card kept on file, no rolling charge and no cancellation to remember.",
  },
];

export default function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 bg-ink">
      <div className="shell py-24 md:py-32">
        <div className="grid gap-12 md:grid-cols-[0.8fr_1.2fr] md:gap-20">
          <div>
            <p className="eyebrow reveal text-mute">08 · Questions</p>
            <h2 className="reveal mt-5 text-display-m font-semibold">The ones worth asking.</h2>
          </div>

          <div className="reveal divide-y divide-bone/10 border-y border-bone/10">
            {QA.map((item) => (
              <details key={item.q} className="group">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-lg font-medium tracking-[-0.025em] [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span className="relative mt-2 block size-3 shrink-0" aria-hidden>
                    <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-bone/60" />
                    <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-bone/60 transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] group-open:rotate-90 group-open:opacity-0" />
                  </span>
                </summary>
                <p className="-mt-1 max-w-[62ch] pb-5 pr-9 text-base leading-relaxed text-bone/60">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
