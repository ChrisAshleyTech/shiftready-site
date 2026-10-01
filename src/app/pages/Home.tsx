// Learner home: the chosen path, company and next step, then where you are in the week.
// On the first visit it shows the path picker instead.
import type { ReactNode } from "react";
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
import { PathPicker } from "../components/PathPicker";
import { IllusWeek } from "@/components/brand/illustrations";
import { company } from "../company";
import { brandFor, deskShort } from "@/packs/brands";
import { path, pathChosen, pathInfo } from "../paths";
import { weekAudit, waTotals } from "../audit/weekAudit";
import { ANALYST } from "../audit/jordan";
import { nextStep } from "../nextStep";

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

type Hero = { k: string; t: string; p: string; a: ReactNode; prog?: { done: number; n: number } };
type Day = { name: string; date: string; state: "done" | "current" | "open" | "locked" | "skipped"; body: ReactNode };

// Path, company and the next step, above everything else.
function WhereYouAre() {
  const n = nextStep(), c = company();
  return (
    <section aria-label="Where you are" className="grid gap-3 rounded-2xl border bg-card p-4 text-sm sm:grid-cols-[auto_auto_1fr] sm:items-center sm:gap-6">
      <div><span className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Path</span>
        <span className="font-semibold">{pathInfo().name}</span> <a href="#/settings" className="text-primary-strong underline-offset-2 hover:underline">Change</a></div>
      <div><span className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Company</span>
        <span className="inline-flex items-center gap-1.5 font-semibold"><c.Mark className="size-5 shrink-0" />{c.name}</span></div>
      <div className="min-w-0"><span className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Next step</span>
        <a href={n.href} className="font-semibold text-primary-strong underline-offset-2 hover:underline">{n.label}</a></div>
    </section>
  );
}

function iamHero(): Hero {
  const st = stage(), s = summary(), p = path();
  const next = nextTicket(S.shift === "thu" ? THU_T : T);
  const t = S.shift === "thu" ? s.thu : s.mon;
  const cont = next && (
    <Button asChild size="lg" className={ON_BLUE}><a href={`#/queue/${next.id}`}>{S.active === next.id ? "Continue" : "Next"}: <span className="max-w-[28ch] truncate">{next.title}</span> <ArrowRight /></a></Button>
  );
  const wa = weekAudit(), wt = waTotals(), fridayOpen = p === "iam-grc" && !S.wa?.skipped && !(wa && wt.done === wt.n);
  if (st === "new") return {
    k: "Monday, " + fmtDay(0) + " · 8:00 AM", t: "Monday morning. Twenty tickets are waiting.",
    p: `You're the IAM analyst on the ${company().name} service desk. Open a ticket, start work, make the changes in the Directory, then resolve or reject it. Each ticket is graded on the outcome and the process, and what you do today decides Thursday's queue.`,
    a: <><Button asChild size="lg" className={ON_BLUE}><a href={`#/queue/${next.id}`}>Start with {next.id} <ArrowRight /></a></Button><Button asChild size="lg" variant="outline" className={ON_BLUE_OUTLINE}><a href="#/policy">Read the runbook first</a></Button></> };
  if (st === "mon") return { k: "Monday shift in progress", t: `${t.done} of ${T.length} tickets closed`,
    p: `Score so far ${pct(t.pct)}. ${t.n - t.done ? plural(t.n - t.done, "ticket is", "tickets are") + " still open." : ""}`,
    a: <>{cont}<Button asChild size="lg" variant="outline" className={ON_BLUE_OUTLINE}><a href="#/queue">Open the queue</a></Button></>, prog: t };
  if (st === "mon-done") return { k: "Monday complete", t: `You scored ${pct(s.mon.pct)} on Monday.`,
    p: "Your decisions carry forward. Thursday's queue is built from what you did on Monday: anything you missed comes back as an incident.",
    a: <><Button size="lg" className={ON_BLUE} onClick={startThursday}>Start the Thursday shift <ArrowRight /></Button><Button asChild size="lg" variant="outline" className={ON_BLUE_OUTLINE}><a href="#/results">Review Monday first</a></Button></> };
  if (st === "thu") return { k: "Thursday shift in progress", t: `${t.done} of ${THU_T.length} Thursday tickets closed`,
    p: s.caused ? `${plural(s.caused, "Monday decision", "Monday decisions")} came back as tickets today.` : "Nothing you did on Monday came back to bite you.",
    a: <>{cont}<Button asChild size="lg" variant="outline" className={ON_BLUE_OUTLINE}><a href="#/results">See what Monday caused</a></Button></>, prog: t };
  if (fridayOpen) return wa
    ? { k: "Friday, " + fmtDay(4) + " · audit in progress", t: `${wt.done} of ${wt.n} audit tasks submitted`,
        p: "You're the internal auditor now, testing your own Monday and Thursday. Report what the evidence shows, including your own mistakes.",
        a: <><Button asChild size="lg" className={ON_BLUE}><a href="#/audit">Continue the Friday audit <ArrowRight /></a></Button><Button asChild size="lg" variant="outline" className={ON_BLUE_OUTLINE}><a href="#/week">Week summary</a></Button></>, prog: wt }
    : { k: "Thursday complete · Friday is next", t: `Week score: ${pct(s.weekPct)}. Now audit it.`,
        p: `On Friday you switch sides. As the internal auditor, you test your own week against ${company().name}'s IAM controls. It's optional: you can skip straight to the week summary.`,
        a: <><Button asChild size="lg" className={ON_BLUE}><a href="#/audit">Start the Friday audit <ArrowRight /></a></Button><Button asChild size="lg" variant="outline" className={ON_BLUE_OUTLINE}><a href="#/week">Skip to the week summary</a></Button></> };
  return { k: "Week complete", t: `Week score: ${pct(s.weekPct)}`,
    p: p === "iam-grc" && wa ? `Friday audit: ${pct(wt.pct)}. Your week summary and readiness report are ready.` : "Your week summary and readiness report are ready to share.",
    a: <><Button asChild size="lg" className={ON_BLUE}><a href="#/week">View your week summary <ArrowRight /></a></Button><Button asChild size="lg" variant="outline" className={ON_BLUE_OUTLINE}><a href="#/report">Readiness report</a></Button></> };
}

function grcHero(): Hero {
  const wa = weekAudit()!, wt = waTotals();
  const next = wa.tasks.find(t => !wa.st[t.id]?.checks);
  if (!wt.done) return { k: "Internal audit · " + fmtDay(4), t: `Audit ${ANALYST.name}' week`,
    p: `${ANALYST.name}, IAM Analyst, worked Monday and Thursday on the ${company().name} service desk. You're the internal auditor. The audit log, directory and tickets hold the evidence. Work the seven tasks in order.`,
    a: <><Button asChild size="lg" className={ON_BLUE}><a href={`#/audit/${wa.tasks[0].id}`}>Start with the walkthrough <ArrowRight /></a></Button><Button asChild size="lg" variant="outline" className={ON_BLUE_OUTLINE}><a href="#/log">Look at the audit log</a></Button></> };
  if (next) return { k: "Audit in progress", t: `${wt.done} of ${wt.n} tasks submitted`, p: `Score so far ${pct(wt.pct)}.`,
    a: <><Button asChild size="lg" className={ON_BLUE}><a href={`#/audit/${next.id}`}>Next: {next.step} <ArrowRight /></a></Button><Button asChild size="lg" variant="outline" className={ON_BLUE_OUTLINE}><a href="#/log">Audit log</a></Button></>, prog: wt };
  return { k: "Audit complete", t: `Audit score: ${pct(wt.pct)}`, p: `Your readiness report is ready to share. The ${brandFor(company().id).desk} has ${G.length} more audit tasks if you want more practice.`,
    a: <><Button asChild size="lg" className={ON_BLUE}><a href="#/report">View your readiness report <ArrowRight /></a></Button><Button asChild size="lg" variant="outline" className={ON_BLUE_OUTLINE}><a href="#/grc">Open the {deskShort(company().id)}</a></Button></> };
}

function days(): Day[] {
  const s = summary(), p = path(), wa = weekAudit(), wt = waTotals();
  const shiftBody = (x: any, n: number) => x.done ? <><span className="text-3xl font-extrabold tabular-nums">{pct(x.pct)}</span><span className="text-xs text-muted-foreground">{x.done}/{n} closed · {x.solo} solo · {x.assisted} assisted</span></> : <span className="text-sm text-muted-foreground">{n} tickets</span>;
  const auditBody = wa ? (wt.done ? <><span className="text-3xl font-extrabold tabular-nums">{pct(wt.pct)}</span><span className="text-xs text-muted-foreground">{wt.done}/{wt.n} tasks submitted</span></> : <span className="text-sm text-muted-foreground">{wt.n} audit tasks. <a className="text-primary underline-offset-2 hover:underline" href="#/audit">Open the audit</a></span>) : null;
  if (p === "grc") return [
    { name: `${ANALYST.first}'s Monday`, date: fmtDay(0), state: "done", body: <span className="text-sm text-muted-foreground">{T.length} tickets worked. Evidence in the <a className="text-primary underline-offset-2 hover:underline" href="#/log">audit log</a>.</span> },
    { name: `${ANALYST.first}'s Thursday`, date: fmtDay(3), state: "done", body: <span className="text-sm text-muted-foreground">{THU_T.length} tickets worked, including what Monday caused.</span> },
    { name: "Your audit", date: fmtDay(4), state: wt.done === wt.n ? "done" : "current", body: auditBody },
  ];
  const thuDone = S.shift === "thu" && s.thu.done === THU_T.length;
  const out: Day[] = [
    { name: "Monday", date: fmtDay(0), state: S.shift === "thu" ? "done" : "current", body: shiftBody(s.mon, T.length) },
    { name: "Thursday", date: fmtDay(3), state: S.shift === "thu" ? (thuDone ? "done" : "current") : "locked", body: S.shift === "thu" ? shiftBody(s.thu, THU_T.length) : <span className="text-sm text-muted-foreground">Unlocks when every Monday ticket is closed.</span> },
  ];
  if (p === "iam-grc") out.push({ name: "Friday audit", date: fmtDay(4),
    state: S.wa?.skipped ? "skipped" : wa && wt.done === wt.n ? "done" : wa ? "current" : thuDone ? "open" : "locked",
    body: S.wa?.skipped ? <span className="text-sm text-muted-foreground">Skipped. <a className="text-primary underline-offset-2 hover:underline" href="#/audit">Do it after all</a></span>
      : auditBody ?? <span className="text-sm text-muted-foreground">{thuDone ? <>Audit your own week. <a className="text-primary underline-offset-2 hover:underline" href="#/audit">Start</a></> : "Unlocks when Thursday is done. Optional."}</span> });
  out.push({ name: "Week summary", date: "Your week", state: thuDone && (p === "iam" || S.wa?.skipped || (wa && wt.done === wt.n)) ? "done" : thuDone ? "open" : "locked",
    body: thuDone ? <span className="text-sm text-muted-foreground"><a className="text-primary underline-offset-2 hover:underline" href="#/week">See your week</a></span> : <span className="text-sm text-muted-foreground">Ready after Thursday.</span> });
  return out;
}

export default function Home() {
  if (!pathChosen()) return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground"><CalendarDays className="size-4" aria-hidden />{company().name} · week of {fmtDay(0)}</p>
        <h1 tabIndex={-1} data-page-title className="text-3xl font-extrabold md:text-4xl">Choose your path</h1>
        <p className="max-w-[70ch] text-lg text-muted-foreground">Pick the job you want to practise. You can switch any time in Settings, and each path keeps its own progress. All three are free.</p>
      </section>
      <PathPicker />
    </div>
  );

  const p = path(), grc = p === "grc", s = summary(), sk = skillScores(), wa = weekAudit(), wt = waTotals();
  const hero = grc && wa ? grcHero() : iamHero();
  const ds = days();
  const tried = sk.filter((x: any) => x.n);
  const weak = tried.slice().sort((a: any, b: any) => a.pct - b.pct).filter((x: any) => x.pct < 85).slice(0, 2);

  return (
    <div className="space-y-8">
      <WhereYouAre />
      {/* Fixed deep blue-to-violet so white text stays >= 6:1 in both themes. */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1d4ed8] via-[#2563eb] to-[#6d28d9] p-6 text-white shadow-xl shadow-primary/20 md:p-9">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full bg-white/10 blur-2xl" />
        <div className="relative grid items-center gap-6 lg:grid-cols-[1fr_auto]">
          <div className="max-w-3xl space-y-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white/85"><CalendarDays className="size-4" aria-hidden />{hero.k}</p>
            <h1 tabIndex={-1} data-page-title className="text-3xl font-extrabold md:text-5xl">{hero.t}</h1>
            <p className="max-w-[62ch] text-lg text-white/90">{hero.p}</p>
            {hero.prog && <div className="max-w-md pt-1"><div role="img" aria-label={`Progress: ${Math.round(hero.prog.done / hero.prog.n * 100)}%`} className="h-2 overflow-hidden rounded-full bg-white/25"><div className="h-full rounded-full bg-white" style={{ width: `${Math.round(hero.prog.done / hero.prog.n * 100)}%` }} /></div></div>}
            <div className="flex flex-wrap gap-3 pt-2 [&_a]:shadow-none [&_button]:shadow-none">{hero.a}</div>
          </div>
          <div className="hidden rounded-3xl bg-white/95 p-4 lg:block"><IllusWeek className="h-40 w-auto" /></div>
        </div>
      </section>

      <section aria-label="Headline numbers" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {grc ? <>
          <Stat k="Audit score" v={pct(wt.pct)} d={`${wt.done}/${wt.n} tasks submitted`} />
          <Stat k="Tickets in scope" v={String(T.length + THU_T.length)} d={`${ANALYST.first}'s Monday and Thursday`} />
          <Stat k="Audit log" v={String(S.log.length)} d="Entries to test against" />
          <Stat k={deskShort(company().id).replace(/^./, c => c.toUpperCase())} v={pct(summary().grc.pct)} d={`${summary().grc.done}/${G.length} extra tasks`} />
        </> : <>
          <Stat k="Monday" v={pct(s.mon.pct)} d={`${s.mon.done}/${T.length} closed`} />
          <Stat k="Thursday" v={S.shift === "thu" ? pct(s.thu.pct) : "–"} d={S.shift === "thu" ? `${s.thu.done}/${THU_T.length} closed` : "Unlocks after Monday"} />
          {p === "iam-grc" && wa ? <Stat k="Friday audit" v={pct(wt.pct)} d={`${wt.done}/${wt.n} tasks submitted`} />
            : <Stat k="Solo · Assisted" v={`${s.solo} · ${s.assisted}`} d={`${plural(s.hints, "hint", "hints")} used`} />}
          <Stat k="Caused by Monday" v={s.caused == null ? "–" : String(s.caused)} d={s.caused == null ? "Revealed on Thursday" : `${s.prevented} prevented`} />
        </>}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section aria-labelledby="wk" className="space-y-3">
          <h2 id="wk" className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{grc ? "The week you're auditing" : "Your week"}</h2>
          <ol className={cn("grid gap-3 md:grid-cols-3", ds.length === 4 && "md:grid-cols-2 2xl:grid-cols-4")}>
            {ds.map(d => (
              <li key={d.name} className={cn("lift flex flex-col gap-2 rounded-2xl border bg-card p-5", d.state === "current" && "border-primary/60 ring-1 ring-primary/40", (d.state === "locked" || d.state === "skipped") && "bg-muted/30")}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-lg font-semibold">{d.name}</span>
                  {d.state === "done" ? <CheckCircle2 className="size-4 shrink-0 text-ok" aria-label="Complete" /> : d.state === "locked" ? <Lock className="size-4 shrink-0 text-muted-foreground" aria-label="Locked" /> : d.state === "skipped" ? <Tag>Skipped</Tag> : <Circle className="size-4 shrink-0 text-primary" aria-label={d.state === "current" ? "In progress" : "Ready"} />}
                </div>
                <span className="text-xs text-muted-foreground">{d.date}</span>
                {d.body}
              </li>
            ))}
          </ol>
          {p === "iam-grc" && <p className="text-sm text-muted-foreground">More audit practice: the <a className="text-primary underline-offset-2 hover:underline" href="#/grc">{brandFor(company().id).desk}</a> has {G.length} tasks on {company().name}'s access controls.</p>}
        </section>

        {grc && wa ? (
          <Card className="gap-4 p-5">
            <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Audit tasks</h2><a href="#/report" className="text-sm text-primary underline-offset-2 hover:underline">Readiness report</a></div>
            <ol className="space-y-2">
              {wa.tasks.map((t, i) => { const st = wa.st[t.id]; return (
                <li key={t.id}><a href={`#/audit/${t.id}`} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm hover:border-input">
                  <span><span className="mr-2 font-mono text-xs text-muted-foreground">{i + 1}</span>{t.step}</span>
                  {st?.checks ? <Tag tone="ok" className="font-mono">{st.score}/{st.max}</Tag> : <Tag>Open</Tag>}
                </a></li>); })}
            </ol>
          </Card>
        ) : (
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
        )}
      </div>

      <section aria-labelledby="rs" className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-dashed p-4">
        <div><h2 id="rs" className="text-base font-semibold">Start over</h2><p className="text-sm text-muted-foreground">{grc ? `Resets your audit of ${ANALYST.first}'s week` : "Resets your week"} on the {pathInfo().name} path at {company().name}{grc ? "" : ", including the audit desk"}. Other paths keep their progress. Saved in this browser only.</p></div>
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
