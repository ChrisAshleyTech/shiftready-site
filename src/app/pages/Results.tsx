// Shift results: per-ticket scores with hint penalties, Solo vs Assisted, and the
// Monday-to-Thursday consequence timeline.
import { ArrowRight, ShieldCheck, Siren } from "lucide-react";
import { S } from "@/engine/store.js";
import { T, TK } from "@/engine/tickets.js";
import { CONSEQ, THU_T } from "@/engine/thursday.js";
import { totals, finalScore, hintsUsed, hintCost } from "@/engine/state.js";
import { CONSEQ_LINKS, HINTS, SKILLS } from "@/engine/hints.js";
import { summary } from "@/engine/skills.js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ui, num, pct, plural, type Route } from "../sim";
import { startThursday } from "../actions";
import { PageHeader, Status, Mode, Tag } from "../components/bits";

const skillLabel = (id: string) => (SKILLS.find((s: any) => s.key === (HINTS[id] || {}).skill) || {}).label || "";
const viewLink = (v: "mon" | "cur") => () => { ui.view = v; };

function Consequences() {
  if (S.shift !== "thu") {
    const open = T.filter((t: any) => !S.tickets[t.id].checks).length;
    return (
      <Card className="gap-2 p-5">
        <h2 className="text-lg font-semibold">What Monday will cause</h2>
        <p className="text-sm text-muted-foreground">Consequences are revealed when the Thursday shift starts. {CONSEQ.length} of Monday's decisions can come back as incidents or requests.{open ? ` Finish the ${plural(open, "open ticket", "open tickets")} first.` : ""}</p>
      </Card>
    );
  }
  const items = CONSEQ.map((c: any, i: number) => ({ c, bad: !!(S.report[i] && S.report[i].bad), L: CONSEQ_LINKS[c.key] }))
    .sort((a: any, b: any) => Number(b.bad) - Number(a.bad));
  const caused = items.filter((x: any) => x.bad).length;
  return (
    <section aria-labelledby="cq-h" className="space-y-4">
      <div>
        <h2 id="cq-h" className="text-lg font-semibold">What Monday caused</h2>
        <p className="text-sm text-muted-foreground">{caused ? `${plural(caused, "decision", "decisions")} from Monday came back on Thursday. ${items.length - caused} were prevented.` : "Nothing you did on Monday came back. Every consequence was prevented."}</p>
      </div>
      <ol className="relative space-y-3 border-l border-border pl-6">
        {items.map(({ c, bad, L }: any) => {
          const mon = TK[L.mon], mts = S.tickets[L.mon], thuT = bad ? TK[L.thu] : null, tts = thuT ? S.tickets[L.thu] : null;
          return (
            <li key={c.key} className="relative">
              <span aria-hidden className={cn("absolute -left-[33px] top-4 grid size-5 place-items-center rounded-full border-2 border-background", bad ? "bg-bad" : "bg-ok")} />
              <div className="grid items-stretch gap-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                <div className="rounded-lg border bg-card p-3 text-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Monday · <a className="font-mono text-primary underline-offset-2 hover:underline" href={`#/queue/${L.mon}`} onClick={viewLink("mon")}>{L.mon}</a></p>
                  <p className="mt-1 font-medium">{mon.title}</p>
                  <p className="text-muted-foreground">{mts.checks ? `Scored ${num(finalScore(mts))}/${mts.max}` : "Not closed"}</p>
                </div>
                <ArrowRight aria-hidden className="hidden size-4 self-center text-muted-foreground md:block" />
                <div className={cn("rounded-lg border p-3 text-sm", bad ? "border-bad/40 bg-bad/10" : "border-ok/30 bg-ok/10")}>
                  <p className={cn("flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]", bad ? "text-bad" : "text-ok")}>
                    {bad ? <Siren className="size-3.5" aria-hidden /> : <ShieldCheck className="size-3.5" aria-hidden />}
                    Thursday · {bad ? <a className="font-mono underline-offset-2 hover:underline" href={`#/queue/${L.thu}`} onClick={viewLink("cur")}>{L.thu}</a> : "Prevented"}</p>
                  {bad ? <>
                      <p className="mt-1 font-medium"><span className="sr-only">Caused: </span>{thuT.title}</p>
                      <p className="text-muted-foreground">{c.cause}</p>
                      <div className="mt-2 flex gap-1">{tts.checks ? <><Status st={tts.status} /><Tag className="font-mono">{num(finalScore(tts))}/{tts.max}</Tag></> : <Tag tone="bad">Open</Tag>}</div>
                    </> : <p className="mt-1"><span className="sr-only">Prevented: </span>{c.prevented}</p>}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default function Results({ r }: { r: Route }) {
  const thu = S.shift === "thu";
  const tab = thu && r.query.get("s") !== "mon" ? "thu" : "mon";
  const list = tab === "thu" ? THU_T : T, tt = totals(list), s = summary();
  const tiles: [string, string, string][] = [
    ["Score", pct(tt.pct), `${num(tt.sc)} of ${tt.mx} points`],
    ["Closed", `${tt.done}/${list.length}`, tt.done < list.length ? `${list.length - tt.done} still open` : "All tickets closed"],
    ["Solo", String(tt.solo), "Closed without exact steps"],
    ["Assisted", String(tt.assisted), "Used the exact-steps hint"],
    ...(tab === "thu" ? [["Caused by Monday", String(s.caused), `${s.prevented} prevented`] as [string, string, string]] : []),
  ];
  return (
    <>
      <PageHeader title="Shift results" sub="Every ticket's grade after hint penalties. You pay for the highest hint tier you opened: nudge −10%, policy clause −25%, exact steps −50%.">
        {thu && (
          <nav aria-label="Shift" className="inline-flex rounded-lg border bg-muted/40 p-1">
            {([["mon", "Monday"], ["thu", "Thursday"]] as const).map(([k, l]) => (
              <a key={k} href={`#/results?s=${k}`} aria-current={tab === k ? "page" : undefined}
                className={cn("rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground", tab === k && "bg-background text-foreground shadow-sm")}>{l}</a>))}
          </nav>
        )}
      </PageHeader>
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {tiles.map(([k, v, d]) => (
            <Card key={k} className="gap-1 p-4"><span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{k}</span>
              <span className="font-mono text-2xl tabular-nums">{v}</span><span className="text-xs text-muted-foreground">{d}</span></Card>))}
        </div>
        <Consequences />
        <section aria-labelledby="tt-h" className="space-y-3">
          <h2 id="tt-h" className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Tickets</h2>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <caption className="sr-only">{tab === "thu" ? "Thursday" : "Monday"} tickets with scores</caption>
              <TableHeader><TableRow><TableHead>Ticket</TableHead><TableHead>Skill</TableHead><TableHead>Result</TableHead><TableHead className="text-right">Raw</TableHead><TableHead className="text-right">Hints</TableHead><TableHead className="text-right">Final</TableHead><TableHead>Mode</TableHead></TableRow></TableHeader>
              <TableBody>{list.slice().sort((a: any, b: any) => a.pri - b.pri).map((t: any) => {
                const ts = S.tickets[t.id], u = hintsUsed(ts);
                return (
                  <TableRow key={t.id}>
                    <TableCell className="whitespace-normal"><a className="font-mono text-xs text-primary underline-offset-2 hover:underline" href={`#/queue/${t.id}`} onClick={viewLink(tab === "mon" ? "mon" : "cur")}>{t.id}</a><div>{t.title}</div></TableCell>
                    <TableCell className="text-muted-foreground">{skillLabel(t.id)}</TableCell>
                    <TableCell><Status st={ts.checks ? ts.status : "open"} /></TableCell>
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
          {!thu && tt.done === T.length && <Button variant="outline" onClick={startThursday}>Start the Thursday shift</Button>}
        </div>
      </div>
    </>
  );
}
