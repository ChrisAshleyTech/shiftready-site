// Readiness report renderer, shared by the in-app page and the public /report/ page.
// It only reads the report data (decoded from the link), never live simulator state.
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import { ShieldCheck } from "lucide-react";
import { skillsFor } from "@/engine/hints.js";
import { ticketTitle } from "@/engine/report.js";
import { Card } from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IllusChart } from "@/components/brand/illustrations";
import { brandFor, deskShort } from "@/packs/brands";
import { LevelBadge, isLevel, linkedInImage } from "@/components/brand/LevelBadge";

// The company's audit desk, for the tile label: "Q3 SOX desk".
const desk = (c?: string) => deskShort(c).replace(/^./, x => x.toUpperCase());

const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const pct = (n: number | null | undefined) => (n == null ? "–" : n + "%");
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// Readiness band. Needs the queue clear; weighs the shift score and how much was solved solo.
// `mon` is the assigned tickets and `thu` what arrived during the shift (names kept for old links).
export function band(d: any) {
  const closed = d.mon.done + (d.thu ? d.thu.done : 0), n = d.mon.n + (d.thu ? d.thu.n : 0), done = closed === n;
  const assisted = d.mon.assisted + (d.thu ? d.thu.assisted : 0);
  if (!done) return { label: "In progress", tone: "neutral", note: `${closed} of ${n} tickets closed so far.` };
  const share = closed ? assisted / closed : 0, p = d.week ?? 0;
  const [label, tone] = p >= 90 && share <= 0.1 ? ["Ready for a real queue", "ok"] : p >= 75 && share <= 0.25 ? ["Nearly ready", "ok"] : p >= 60 ? ["Developing", "warn"] : ["Early practice", "bad"];
  return { label, tone, note: "Based on the full shift." };
}

function Tile({ k, v, d }: { k: string; v: string; d: string }) {
  return <Card className="gap-1 p-4"><span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{k}</span><span className="font-mono text-2xl tabular-nums">{v}</span><span className="text-xs text-muted-foreground">{d}</span></Card>;
}
// Short axis labels so the radar never clips; full names are in the list beside it.
const SHORT: Record<string, string> = { verify: "Verification", jml: "JML", access: "Least privilege", incident: "Incidents", hygiene: "Hygiene",
  jit: "Just in time", standing: "Standing access", vault: "Vault", emergency: "Break-glass", monitor: "Monitoring" };
const chartConfig = { value: { label: "Score", color: "var(--chart-1)" } } satisfies ChartConfig;

// Path names for the header. Links made before paths existed have no path.
const PATH_NAME: Record<string, string> = { iam: "IAM only path", "iam-grc": "IAM + GRC path", grc: "GRC only path", pam: "PAM path" };

// GRC only: audit readiness from the audit of Jordan Reyes' shift.
export function auditBand(d: any) {
  const a = d.audit;
  if (a.done < a.n) return { label: "In progress", tone: "neutral", note: `${a.done} of ${a.n} audit tasks submitted so far.` };
  const p = a.pct ?? 0;
  const label = p >= 90 ? "Ready for audit fieldwork" : p >= 75 ? "Nearly ready" : p >= 60 ? "Developing" : "Early practice";
  return { label, tone: p >= 75 ? "ok" : p >= 60 ? "warn" : "bad", note: "Based on the full audit of an IAM analyst's shift." };
}

export function ReportView({ d, own = false }: { d: any; own?: boolean }) {
  if (d.p === "grc") return <AuditReportView d={d} own={own} />;
  const b = band(d);
  const skills = skillsFor(d.p).map((sk: any) => ({ skill: sk.label, short: SHORT[sk.key] || sk.label, value: (d.skills.find((x: any) => x[0] === sk.key) || [])[1] ?? null }));
  const shift = (x: any) => x ? `${x.done}/${x.n} closed · ${x.solo} solo · ${x.assisted} assisted` : "Not started";
  const date = new Date(d.date + "T12:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const brand = brandFor(d.c);
  const rows = (list: any[], label: string) => list.length ? <>
    <TableRow className="hover:bg-transparent"><TableHead colSpan={4} scope="colgroup" className="bg-muted/40 text-foreground">{label}</TableHead></TableRow>
    {list.map(r => (
      <TableRow key={r[0]}>
        <TableCell className="whitespace-normal"><span className="font-mono text-xs text-muted-foreground">{r[0]}</span><div>{ticketTitle(r)}</div></TableCell>
        <TableCell>{r[4] === 0 ? "Open" : r[4] === 1 ? <span className="text-ok">Resolved</span> : <span className="text-warn">Rejected</span>}</TableCell>
        <TableCell className="text-right font-mono tabular-nums">{r[1] < 0 ? "–" : `${nf.format(r[1] / 10)}/${r[2]}`}</TableCell>
        <TableCell>{r[4] === 0 ? "–" : r[3] >= 3 ? <span className="rounded-md border border-warn/30 bg-warn/12 px-2 py-0.5 text-xs font-medium text-warn">Assisted</span>
          : <span className="text-xs"><span className="rounded-md bg-foreground px-2 py-0.5 font-medium text-background">Solo</span>{r[3] ? <span className="ml-2 text-muted-foreground">{plural(r[3], "hint", "hints")}</span> : null}</span>}</TableCell>
      </TableRow>))}
  </> : null;

  return (
    <article aria-labelledby="rp-h" className="space-y-6">
      {/* Fixed deep blue-to-violet so white text stays >= 6:1 in both themes. */}
      <header className="relative grid items-center gap-6 overflow-hidden rounded-3xl bg-brand-band p-6 text-white shadow-xl shadow-primary/20 md:grid-cols-[1fr_auto] md:p-9">
        <div className="relative space-y-3">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white/85"><ShieldCheck className="size-4" aria-hidden />Rolevara readiness report</p>
          <h1 id="rp-h" tabIndex={-1} data-page-title className="text-3xl font-extrabold md:text-5xl">{d.name || "IAM analyst readiness"}</h1>
          <p className="flex flex-wrap items-center gap-2 text-white/90"><brand.Mark className="size-6 shrink-0 rounded-md ring-1 ring-white/50" />{PATH_NAME[d.p] ?? "IAM Ops track"} · {brand.name} simulation · {date}</p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <span className="rounded-lg bg-white px-3 py-1.5 text-sm font-bold text-brand-navy">{b.label}</span>
            <span className="text-sm text-white/90">{b.note}</span>
          </div>
        </div>
        {/* A level badge shows only on reports that carry a level (practice levels, when they ship). */}
        {isLevel(d.level) ? (
          <div className="relative flex flex-col items-start gap-3 rounded-3xl bg-[#0B2B5F] p-5 text-white ring-1 ring-[#2A4A80]">
            <LevelBadge level={d.level} />
            <a href={linkedInImage(d.level)} download className="text-sm font-semibold text-[#2DD4CF] underline underline-offset-2">Download LinkedIn image</a>
          </div>
        ) : <div className="relative hidden rounded-3xl bg-white/95 p-4 md:block"><IllusChart className="h-36 w-auto" /></div>}
      </header>
      <section aria-label="Headline numbers" className={`grid grid-cols-2 gap-3 ${d.p === "iam-grc" ? "lg:grid-cols-3 xl:grid-cols-6" : d.p === "iam" || d.p === "pam" ? "lg:grid-cols-4" : "lg:grid-cols-5"}`}>
        <Tile k="Shift score" v={pct(d.week)} d="After hint penalties" />
        <Tile k="Tickets" v={`${d.mon.done + (d.thu ? d.thu.done : 0)}/${d.mon.n + (d.thu ? d.thu.n : 0)}`} d={`closed · ${d.mon.solo + (d.thu ? d.thu.solo : 0)} solo · ${d.mon.assisted + (d.thu ? d.thu.assisted : 0)} assisted`} />
        <Tile k="Reopened" v={d.reopened == null ? "–" : String(d.reopened)} d="Requester said the fix didn't work" />
        <Tile k="Follow-ups caused" v={d.caused == null ? "–" : String(d.caused)} d={d.caused == null ? "None checked yet" : `${d.prevented} prevented`} />
        {d.p === "iam-grc" && <Tile k="Self-audit" v={d.fri ? pct(d.fri.pct) : "–"} d={d.fri ? `${d.fri.done}/${d.fri.n} tasks · own shift` : "Not attempted"} />}
        {d.p !== "iam" && d.p !== "pam" && <Tile k={d.p ? desk(d.c) : "GRC audit"} v={d.grc ? pct(d.grc.pct) : "–"} d={d.grc ? `${d.grc.done}/${d.grc.n} tasks` : "Not attempted"} />}
      </section>
      <Card className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:p-6">
        <div>
          <h2 className="text-lg font-semibold">Skills</h2>
          <ul className="mt-3 divide-y">
            {skills.map((s: any) => (
              <li key={s.skill} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span>{s.skill}</span><span className="font-mono tabular-nums">{s.value == null ? <span className="text-muted-foreground">Not tested</span> : pct(s.value)}</span>
              </li>))}
          </ul>
        </div>
        <div role="img" aria-label={"Skills radar: " + skills.map((s: any) => `${s.skill} ${s.value == null ? "not tested" : s.value + "%"}`).join(", ")}>
          <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
            <RadarChart data={skills.map((s: any) => ({ ...s, value: s.value ?? 0 }))} outerRadius="70%">
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="short" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <Radar dataKey="value" stroke="var(--color-value)" fill="var(--color-value)" fillOpacity={0.25} strokeWidth={2} isAnimationActive={false} />
            </RadarChart>
          </ChartContainer>
        </div>
      </Card>
      <section aria-labelledby="rt-h" className="space-y-3">
        <h2 id="rt-h" className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Every ticket</h2>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <caption className="sr-only">Ticket results</caption>
            <TableHeader><TableRow><TableHead>Ticket</TableHead><TableHead>Result</TableHead><TableHead className="text-right">Score</TableHead><TableHead>Solo / Assisted</TableHead></TableRow></TableHeader>
            <TableBody>{rows(d.tickets.slice(0, d.mon.n), "Assigned at the start of the shift")}{rows(d.tickets.slice(d.mon.n), "Arrived during the shift")}</TableBody>
          </Table>
        </div>
      </section>
      <section className="space-y-2 rounded-xl border border-dashed p-5 text-sm">
        <h2 className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">How to read this</h2>
        <p><b>Solo</b> means the ticket was closed without the exact-steps hint. <b>Assisted</b> means the learner revealed the exact steps. Smaller hints (a nudge or the policy clause) cost 10% or 25% of a ticket's score, and the ticket still counts as Solo.</p>
        <p>The queue is live. When a fix doesn't work, the requester replies and the ticket is <b>reopened</b> until it's resolved, and it keeps the grade of its first resolution. <b>Follow-ups caused</b> counts the mistakes that came back later in the shift as new incidents or replies.</p>
        <p className="text-muted-foreground">This report was generated in the learner's own browser and isn't verified by Rolevara.{own ? "" : <> <a className="text-primary underline" href="/app/">Try the simulator yourself</a>.</>}</p>
      </section>
    </article>
  );
}

function AuditReportView({ d, own }: { d: any; own: boolean }) {
  const b = auditBand(d), a = d.audit;
  const date = new Date(d.date + "T12:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const brand = brandFor(d.c);
  return (
    <article aria-labelledby="rp-h" className="space-y-6">
      <header className="relative grid items-center gap-6 overflow-hidden rounded-3xl bg-brand-band p-6 text-white shadow-xl shadow-primary/20 md:grid-cols-[1fr_auto] md:p-9">
        <div className="relative space-y-3">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white/85"><ShieldCheck className="size-4" aria-hidden />Rolevara readiness report</p>
          <h1 id="rp-h" tabIndex={-1} data-page-title className="text-3xl font-extrabold md:text-5xl">{d.name || "IT audit readiness"}</h1>
          <p className="flex flex-wrap items-center gap-2 text-white/90"><brand.Mark className="size-6 shrink-0 rounded-md ring-1 ring-white/50" />{PATH_NAME.grc} · {brand.name} simulation · {date}</p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <span className="rounded-lg bg-white px-3 py-1.5 text-sm font-bold text-brand-navy">{b.label}</span>
            <span className="text-sm text-white/90">{b.note}</span>
          </div>
        </div>
        <div className="relative hidden rounded-3xl bg-white/95 p-4 md:block"><IllusChart className="h-36 w-auto" /></div>
      </header>
      <section aria-label="Headline numbers" className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Tile k="Audit score" v={pct(a.pct)} d={`${a.sc} of ${a.mx} points`} />
        <Tile k="Tasks" v={`${a.done}/${a.n}`} d="Walkthrough to management response" />
        <Tile k={desk(d.c)} v={d.grc ? pct(d.grc.pct) : "–"} d={d.grc ? `${d.grc.done}/${d.grc.n} extra tasks` : "Not attempted"} />
      </section>
      <section aria-labelledby="ra-h" className="space-y-3">
        <h2 id="ra-h" className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Every audit task</h2>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <caption className="sr-only">Audit task results</caption>
            <TableHeader><TableRow><TableHead>Task</TableHead><TableHead className="text-right">Score</TableHead></TableRow></TableHeader>
            <TableBody>{d.tasks.map((t: any[], i: number) => (
              <TableRow key={t[0]}><TableCell>{i + 1}. {t[1]}</TableCell><TableCell className="text-right font-mono tabular-nums">{t[2] < 0 ? "Not submitted" : `${t[2]}/${t[3]}`}</TableCell></TableRow>))}</TableBody>
          </Table>
        </div>
      </section>
      <section className="space-y-2 rounded-xl border border-dashed p-5 text-sm">
        <h2 className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">How to read this</h2>
        <p>The learner audited a simulated IAM analyst's shift: a walkthrough, sample selection, control testing against the audit log and directory, evidence evaluation, a written finding, risk ratings and a review of management's response. Answers are graded against the evidence in the simulated shift.</p>
        <p className="text-muted-foreground">This report was generated in the learner's own browser and isn't verified by Rolevara.{own ? "" : <> <a className="text-primary underline" href="/app/">Try the simulator yourself</a>.</>}</p>
      </section>
    </article>
  );
}
