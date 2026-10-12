import { PORTIONS } from "@/lib/plan";

const STEPS = [
  {
    n: "01",
    title: "Pick a goal and a number",
    body:
      "Choose Cut to lose fat, Maintain to hold steady or Build to add muscle, then set roughly how many calories you eat in a day. The builder starts at a suggested number for your goal and you can move it. Protein is held at 30 to 40 percent of your energy and carbs stay low.",
  },
  {
    n: "02",
    title: "Choose your week",
    body: `Three to fourteen days, two or three meals a day. Your number suggests a tray size, from ${PORTIONS[0].label} to ${PORTIONS[PORTIONS.length - 1].label}. Choose your own meals, or let the builder fill the gaps.`,
  },
  {
    n: "03",
    title: "Cook nothing",
    body:
      "Delivered chilled on Sunday, never frozen. Every lid prints the calories, protein, carbs and fat. Four minutes in the microwave, and the rest of your day is yours.",
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
