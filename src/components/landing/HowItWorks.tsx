const STEPS = [
  {
    n: "01",
    title: "Set the target",
    body:
      "Choose cut, maintain or build, then set the calories you want to eat in a day. Protein is held at 30 to 40 percent of your energy depending on the goal, and carbs stay low. The split is arithmetic, not a guess.",
  },
  {
    n: "02",
    title: "Choose the week",
    body:
      "Three to fourteen days, two or three meals a day. Portion size follows your number: Regular, Large or XL. Pick your meals, or let the builder fill the gaps with whatever gets the average closest to target.",
  },
  {
    n: "03",
    title: "Cook nothing",
    body:
      "Delivered chilled on Sunday, never frozen. Every lid prints the calories and the three macros. Four minutes in the microwave, and the rest of your day is yours to fill.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 bg-ink">
      <div className="shell py-24 md:py-32">
        <div className="max-w-[52ch]">
          <p className="eyebrow reveal text-mute">02 · How it works</p>
          <h2 className="reveal mt-5 text-display-m font-semibold">Three steps, and none of them involve a pan.</h2>
        </div>

        <ol className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-bone/10 bg-bone/10 md:mt-20 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li
              key={s.n}
              className="reveal bg-ink p-8 md:p-10"
              style={{ "--reveal-delay": `${i * 110}ms` } as React.CSSProperties}
            >
              <span className="eyebrow text-signal tnum">{s.n}</span>
              <h3 className="mt-6 text-2xl font-semibold tracking-[-0.035em]">{s.title}</h3>
              <p className="mt-4 text-base leading-relaxed text-bone/60">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
