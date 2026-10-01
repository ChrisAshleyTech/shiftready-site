// Shift summary (IAM paths): the shift's score, reopens, what came back, strengths, what to work
// on, and the self-audit result on IAM + GRC.
import { CalendarCheck, RotateCcw, ShieldCheck, Siren } from "lucide-react";
import { IllusReopen } from "@/components/brand/illustrations";
import { S } from "@/engine/store.js";
import { TK } from "@/engine/tickets.js";
import { CONSEQ, queueTickets } from "@/engine/followups.js";
import { CONSEQ_LINKS } from "@/engine/hints.js";
import { skillScores, stage, summary } from "@/engine/skills.js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { pct, plural } from "../sim";
import { PageHeader, Empty, Meter } from "../components/bits";
import { path } from "../paths";
import { waTotals, weekAudit } from "../audit/weekAudit";
import { ticketNo, ticketName } from "../ticketLabel";

function Tile({ k, v, d }: { k: string; v: string; d: string }) {
  return <Card className="gap-1 rounded-2xl p-5"><span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{k}</span><span className="text-3xl font-extrabold tabular-nums text-primary-strong">{v}</span><span className="text-xs text-muted-foreground">{d}</span></Card>;
}

export default function ShiftSummary() {
  const p = path();
  const head = <PageHeader icon={CalendarCheck} tint="bg-hue-green/15 text-ok" title="Shift summary" sub="How your shift went, what came back to you, and what to practise next." />;
  if (stage() !== "done") {
    const s = summary(), n = queueTickets().length;
    return <>{head}<Empty art={IllusReopen} title="Your summary is ready when the queue is clear">
      {`${s.shift.done} of ${n} tickets closed. Replies and follow-ups can still land while tickets are open.`}
      <div className="mt-5"><Button asChild className="font-bold"><a href="#/queue">Back to the queue</a></Button></div></Empty></>;
  }
  const s = summary(), sk = skillScores().filter((x: any) => x.n);
  const strong = sk.filter((x: any) => x.pct >= 85).sort((a: any, b: any) => b.pct - a.pct).slice(0, 3);
  const weak = sk.filter((x: any) => x.pct < 85).sort((a: any, b: any) => a.pct - b.pct).slice(0, 3);
  const wa = weekAudit(), wt = waTotals(), skipped = !!S.wa?.skipped;
  const caused = CONSEQ.filter((c: any) => (S.report || []).some((r: any) => r.key === c.key && r.bad)).map((c: any) => ({ c, L: CONSEQ_LINKS[c.key] }));
  const reopened = queueTickets().filter((t: any) => S.tickets[t.id].reopens);
  return (
    <>
      {head}
      <div className="space-y-8">
        <section aria-label="Headline numbers" className={cn("grid grid-cols-2 gap-3", p === "iam-grc" ? "lg:grid-cols-5" : "lg:grid-cols-4")}>
          <Tile k="Shift score" v={pct(s.shiftPct)} d="Every ticket, after hint penalties" />
          <Tile k="Solo · Assisted" v={`${s.solo} · ${s.assisted}`} d={`${plural(s.hints, "hint", "hints")} used`} />
          <Tile k="Reopened" v={String(s.reopened)} d="Requester said the fix didn't work" />
          <Tile k="Follow-ups caused" v={String(s.caused)} d={`${s.prevented} prevented`} />
          {p === "iam-grc" && <Tile k="Self-audit" v={wa && wt.done ? pct(wt.pct) : "–"} d={skipped ? "Skipped" : wa ? `${wt.done}/${wt.n} tasks submitted` : "Not started"} />}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="gap-3 p-5">
            <h2 className="text-lg font-semibold">What went well</h2>
            {strong.length ? <ul className="space-y-3">{strong.map((x: any) => <li key={x.key} className="space-y-1.5"><div className="flex justify-between text-sm"><span className="font-medium">{x.label}</span><span className="font-mono">{pct(x.pct)}</span></div><Meter value={x.pct} label={x.label} /></li>)}</ul>
              : <p className="text-sm text-muted-foreground">No skill reached 85% this shift. The list opposite shows where to start.</p>}
          </Card>
          <Card className="gap-3 p-5">
            <h2 className="text-lg font-semibold">Work on next</h2>
            {weak.length ? <ul className="space-y-2 text-sm">{weak.map((x: any) => <li key={x.key}><b>{x.label} ({pct(x.pct)})</b>: {x.blurb}</li>)}</ul>
              : <p className="text-sm text-muted-foreground">Every skill scored 85% or more. Try another path or company next.</p>}
          </Card>
        </div>

        <section aria-labelledby="ws-cq" className="space-y-3">
          <h2 id="ws-cq" className="text-lg font-semibold">What came back to you</h2>
          <p className="text-sm text-muted-foreground">{caused.length || reopened.length ? `${plural(caused.length, "follow-up", "follow-ups")} came back from earlier work, and ${plural(reopened.length, "ticket was", "tickets were")} reopened by the requester. ${s.prevented} follow-ups were prevented.` : "Nothing came back. Every fix held, and every follow-up was prevented."}</p>
          <ul className="grid gap-2 md:grid-cols-2">
            {caused.map(({ c, L }: any) => (
              <li key={c.key} className="flex gap-3 rounded-lg border border-bad/30 bg-bad/10 p-3 text-sm"><Siren className="mt-0.5 size-4 shrink-0 text-bad" aria-hidden />
                <span><a className="font-mono text-xs text-primary-strong underline" href={`#/queue/${L.src}`}>{L.src}</a> → <a className="font-mono text-xs text-primary-strong underline" href={`#/queue/${L.id}`}>{TK[L.id]?.reopens ? `${L.src} reopened` : L.id}</a><span className="block">{TK[L.id]?.title ?? c.cause}</span></span></li>))}
            {reopened.map((t: any) => (
              <li key={t.id} className="flex gap-3 rounded-lg border border-warn/30 bg-warn/10 p-3 text-sm"><RotateCcw className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
                <span><a className="font-mono text-xs text-primary-strong underline" href={`#/queue/${t.id}`}>{ticketNo(t)}</a> reopened {S.tickets[t.id].reopens === 1 ? "once" : `${S.tickets[t.id].reopens} times`}<span className="block">{ticketName(t)}</span></span></li>))}
            {!caused.length && !reopened.length && <li className="flex gap-3 rounded-lg border border-ok/30 bg-ok/10 p-3 text-sm"><ShieldCheck className="size-4 shrink-0 text-ok" aria-hidden />A clean shift.</li>}
          </ul>
        </section>

        <Card className="gap-3 p-5">
          <h2 className="text-lg font-semibold">Next</h2>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="font-bold"><a href="#/report">Share your readiness report</a></Button>
            <Button asChild variant="outline"><a href="#/results">Ticket-by-ticket results</a></Button>
            {p === "iam-grc" && (skipped || !wa) && <Button asChild variant="outline"><a href="#/audit">{skipped ? "Audit your shift after all" : "Audit your shift"}</a></Button>}
          </div>
          {p === "iam" && <p className="text-sm text-muted-foreground">Want to see your shift from the auditor's side? The IAM + GRC path adds an audit of your own work. <a className="text-primary-strong underline" href="#/settings">Change path</a></p>}
        </Card>
      </div>
    </>
  );
}
