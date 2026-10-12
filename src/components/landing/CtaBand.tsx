import { CtaLink } from "@/components/ui/CtaLink";

export default function CtaBand() {
  return (
    <section className="relative overflow-hidden border-t border-bone/10 bg-ink">
      <div
        className="pointer-events-none absolute left-1/2 top-full -z-10 h-[60vh] w-[120vw] -translate-x-1/2 -translate-y-1/2"
        style={{ background: "radial-gradient(ellipse 44% 52% at 50% 50%, rgba(255,107,53,0.16), transparent 70%)" }}
        aria-hidden
      />
      <div className="shell py-28 text-center md:py-40">
        <h2 className="reveal mx-auto max-w-[15ch] text-display-l font-semibold">Eating well, made easy.</h2>
        <p className="reveal mx-auto mt-6 max-w-[42ch] text-lg leading-relaxed text-bone/60">
          Two minutes in the builder gives you a costed week, what is in every meal, and what is left for you to
          eat yourself.
        </p>
        <div className="reveal mt-9">
          <CtaLink href="/build" location="cta_band" label="build_your_plan">
            Build your plan
          </CtaLink>
        </div>
        <p className="reveal mt-5 text-xs text-mute">
          No payment taken. Reserving holds your first week while we open your postcode.
        </p>
      </div>
    </section>
  );
}
