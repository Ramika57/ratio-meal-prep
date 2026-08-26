import { menuStats } from "@/lib/db";

/**
 * A moving band of facts between sections.
 *
 * Every item is a real figure or a real operational detail, so it carries
 * information rather than decoration. It exists because a page of static dark
 * blocks has no pulse, and this is the cheapest honest way to give it one.
 */
export default async function Ticker() {
  const s = await menuStats();

  const items = [
    `${s.avgProtein}g protein a meal`,
    `${s.avgCarbs}g carbs`,
    `${s.count} meals on the menu`,
    "Cooked Saturday",
    "Delivered Sunday",
    "Chilled at 3 degrees",
    "Never frozen",
    "Macros printed on every lid",
    "No subscription",
    "Melbourne metro",
    `${s.lowCarbCount} meals under 20g carbs`,
    "Four tray sizes",
  ];

  return (
    <div
      className="relative overflow-hidden border-y border-bone/10 bg-signal py-4 text-ink select-none"
      aria-hidden
    >
      <div className="marquee-track flex w-max items-center gap-10 whitespace-nowrap">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center gap-10">
            {items.map((item) => (
              <span key={item} className="flex items-center gap-10 text-sm font-medium tnum">
                {item}
                <span className="size-1.5 rounded-full bg-ink/40" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
