import { getMeals } from "@/lib/db";
import MenuGrid from "./MenuGrid";

export default async function MenuPreview() {
  const meals = await getMeals();

  return (
    <section id="menu" className="scroll-mt-20 bg-ink">
      <div className="shell py-24 md:py-36">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[42ch]">
            <p className="eyebrow reveal text-mute">The menu</p>
            <h2 className="reveal mt-5 text-display-m font-semibold">Twenty meals. Every macro published.</h2>
          </div>
          <p className="reveal max-w-[34ch] text-[0.9375rem] leading-relaxed text-bone/55">
            Figures shown are for a Regular tray. Large adds 35 percent and XL adds 70 percent to every
            number, ingredient for ingredient.
          </p>
        </div>

        <MenuGrid meals={meals} />
      </div>
    </section>
  );
}
