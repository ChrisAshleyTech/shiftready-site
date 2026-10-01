// Shift results: per-ticket scores with hint penalties, Solo vs Assisted, reopens, and what each
// closed ticket caused later in the shift.
import { ArrowRight, ListChecks, ShieldCheck, Siren, Hourglass } from "lucide-react";
import { IllusReopen } from "@/components/brand/illustrations";
import { S } from "@/engine/store.js";
import { TK } from "@/engine/tickets.js";
import { CONSEQ, queueTickets } from "@/engine/followups.js";
import { totals, finalScore, hintsUsed, hintCost } from "@/engine/state.js";
import { CONSEQ_LINKS, HINTS, SKILLS } from "@/engine/hints.js";
import { summary } from "@/engine/skills.js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { num, pct, plural } from "../sim";
import { PageHeader, Status, Mode, Tag } from "../components/bits";
import { ticketNo, ticketName } from "../ticketLabel";

const skillLabel = (id: string) => (SKILLS.find((s: any) => s.key === (HINTS[id] || {}).skill) || {}).label || "";

function FollowUps() {
  const report = S.report || [];
  const items = CONSEQ.map((c: any) => { const r = report.find((x: any) => x.key === c.key); return { c, state: !r ? "pending" : r.bad ? "caused" : "prevented", L: CONSEQ_LINKS[c.key] }; })
    .sort((a: any, b: any) => ["caused", "prevented", "pending"].indexOf(a.state) - ["caused", "prevented", "pending"].indexOf(b.state));
  const caused = items.filter((x: any) => x.state === "caused").length, prevented = items.filter((x: any) => x.state === "prevented").length;
  if (!report.length) return (
    <Card className="grid items-center gap-5 rounded-3xl p-6 sm:grid-cols-[auto_1fr]">
      <IllusReopen className="h-28 w-auto" />
      <div className="space-y-2"><h2 className="text-xl font-bold">What your work causes</h2>
      <p className="text-sm text-muted-foreground">A couple of tickets after you close one, its follow-ups are checked. {CONSEQ.length} things can come back: a requester replying that it didn't work, or a new incident. Fix it right the first time and they never arrive.</p></div>
    </Card>
  );
  return (
    <section aria-labelledby="cq-h" className="space-y-4">
      <div>
        <h2 id="cq-h" className="text-lg font-semibold">What came back</h2>
        <p className="text-sm text-muted-foreground">{caused ? `${plural(caused, "follow-up", "follow-ups")} came back from earlier work.` : "Nothing has come back so far."} {prevented} prevented{items.length - caused - prevented ? `, ${items.length - caused - prevented} not checked yet (their ticket is still open, or it's on the way)` : ""}.</p>
      </div>
      <ol className="relative space-y-3 border-l border-border pl-6">
        {items.map(({ c, state, L }: any) => {
          const src = TK[L.src], sts = S.tickets[L.src], fu = state === "caused" ? TK[L.id] : null, fts = fu ? S.tickets[L.id] : null, bad = state === "caused";
          return (
            <li key={c.key} className="relative">
              <span aria-hidden className={cn("absolute -left-[33px] top-4 grid size-5 place-items-center rounded-full border-2 border-background", bad ? "bg-bad" : state === "prevented" ? "bg-ok" : "bg-muted-foreground/40")} />
              <div className="grid items-stretch gap-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                <div className="rounded-lg border bg-card p-3 text-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">You worked · <a className="font-mono text-primary underline-offset-2 hover:underline" href={`#/queue/${L.src}`}>{L.src}</a></p>
                  <p className="mt-1 font-medium">{src.title}</p>
                  <p className="text-muted-foreground">{sts.checks ? `Scored ${num(finalScore(sts))}/${sts.max}` : "Not closed yet"}</p>
                </div>
                <ArrowRight aria-hidden className="hidden size-4 self-center text-muted-foreground md:block" />
                <div className={cn("rounded-lg border p-3 text-sm", bad ? "border-bad/40 bg-bad/10" : state === "prevented" ? "border-ok/30 bg-ok/10" : "bg-muted/30")}>
                  <p className={cn("flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]", bad ? "text-bad" : state === "prevented" ? "text-ok" : "text-muted-foreground")}>
                    {bad ? <Siren className="size-3.5" aria-hidden /> : state === "prevented" ? <ShieldCheck className="size-3.5" aria-hidden /> : <Hourglass className="size-3.5" aria-hidden />}
                    {bad ? <>{fu.reopens ? "Reopened" : "Came back"} · <a className="font-mono underline-offset-2 hover:underline" href={`#/queue/${L.id}`}>{ticketNo(fu)}</a></> : state === "prevented" ? "Prevented" : "Not checked yet"}</p>
                  {bad ? <>
                      <p className="mt-1 font-medium"><span className="sr-only">Caused: </span>{fu.title}</p>
                      <p className="text-muted-foreground">{c.cause}</p>
                      <div className="mt-2 flex gap-1">{fts.checks ? <><Status st={fts.status} /><Tag className="font-mono">{num(finalScore(fts))}/{fts.max}</Tag></> : <Tag tone="bad">Open</Tag>}</div>
                    </> : state === "prevented" ? <p className="mt-1"><span className="sr-only">Prevented: </span>{c.prevented}</p>
                    : <p className="mt-1 text-muted-foreground">Checked a couple of tickets after {L.src} is closed.</p>}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default function Results() {
  const list = queueTickets(), tt = totals(list), s = summary();
  const tiles: [string, string, string][] = [
    ["Score", pct(tt.pct), `${num(tt.sc)} of ${tt.mx} points`],
    ["Closed", `${tt.done}/${list.length}`, tt.done < list.length ? `${list.length - tt.done} still open` : "Queue clear"],
    ["Reopened", String(s.reopened), s.reopens > s.reopened ? `${s.reopens} reopens in all` : "Fix didn't work the first time"],
    ["Solo · Assisted", `${tt.solo} · ${tt.assisted}`, "Assisted used the exact-steps hint"],
    ["Follow-ups caused", String(s.caused), `${s.prevented} prevented`],
  ];
  return (
    <>
      <PageHeader icon={ListChecks} tint="bg-hue-green/15 text-ok" title="Shift results" sub="Every ticket's grade after hint penalties. You pay for the highest hint tier you opened: nudge −10%, policy clause −25%, exact steps −50%. A reopened ticket keeps the grade of its first resolution." />
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {tiles.map(([k, v, d]) => (
            <Card key={k} className="lift gap-1 rounded-2xl p-5"><span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{k}</span>
              <span className="text-3xl font-extrabold tabular-nums text-primary-strong">{v}</span><span className="text-xs text-muted-foreground">{d}</span></Card>))}
        </div>
        <FollowUps />
        <section aria-labelledby="tt-h" className="space-y-3">
          <h2 id="tt-h" className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Tickets</h2>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <caption className="sr-only">Tickets with scores</caption>
              <TableHeader><TableRow><TableHead>Ticket</TableHead><TableHead>Skill</TableHead><TableHead>Result</TableHead><TableHead className="text-right">Raw</TableHead><TableHead className="text-right">Hints</TableHead><TableHead className="text-right">Final</TableHead><TableHead>Mode</TableHead></TableRow></TableHeader>
              <TableBody>{list.slice().sort((a: any, b: any) => a.pri - b.pri).map((t: any) => {
                const ts = S.tickets[t.id], u = hintsUsed(ts);
                return (
                  <TableRow key={t.id}>
                    <TableCell className="whitespace-normal"><a className="font-mono text-xs text-primary underline-offset-2 hover:underline" href={`#/queue/${t.id}`}>{ticketNo(t)}</a>{t.reopens && <span className="text-xs text-muted-foreground"> (reopened)</span>}<div>{t.reopens ? t.title : ticketName(t)}</div>
                      {ts.reopens > 0 && <div className="text-xs text-bad">Reopened {ts.reopens === 1 ? "once" : `${ts.reopens} times`}</div>}</TableCell>
                    <TableCell className="text-muted-foreground">{skillLabel(t.id)}</TableCell>
                    <TableCell><Status st={ts.checks ? ts.status : ts.status === "reopened" ? "reopened" : "open"} /></TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{ts.checks ? `${ts.score}/${ts.max}` : "–"}</TableCell>
                    <TableCell className="text-right tabular-nums">{u ? `${plural(u, "tier", "tiers")} · −${Math.round(hintCost(ts) * 100)}%` : "–"}</TableCell>
                    <TableCell className="text-right font-mono font-semibold tabular-nums">{ts.checks ? num(finalScore(ts)) : "–"}</TableCell>
                    <TableCell><Mode ts={ts} /></TableCell>
                  </TableRow>);
              })}</TableBody>
            </Table>
          </div>
        </section>
        <div className="flex flex-wrap gap-2">
          <Button asChild><a href="#/report">Readiness report</a></Button>
          <Button asChild variant="outline"><a href="#/queue">Back to the queue</a></Button>
        </div>
      </div>
    </>
  );
}
