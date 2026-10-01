// Building blocks shared by the lab guides: steps, copyable commands, script downloads, the six
// tickets, results upload and grading, troubleshooting and resources.
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Copy, Download, ExternalLink, FolderGit2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TK } from "@/engine/tickets.js";
import { ExportError, LAB_TICKETS, type LabResult } from "../../lab/core";
import { downloadPortfolio } from "../../lab/portfolio";
import { Checks, SectionLabel, Tag } from "../../components/bits";

export type LabId = "entra" | "okta" | "aws";

export type LabGuide = {
  id: LabId;
  name: string;
  sub: string;
  setup: () => ReactNode;
  run: () => ReactNode;
  upload: { file: string; script: string; grade: (text: string) => LabResult };
  trouble: [string, ReactNode][];
  resources: readonly (readonly [string, string, string])[];
  vendor: string;
};

export function Code({ children }: { children: string }) {
  const copy = () => navigator.clipboard?.writeText(children).then(() => toast("Copied to the clipboard."), () => toast("Couldn't copy. Select the text and copy it instead."));
  return (
    <div className="relative">
      {/* Long commands wrap rather than scroll, so the copy button never covers them. */}
      <pre className="whitespace-pre-wrap rounded-lg border bg-muted/50 py-3 pl-4 pr-12 font-mono text-[13px] leading-relaxed [overflow-wrap:anywhere]"><code>{children}</code></pre>
      <Button type="button" size="icon" variant="ghost" onClick={copy} className="absolute right-1.5 top-1.5 size-8" aria-label="Copy command">
        <Copy className="size-4" aria-hidden />
      </Button>
    </div>
  );
}

export function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[2rem_1fr] gap-3">
      <span aria-hidden className="grid size-7 place-items-center rounded-full bg-primary/12 font-mono text-sm font-semibold text-primary-strong">{n}</span>
      <div className="min-w-0 space-y-2.5">
        <h2 className="font-semibold">{title}</h2>
        {children}
      </div>
    </li>
  );
}

export const Ext = ({ href, children }: { href: string; children: ReactNode }) =>
  <a href={href} target="_blank" rel="noopener" className="font-medium text-primary-strong underline underline-offset-2">{children}<span className="sr-only"> (opens in a new tab)</span></a>;

export const Mono = ({ children }: { children: ReactNode }) => <code className="font-mono text-sm">{children}</code>;

/** Download links for a lab's scripts. Files are served only to browsers with lab access. */
export function Scripts({ lab, files }: { lab: LabId; files: readonly (readonly [string, string])[] }) {
  return (
    <ul className="space-y-2">
      {files.map(([f, d]) => (
        <li key={f} className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <a href={`/lab-files/${lab}/${f}`} download className="inline-flex items-center gap-1.5 font-mono text-sm font-medium text-primary-strong underline underline-offset-2">
            <Download className="size-4" aria-hidden />{f}
          </a>
          <span className="text-sm text-muted-foreground">{d}</span>
        </li>
      ))}
    </ul>
  );
}

/** The six Monday tickets, with what each asks for on this platform. */
export function TicketList({ todo }: { todo: Record<string, string> }) {
  return (
    <ul className="divide-y rounded-lg border">
      {LAB_TICKETS.map(id => (
        <li key={id} className="space-y-1 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2"><Tag className="font-mono">{id}</Tag><span className="font-medium">{TK[id].title}</span></div>
          <p className="text-sm text-muted-foreground">{todo[id]}</p>
        </li>
      ))}
    </ul>
  );
}

export function UploadResults({ guide }: { guide: LabGuide }) {
  const { file: expected, script, grade } = guide.upload;
  const [result, setResult] = useState<LabResult | null>(null);
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const id = useId();
  // Move focus to the score once it renders, so screen readers start at the result.
  useEffect(() => { if (result) heading.current?.focus(); }, [result]);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setFile(f.name); setResult(null);
    try {
      if (f.size > 1_000_000) throw new ExportError(`This file is too large to be a lab export. Upload ${expected}.`);
      const text = await f.text();
      setResult(grade(text)); setRaw(text); setError(null);
    } catch (e) {
      setError(e instanceof ExportError ? e.message : "The file couldn't be read. Export it again and upload the new file.");
    }
    if (input.current) input.current.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor={id} className="font-semibold">Export file</label>
        <p id={`${id}-help`} className="text-sm text-muted-foreground">{expected}, from {script}. Grading runs in your browser; the file isn't uploaded anywhere.</p>
        <div className="flex flex-wrap items-center gap-3">
          <input ref={input} id={id} type="file" accept=".json,application/json" className="sr-only" aria-describedby={`${id}-help${error ? ` ${id}-err` : ""}`}
            aria-invalid={!!error} onChange={e => onFile(e.target.files?.[0])} />
          <Button type="button" onClick={() => input.current?.click()} className="font-bold"><Upload className="size-4" aria-hidden />Choose export file</Button>
          {file && <span className="font-mono text-sm text-muted-foreground">{file}</span>}
        </div>
        {error && <p id={`${id}-err`} role="alert" className="text-sm font-medium text-destructive">{error}</p>}
      </div>

      {result && (
        <section aria-labelledby="lab-score" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3 rounded-lg border bg-muted/40 p-4">
            <div>
              <h2 id="lab-score" ref={heading} tabIndex={-1} className="font-semibold outline-none">Lab score</h2>
              <p className="text-sm text-muted-foreground">Exported {new Date(result.exportedAt).toLocaleString()}. Graded with the same checks as the Monday shift.</p>
            </div>
            <div className="font-mono text-3xl">{result.score}/{result.max}</div>
          </div>
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed p-4">
            <p className="min-w-0 flex-1 text-sm">Add this lab to your portfolio: a ready-to-push GitHub project with a README of the tickets, checks and results.</p>
            <Button type="button" variant="outline" onClick={() => downloadPortfolio(guide.id, guide.name, result, expected, raw)}><FolderGit2 className="size-4" aria-hidden />Download portfolio project</Button>
          </div>
          {result.tickets.map(t => (
            <article key={t.id} aria-labelledby={`lab-${t.id}`} className="space-y-3 rounded-lg border p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2"><Tag className="font-mono">{t.id}</Tag><h3 id={`lab-${t.id}`} className="font-semibold">{t.title}</h3></div>
                <Tag tone={t.score === t.max ? "ok" : "warn"} className="font-mono">{t.score}/{t.max}</Tag>
              </div>
              <Checks checks={t.checks} />
              <p className="rounded-r-md border-l-2 border-primary bg-primary/8 px-4 py-2 text-sm"><b>Takeaway.</b> {t.lesson}</p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

export function Trouble({ items }: { items: [string, ReactNode][] }) {
  return (
    <div className="divide-y rounded-lg border">
      {items.map(([q, a]) => (
        <details key={q} className="group px-4 py-3">
          <summary className="cursor-pointer font-medium">{q}</summary>
          <p className="pt-2 text-sm text-muted-foreground [&_code]:text-foreground">{a}</p>
        </details>
      ))}
    </div>
  );
}

export function Resources({ items, vendor }: { items: LabGuide["resources"]; vendor: string }) {
  return (
    <aside aria-labelledby="lab-res" className="space-y-3">
      <SectionLabel id="lab-res">Resources</SectionLabel>
      <ul className="space-y-3">
        {items.map(([t, href, d]) => (
          <li key={href}>
            <a href={href} target="_blank" rel="noopener" className="group inline-flex items-start gap-1.5 font-medium text-primary-strong hover:underline">
              {t}<ExternalLink className="mt-1 size-3.5 shrink-0" aria-hidden /><span className="sr-only"> (opens in a new tab)</span>
            </a>
            <p className="text-sm text-muted-foreground">{d}</p>
          </li>
        ))}
      </ul>
      <p className="pt-2 text-xs text-muted-foreground">Links go to {vendor}'s official documentation. Rolevara is not affiliated with {vendor}.</p>
    </aside>
  );
}
