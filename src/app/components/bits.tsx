// Small shared pieces: status tags, grade checks, meters, page headers.
import type { ComponentType, ReactNode } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { finalScore, isAssisted, hintsUsed } from "@/engine/state.js";
import { num } from "../sim";

type Tone = "neutral" | "ok" | "warn" | "bad" | "info" | "primary" | "solid";
const TONES: Record<Tone, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  ok: "border-transparent bg-ok/12 text-ok",
  warn: "border-transparent bg-warn/12 text-warn",
  bad: "border-transparent bg-bad/12 text-bad",
  info: "border-transparent bg-info/12 text-info",
  primary: "border-transparent bg-primary/12 text-primary",
  solid: "border-transparent bg-foreground text-background",
};
export function Tag({ tone = "neutral", className, children, title }: { tone?: Tone; className?: string; children: ReactNode; title?: string }) {
  return <span title={title} className={cn("inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-md border px-2 text-xs font-medium", TONES[tone], className)}>{children}</span>;
}

export function Pri({ p }: { p: number }) {
  const tone = p === 1 ? "bad" : p === 2 ? "warn" : "neutral";
  return <Tag tone={tone} className="font-mono" title={`Priority ${p}`}>P{p}</Tag>;
}
export function Status({ st }: { st: string }) {
  if (st === "working") return <Tag tone="primary"><span className="size-1.5 rounded-full bg-current" aria-hidden />In progress</Tag>;
  if (st === "resolved") return <Tag tone="ok">Resolved</Tag>;
  if (st === "rejected") return <Tag tone="warn">Rejected</Tag>;
  if (st === "open") return <Tag>Open</Tag>;
  return <Tag>New</Tag>;
}
// Solo / Assisted: shown on closed tickets, and on open tickets once exact steps are revealed.
export function Mode({ ts }: { ts: any }) {
  if (isAssisted(ts)) return <Tag tone="warn" title="Exact-steps hint used">Assisted</Tag>;
  return ts.checks ? <Tag tone="solid" title="Closed without the exact-steps hint">Solo</Tag> : null;
}
export function Score({ ts }: { ts: any }) {
  if (!ts.checks) return null;
  return <Tag className="font-mono" title={hintsUsed(ts) ? `Raw ${ts.score}/${ts.max}, hint penalty applied` : "Score"}>{num(finalScore(ts))}/{ts.max}</Tag>;
}
export function UserTags({ u }: { u: any }) {
  const out: ReactNode[] = [];
  if (u.preHire && !u.enabled) out.push(<Tag key="p" tone="info">Pre-hire</Tag>);
  else if (!u.enabled) out.push(<Tag key="d" tone="bad">Disabled</Tag>);
  if (u.locked) out.push(<Tag key="l" tone="warn">Locked</Tag>);
  if (u.type !== "Employee") out.push(<Tag key="t">{u.type}</Tag>);
  return out.length ? <>{out}</> : <Tag tone="ok">Active</Tag>;
}

export function Checks({ checks }: { checks: { pass: boolean; label: string; pts: number; detail: string }[] }) {
  return (
    <ul className="divide-y divide-border">
      {checks.map((c, i) => (
        <li key={i} className="grid grid-cols-[1.5rem_1fr_auto] items-start gap-2 py-2.5 text-sm">
          {c.pass ? <Check className="mt-0.5 size-4 text-ok" aria-hidden /> : <X className="mt-0.5 size-4 text-bad" aria-hidden />}
          <span><span className="sr-only">{c.pass ? "Passed: " : "Missed: "}</span>{c.label}{c.detail && <span className="mt-0.5 block text-xs text-muted-foreground">{c.detail}</span>}</span>
          <span className="font-mono text-xs text-muted-foreground">{c.pass ? c.pts : 0}/{c.pts}</span>
        </li>
      ))}
    </ul>
  );
}

// Score meters are toned by result; progress meters (neutral) always use the primary colour.
export function Meter({ value, label, neutral }: { value: number | null; label: string; neutral?: boolean }) {
  const tone = neutral || value == null ? "bg-primary" : value >= 85 ? "bg-ok" : value >= 65 ? "bg-primary" : value >= 45 ? "bg-warn" : "bg-bad";
  return (
    <div role="img" aria-label={`${label}: ${value == null ? "not started" : value + "%"}`} className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full transition-[width] duration-500", tone)} style={{ width: `${value ?? 0}%` }} />
    </div>
  );
}

// Page header with an optional coloured icon badge.
export function PageHeader({ title, sub, children, icon: Icon, tint = "bg-primary/12 text-primary-strong" }: { title: ReactNode; sub?: ReactNode; children?: ReactNode; icon?: ComponentType<{ className?: string }>; tint?: string }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 items-start gap-4">
        {Icon && <span className={cn("hidden size-12 shrink-0 place-items-center rounded-2xl sm:grid", tint)}><Icon className="size-6" aria-hidden /></span>}
        <div className="min-w-0">
        <h1 tabIndex={-1} data-page-title className="text-2xl font-extrabold md:text-3xl">{title}</h1>
        {sub && <p className="mt-1 max-w-[70ch] text-muted-foreground">{sub}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

// Engine-authored HTML (ticket bodies, runbook clauses, hint steps). Our own content, not user input.
export function Html({ html, className, as: As = "div" }: { html: string; className?: string; as?: "div" | "span" | "p" }) {
  return <As className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function SectionLabel({ children, id }: { children: ReactNode; id?: string }) {
  return <h3 id={id} className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{children}</h3>;
}

// Empty state with an optional illustration.
export function Empty({ title, children, art: Art }: { title: string; children?: ReactNode; art?: ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-primary/20 bg-card px-6 py-10 text-center">
      {Art && <Art className="mx-auto mb-4 h-32 w-auto" />}
      <p className="font-display text-xl font-bold">{title}</p>
      {children && <div className="mt-1 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}
