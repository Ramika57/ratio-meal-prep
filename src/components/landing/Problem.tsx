import { promises as fs } from "node:fs";
import path from "node:path";

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

async function readVoice(): Promise<VoiceFile> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "data", "voice.json"), "utf8");
    return JSON.parse(raw) as VoiceFile;
  } catch {
    return { status: "placeholder", quotes: [] };
  }
}

/**
 * The problem, in the customer's own words.
 *
 * Quotes are read from data/voice.json and are only rendered when that file is
 * marked verified. There is no fallback copy and no sample quote, deliberately:
 * an invented customer quote on this page would be fabricated evidence, so the
 * only way to fill this section is to go and collect real ones.
 */
export default async function Problem() {
  const voice = await readVoice();
  const ready = voice.status === "verified" && voice.quotes.length > 0;
  const showGap = !ready && process.env.NODE_ENV !== "production";

  return (
    <section id="problem" className="bg-bone text-ink">
      <div className="shell py-24 md:py-32">
        <div className="grid gap-12 md:grid-cols-[0.85fr_1.15fr] md:gap-20">
          <div>
            <p className="eyebrow reveal text-ink/45">01 · The problem</p>
            <h2 className="reveal mt-5 max-w-[14ch] text-display-m font-semibold">
              Nobody quits because the training got hard.
            </h2>
            <p className="reveal mt-6 max-w-[40ch] text-base leading-relaxed text-ink/65">
              They quit because Sunday costs four hours, the containers do not fit in the fridge, and by
              Wednesday it is a chicken wrap from the food court and a promise to start again Monday.
            </p>
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
            ) : null}

            {showGap ? (
              <div className="rounded-2xl border-2 border-dashed border-ink/25 bg-ink/[0.03] p-7">
                <p className="eyebrow text-ink/50">Evidence gap · visible in development only</p>
                <p className="mt-3 text-base leading-relaxed text-ink/75">
                  This section renders nothing until <code className="rounded bg-ink/10 px-1.5 py-0.5">data/voice.json</code>{" "}
                  contains quotes you actually collected and its status is set to{" "}
                  <code className="rounded bg-ink/10 px-1.5 py-0.5">verified</code>.
                </p>
                <p className="mt-3 text-base leading-relaxed text-ink/75">
                  Stage 1 asks for the problem in the customer&rsquo;s own words, and the same brief calls
                  invented survey data academic misconduct. Three or four real quotes with a source and a
                  date will clear it. Run{" "}
                  <code className="rounded bg-ink/10 px-1.5 py-0.5">npm run preflight</code> to check.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
