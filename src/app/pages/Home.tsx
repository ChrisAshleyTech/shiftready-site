// Learner home: where you are in the week, the one next action, and skill trends.
import { ArrowRight, CalendarDays, CheckCircle2, Circle, Lock, RotateCcw } from "lucide-react";
import { S } from "@/engine/store.js";
import { T } from "@/engine/tickets.js";
import { THU_T } from "@/engine/thursday.js";
import { fmtDay } from "@/engine/company.js";
import { G } from "@/engine/grc.js";
import { skillScores, stage, summary, nextTicket } from "@/engine/skills.js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ui, commit, pct, plural, focusSoon } from "../sim";
import { startThursday, resetProgress } from "../actions";
import { Meter, Tag } from "../components/bits";
import { IllusWeek } from "@/components/brand/illustrations";

// Buttons on the blue banner.
const ON_BLUE = "h-12 rounded-xl bg-white px-6 text-base font-bold text-[#1d4ed8] hover:bg-white/90";
const ON_BLUE_OUTLINE = "h-12 rounded-xl border-2 border-white/70 bg-transparent px-6 text-base font-bold text-white hover:bg-white/10 hover:text-white dark:border-white/70 dark:bg-transparent dark:hover:bg-white/10";

function Stat({ k, v, d }: { k: string; v: string; d: string }) {
  return (
    <Card className="lift gap-1 rounded-2xl p-5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{k}</span>
      <span className="text-3xl font-extrabold tabular-nums text-primary-strong">{v}</span>
      <span className="text-xs text-muted-foreground">{d}</span>
    </Card>
  );
}

export default function Home() {
  const st = stage(), s = summary(), sk = skillScores();
  const next = nextTicket(S.shift === "thu" ? THU_T : T);
  const t = S.shift === "thu" ? s.thu : s.mon;
  const cont = next && (
    <Button asChild size="lg" className={ON_BLUE}><a href={`#/queue/${next.id}`}>{S.active === next.id ? "Continue" : "Next"}: <span className="max-w-[28ch] truncate">{next.title}</span> <ArrowRight /></a></Button>
  );
  const hero = st === "new" ? {
    k: "Monday, " + fmtDay(0) + " · 8:00 AM", t: "Monday morning. Twenty tickets are waiting.",
    p: "You're the IAM analyst on the Pacific Crest service desk. Open a ticket, start work, make the changes in the Directory, then resolve or reject it. Each ticket is graded on the outcome and the process, and what you do today decides Thursday's queue.",
    a: <><Button asChild size="lg" className={ON_BLUE}><a href={`#/queue/${next.id}`}>Start with {next.id} <ArrowRight /></a></Button><Button asChild size="lg" variant="outline" className={ON_BLUE_OUTLINE}><a href="#/policy">Read the runbook first</a></Button></> }
    : st === "mon" ? { k: "Monday shift in progress", t: `${t.done} of ${T.length} tickets closed`,
      p: `Score so far ${pct(t.pct)}. ${t.n - t.done ? plural(t.n - t.done, "ticket is", "tickets are") + " still open." : ""}`,
      a: <>{cont}<Button asChild size="lg" variant="outline" className={ON_BLUE_OUTLINE}><a href="#/queue">Open the queue</a></Button></>, prog: t }
    : st === "mon-done" ? { k: "Monday complete", t: `You scored ${pct(s.mon.pct)} on Monday.`,
      p: "Your decisions carry forward. Thursday's queue is built from what you did on Monday: anything you missed comes back as an incident.",
      a: <><Button size="lg" className={ON_BLUE} onClick={startThursday}>Start the Thursday shift <ArrowRight /></Button><Button asChild size="lg" variant="outline" className={ON_BLUE_OUTLINE}><a href="#/results">Review Monday first</a></Button></> }
    : st === "thu" ? { k: "Thursday shift in progress", t: `${t.done} of ${THU_T.length} Thursday tickets closed`,
      p: s.caused ? `${plural(s.caused, "Monday decision", "Monday decisions")} came back as tickets today.` : "Nothing you did on Monday came back to bite you.",
      a: <>{cont}<Button asChild size="lg" variant="outline" className={ON_BLUE_OUTLINE}><a href="#/results">See what Monday caused</a></Button></>, prog: t }
    : { k: "Week complete", t: `Week score: ${pct(s.weekPct)}`,
      p: "Your readiness report is ready to share. Then try the other side of the desk: audit your own week as the GRC tester.",
      a: <><Button asChild size="lg" className={ON_BLUE}><a href="#/report">View your readiness report <ArrowRight /></a></Button><Button asChild size="lg" variant="outline" className={ON_BLUE_OUTLINE}><a href="#/grc">Open the audit desk</a></Button></> };

  const days = [
    { name: "Monday", date: fmtDay(0), state: S.shift === "thu" ? "done" : "current", x: s.mon, n: T.length },
    { name: "Thursday", date: fmtDay(3), state: S.shift === "thu" ? (s.thu.done === THU_T.length ? "done" : "current") : "locked", x: s.thu, n: THU_T.length || null },
    { name: "GRC audit", date: "Q3 fieldwork", state: s.grc.done === G.length ? "done" : s.grc.done ? "current" : "open", x: s.grc, n: G.length },
  ];
  const tried = sk.filter((x: any) => x.n);
  const weak = tried.slice().sort((a: any, b: any) => a.pct - b.pct).filter((x: any) => x.pct < 85).slice(0, 2);

  return (
    <div className="space-y-8">
      {/* Fixed deep blue-to-violet so white text stays >= 6:1 in both themes. */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1d4ed8] via-[#2563eb] to-[#6d28d9] p-6 text-white shadow-xl shadow-primary/20 md:p-9">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full bg-white/10 blur-2xl" />
        <div className="relative grid items-center gap-6 lg:grid-cols-[1fr_auto]">
          <div className="max-w-3xl space-y-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white/85"><CalendarDays className="size-4" aria-hidden />{hero.k}</p>
            <h1 tabIndex={-1} data-page-title className="text-3xl font-extrabold md:text-5xl">{hero.t}</h1>
            <p className="max-w-[62ch] text-lg text-white/90">{hero.p}</p>
            {"prog" in hero && hero.prog && <div className="max-w-md pt-1"><div role="img" aria-label={`Tickets closed: ${Math.round(hero.prog.done / hero.prog.n * 100)}%`} className="h-2 overflow-hidden rounded-full bg-white/25"><div className="h-full rounded-full bg-white" style={{ width: `${Math.round(hero.prog.done / hero.prog.n * 100)}%` }} /></div></div>}
            <div className="flex flex-wrap gap-3 pt-2 [&_a]:shadow-none [&_button]:shadow-none">{hero.a}</div>
          </div>
          <div className="hidden rounded-3xl bg-white/95 p-4 lg:block"><IllusWeek className="h-40 w-auto" /></div>
        </div>
      </section>

      <section aria-label="Headline numbers" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat k="Monday" v={pct(s.mon.pct)} d={`${s.mon.done}/${T.length} closed`} />
        <Stat k="Thursday" v={S.shift === "thu" ? pct(s.thu.pct) : "–"} d={S.shift === "thu" ? `${s.thu.done}/${THU_T.length} closed` : "Unlocks after Monday"} />
        <Stat k="Solo · Assisted" v={`${s.solo} · ${s.assisted}`} d={`${plural(s.hints, "hint", "hints")} used`} />
        <Stat k="Caused by Monday" v={s.caused == null ? "–" : String(s.caused)} d={s.caused == null ? "Revealed on Thursday" : `${s.prevented} prevented`} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section aria-labelledby="wk" className="space-y-3">
          <h2 id="wk" className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Your week</h2>
          <ol className="grid gap-3 md:grid-cols-3">
            {days.map(d => (
              <li key={d.name} className={cn("lift flex flex-col gap-2 rounded-2xl border bg-card p-5", d.state === "current" && "border-primary/60 ring-1 ring-primary/40", d.state === "locked" && "bg-muted/30")}>
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg font-semibold">{d.name}</span>
                  {d.state === "done" ? <CheckCircle2 className="size-4 text-ok" aria-label="Complete" /> : d.state === "locked" ? <Lock className="size-4 text-muted-foreground" aria-label="Locked" /> : <Circle className="size-4 text-primary" aria-label="In progress" />}
                </div>
                <span className="text-xs text-muted-foreground">{d.date}</span>
                {d.state === "locked" ? <span className="text-sm text-muted-foreground">Unlocks when every Monday ticket is closed.</span>
                  : d.x.done ? <><span className="text-3xl font-extrabold tabular-nums">{pct(d.x.pct)}</span>
                      <span className="text-xs text-muted-foreground">{d.x.done}/{d.n} {d.name === "GRC audit" ? "submitted" : `closed · ${d.x.solo} solo · ${d.x.assisted} assisted`}</span></>
                  : <span className="text-sm text-muted-foreground">{d.name === "GRC audit" ? <>{G.length} audit tasks. <a className="text-primary underline-offset-2 hover:underline" href="#/grc">Open the audit desk</a></> : `${d.n} tickets`}</span>}
              </li>
            ))}
          </ol>
        </section>

        <Card className="gap-4 p-5">
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Skills</h2><a href="#/report" className="text-sm text-primary underline-offset-2 hover:underline">Readiness report</a></div>
          {!tried.length && <p className="text-sm text-muted-foreground">Close a ticket to start building your profile.</p>}
          <ul className="space-y-3">
            {sk.map((x: any) => (
              <li key={x.key} className="space-y-1.5">
                <div className="flex justify-between text-sm"><span className="font-medium">{x.label}</span><span className="font-mono tabular-nums text-muted-foreground">{x.n ? pct(x.pct) : "–"}</span></div>
                <Meter value={x.pct} label={x.label} />
              </li>
            ))}
          </ul>
          {weak.length > 0 && (
            <div className="rounded-lg border border-warn/30 bg-warn/10 p-3 text-sm">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-warn">Work on next</p>
              {weak.map((x: any) => <p key={x.key}><b>{x.label}</b>: {x.blurb}</p>)}
            </div>
          )}
        </Card>
      </div>

      <section aria-labelledby="rs" className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-dashed p-4">
        <div><h2 id="rs" className="text-base font-semibold">Start over</h2><p className="text-sm text-muted-foreground">Resets the IAM week and the GRC desk. Progress is saved in this browser only.</p></div>
        {ui.confirmReset ? (
          <div role="group" aria-label="Confirm reset" className="flex flex-wrap items-center gap-2">
            <Tag tone="bad">Can't be undone</Tag>
            <Button id="reset-yes" variant="destructive" onClick={resetProgress}>Erase and start over</Button>
            <Button id="reset-no" variant="outline" onClick={() => { ui.confirmReset = false; commit(); focusSoon("#reset-ask"); }}>Keep my progress</Button>
          </div>
        ) : <Button id="reset-ask" variant="outline" onClick={() => { ui.confirmReset = true; commit(); focusSoon("#reset-no"); }}><RotateCcw /> Reset progress…</Button>}
      </section>
    </div>
  );
}
