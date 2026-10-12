import voiceData from "../../../data/voice.json";

type Quote = {
  text: string;
  attribution: string;
  source: string;
  sourceUrl?: string;
  collected: string;
};

type VoiceFile = {
  status: "placeholder" | "verified";
  quotes: Quote[];
};

// Bundled rather than read at runtime: it only changes when the repo does, and
// a Worker has no filesystem. The evidence gate below is unaffected.
async function readVoice(): Promise<VoiceFile> {
  return voiceData as VoiceFile;
}

/**
 * The problem, in the customer's own words.
 *
 * Quotes are read from data/voice.json and are only rendered when that file is
 * marked verified. There is no fallback copy and no sample quote, deliberately:
 * an invented customer quote on this page would be fabricated evidence, so the
 * only way to fill this section is to go and collect real ones.
 *
 * The layout has to work in both states. A two column grid with quotes on the
 * right collapses to a half empty band of whitespace when the file is still
 * empty, so the empty state is a single centred column instead.
 */
export default async function Problem() {
  const voice = await readVoice();
  const ready = voice.status === "verified" && voice.quotes.length > 0;
  const showGap = !ready && process.env.NODE_ENV !== "production";

  return (
    <section id="problem" className="bg-bone text-ink">
      <div className={`shell ${ready || showGap ? "py-24 md:py-32" : "py-20 md:py-24"}`}>
        {ready || showGap ? (
          <div className="grid gap-12 md:grid-cols-[0.85fr_1.15fr] md:gap-20">
            <div>
              <Heading />
            </div>
            <div>
              {ready ? (
                <ul className="space-y-8">
                  {voice.quotes.map((q, i) => (
                    <li
                      key={i}
                      className="reveal border-l-2 border-ink/15 pl-6"
                      style={{ "--reveal-delay": `${i * 90}ms` } as React.CSSProperties}
                    >
                      <blockquote className="text-xl leading-snug tracking-[-0.02em] text-ink md:text-2xl">
                        &ldquo;{q.text}&rdquo;
                      </blockquote>
                      <figcaption className="mt-3 text-xs text-ink/50">
                        {q.attribution} ·{" "}
                        {q.sourceUrl ? (
                          <a href={q.sourceUrl} className="underline underline-offset-2" rel="nofollow noopener">
                            {q.source}
                          </a>
                        ) : (
                          q.source
                        )}{" "}
                        · collected {q.collected}
                      </figcaption>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-ink/25 bg-ink/[0.03] p-7">
                  <p className="eyebrow text-ink/50">Evidence gap · visible in development only</p>
                  <p className="mt-3 text-base leading-relaxed text-ink/75">
                    This section renders nothing until{" "}
                    <code className="rounded bg-ink/10 px-1.5 py-0.5 font-mono text-sm">data/voice.json</code> contains
                    quotes you actually collected and its status is set to{" "}
                    <code className="rounded bg-ink/10 px-1.5 py-0.5 font-mono text-sm">verified</code>.
                  </p>
                  <p className="mt-3 text-base leading-relaxed text-ink/75">
                    Stage 1 asks for the problem in the customer&rsquo;s own words, and the same brief calls invented
                    survey data academic misconduct. Three or four real quotes with a source and a date will clear it.
                    Run <code className="rounded bg-ink/10 px-1.5 py-0.5 font-mono text-sm">npm run preflight</code> to
                    check.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Empty state: a centred editorial statement that stands on its own. */
          <div className="mx-auto max-w-[46ch] text-center">
            <Heading centered />
          </div>
        )}
      </div>
    </section>
  );
}

function Heading({ centered = false }: { centered?: boolean }) {
  return (
    <>
      <p className="eyebrow reveal text-ink/45">01 · The problem</p>
      <h2 className={`reveal mt-5 text-display-m font-semibold ${centered ? "" : "max-w-[14ch]"}`}>
        Eating well falls apart on a busy Wednesday.
      </h2>
      <p
        className={`reveal mt-6 text-base leading-relaxed text-ink/65 ${centered ? "" : "max-w-[40ch]"}`}
        style={{ "--reveal-delay": "80ms" } as React.CSSProperties}
      >
        Planning the meals, shopping for ingredients, cooking, cleaning up. For someone just starting out, that is
        exactly where good intentions give way. The Sunday night promise to meal prep rarely survives the week.
      </p>
      <p
        className={`reveal mt-4 text-base leading-relaxed text-ink/65 ${centered ? "" : "max-w-[40ch]"}`}
        style={{ "--reveal-delay": "140ms" } as React.CSSProperties}
      >
        Most meal brands talk to the committed gym-goer, with heavy macro talk and intense branding. If you are a
        beginner, that can feel intimidating. So we are not talking to the bodybuilder. We are talking to the person
        who wants to eat better without it taking over their week.
      </p>
    </>
  );
}
