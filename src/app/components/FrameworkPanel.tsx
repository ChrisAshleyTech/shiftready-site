// Framework panel for a ticket or audit task. While the work is open it names only the control
// families, so it doesn't give the answer away. After grading it shows each requirement's ID with
// the quoted text (NIST 800-53, HIPAA) or our own summary (the rest), and why the ticket is an
// example. Each company shows only the frameworks it answers to. It's a <details> element, so
// learners can hide it.
import { ExternalLink, Landmark } from "lucide-react";
import { FRAMEWORKS, TOPICS, refsFor, type Fw } from "../frameworks";
import { company } from "../company";

// Who publishes each framework, for the not-affiliated line.
const BODY: Record<Fw, string> = { nist: "NIST", nist171: "NIST", hipaa: "HHS", glba: "the NCUA", sox: "the PCAOB", iso: "ISO", soc2: "AICPA", pci: "the PCI Security Standards Council" };
const list = (xs: string[]) => (xs.length < 3 ? xs.join(" and ") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

export function footnote(fws: Fw[]) {
  const q = fws.filter(f => FRAMEWORKS[f].quoted).map(f => FRAMEWORKS[f].name), s = fws.filter(f => !FRAMEWORKS[f].quoted).map(f => FRAMEWORKS[f].name);
  const bodies = [...new Set(fws.map(f => BODY[f]))];
  return [q.length && `${list(q)} text is quoted from the official publication${q.length > 1 ? "s" : ""}.`, s.length && `${list(s)} entries are Rolevara's own summaries, not the official text.`, `Rolevara isn't affiliated with or endorsed by ${list(bodies)}.`].filter(Boolean).join(" ");
}

export function FrameworkPanel({ topics, graded }: { topics: string[]; graded: boolean }) {
  const known = topics.filter(k => TOPICS[k]);
  if (!known.length) return null;
  const ORDER = company().fw, refs = refsFor(known, ORDER);
  if (!ORDER.some(f => refs[f].length)) return null;
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
            <p className="text-xs text-muted-foreground">{footnote(ORDER.filter(f => refs[f].length))}</p>
          </>
        )}
      </div>
    </details>
  );
}
