import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-bone/10 bg-ink">
      <div className="shell py-14 md:py-20">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="text-[1.0625rem] font-semibold tracking-[-0.05em]">RATIO</div>
            <p className="mt-3 max-w-xs text-[0.8125rem] leading-relaxed text-mute">
              High protein, low carb meal prep, portioned to the number you set. Cooked in Melbourne,
              delivered chilled.
            </p>
          </div>

          <FooterCol
            title="Product"
            links={[
              { href: "/build", label: "Build your plan" },
              { href: "/#menu", label: "Menu" },
              { href: "/#pricing", label: "Pricing" },
              { href: "/#how", label: "How it works" },
            ]}
          />
          <FooterCol
            title="Nutrition"
            links={[
              { href: "/#macros", label: "The macro math" },
              { href: "/#faq", label: "Questions" },
            ]}
          />
          <FooterCol title="Company" links={[{ href: "/insights", label: "Live demand" }]} />
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-bone/10 pt-7 text-[0.75rem] text-mute md:flex-row md:items-center md:justify-between">
          <p>Prototype. Prices and delivery areas are indicative and not yet live.</p>
          <p className="tnum">Melbourne, Australia</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="eyebrow text-mute">{title}</h3>
      <ul className="mt-2">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link href={l.href} className="block py-2 text-[0.8125rem] text-bone/70 transition-colors hover:text-bone">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
