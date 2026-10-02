// Framework panel for a ticket or audit task. While the work is open it names only the control
// families, so it doesn't give the answer away. After grading it shows each requirement's ID with
// the quoted text (NIST, HIPAA) or our own summary (ISO 27001, SOC 2, PCI DSS), and why the ticket
// is an example. It's a <details> element, so learners can hide it.
import { ExternalLink, Landmark } from "lucide-react";
import { FRAMEWORKS, TOPICS, refsFor, type Fw } from "../frameworks";

const ORDER: Fw[] = ["nist", "hipaa", "iso", "soc2", "pci"];

export function FrameworkPanel({ topics, graded }: { topics: string[]; graded: boolean }) {
  const known = topics.filter(k => TOPICS[k]);
  if (!known.length) return null;
  const refs = refsFor(known);
  return (
    <details open className="group rounded-xl border bg-card" data-framework-panel>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2 text-sm font-semibold"><Landmark className="size-4 text-info" aria-hidden />Frameworks: {known.map(k => TOPICS[k].label).join(", ")}</span>
        <span className="text-xs text-muted-foreground"><span className="group-open:hidden">Show</span><span className="hidden group-open:inline">Hide</span></span>
      </summary>
      <div className="space-y-4 border-t px-4 py-4 text-sm">
        {!graded ? (
          <>
            <p className="text-muted-foreground">The control families this work falls under. The exact requirements appear after it's graded.</p>
            <dl className="grid gap-x-4 gap-y-1.5 sm:grid-cols-[max-content_1fr]">
              {ORDER.filter(f => refs[f].length).map(f => (
                <div key={f} className="contents"><dt className="font-medium">{FRAMEWORKS[f].name}</dt><dd className="text-muted-foreground">{[...new Set(refs[f].map(r => r.family))].join(" · ")}</dd></div>
              ))}
            </dl>
          </>
        ) : (
          <>
            {known.map(k => <p key={k}><b>Why this is an example of {TOPICS[k].label.toLowerCase()}.</b> {TOPICS[k].why}</p>)}
            {ORDER.filter(f => refs[f].length).map(f => (
              <section key={f} aria-label={FRAMEWORKS[f].name} className="space-y-2">
                <h4 className="flex flex-wrap items-baseline justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {FRAMEWORKS[f].name}
                  <a href={FRAMEWORKS[f].url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 normal-case tracking-normal text-primary-strong underline-offset-2 hover:underline">{FRAMEWORKS[f].quoted ? "Source" : "Official source"} ({FRAMEWORKS[f].source})<ExternalLink className="size-3" aria-hidden /><span className="sr-only"> (opens in a new tab)</span></a>
                </h4>
                <ul className="space-y-2">
                  {refs[f].map(r => (
                    <li key={r.id} className="rounded-lg border bg-muted/30 px-3 py-2">
                      <span className="font-mono text-xs font-semibold">{f === "hipaa" ? "45 CFR " : ""}{r.id}</span>{r.name && <span className="font-medium"> {r.name}</span>}
                      {r.quote ? <blockquote className="mt-1 border-l-2 border-info/50 pl-3 text-[13px]">“{r.quote}”</blockquote>
                        : <p className="mt-1 text-[13px]"><span className="text-muted-foreground">In plain English: </span>{r.summary}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            <p className="text-xs text-muted-foreground">NIST and HIPAA text is quoted from the official publications. ISO/IEC 27001, SOC 2 and PCI DSS entries are Rolevara's own summaries, not the standards' text. Rolevara isn't affiliated with or endorsed by NIST, ISO, AICPA or the PCI Security Standards Council.</p>
          </>
        )}
      </div>
    </details>
  );
}
