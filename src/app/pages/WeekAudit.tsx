// Audit of a Monday-to-Thursday week: the learner's own on Friday (IAM + GRC, optional), or
// Jordan Reyes' on GRC only. Seven tasks, graded like a shift.
import { Fragment, useState } from "react";
import { toast } from "sonner";
import { FileSearch } from "lucide-react";
import { IllusChart } from "@/components/brand/illustrations";
import { S } from "@/engine/store.js";
import { stage } from "@/engine/skills.js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { commit, focusSoon, go, pct, type Route } from "../sim";
import { PageHeader, Html, Checks, Tag, SectionLabel, Empty } from "../components/bits";
import { FrameworkPanel } from "../components/FrameworkPanel";
import { path } from "../paths";
import { ANALYST } from "../audit/jordan";
import {
  WEEK_CONTROLS, buildWeekAudit, retryTask, saveDraft, skipFriday, submitTask, unskipFriday, waTotals, weekAudit,
  type Answers, type Task,
} from "../audit/weekAudit";

const selectCls = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

function TaskView({ t }: { t: Task }) {
  const wa = weekAudit()!, st = wa.st[t.id] || {}, done = !!st.checks;
  const [a, setA] = useState<Answers>(() => ({ ...(st.draft || {}) }));
  const [err, setErr] = useState<string | null>(null);
  const set = (i: number, v: number | number[] | undefined) => {
    const next = { ...a }; if (v === undefined) delete next[i]; else next[i] = v;
    setA(next); saveDraft(t.id, next);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = submitTask(t.id, a);
    if (msg) { setErr(msg + "."); focusSoon("#wa-err"); return; }
    setErr(null); commit(); focusSoon("#wt-h");
    const s = weekAudit()!.st[t.id];
    toast(`Workpaper submitted: ${s.score}/${s.max}.`);
  };
  const idx = wa.tasks.indexOf(t), next = wa.tasks[idx + 1];
  return (
    <Card className="gap-5 p-5 md:p-6">
      <a href="#/audit" className="text-sm font-medium text-primary lg:hidden">← Audit tasks</a>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2"><Tag tone="primary">{idx + 1}. {t.step}</Tag><Tag className="font-mono">{t.ctrl}</Tag>{done && <Tag tone="ok">Submitted</Tag>}</div>
        <h2 id="wt-h" data-panel-focus className="text-xl font-semibold">{t.title}</h2>
      </div>
      <Html className="prose-sm max-w-[70ch] space-y-2 [&_li]:ml-5 [&_ol>li]:list-decimal [&_ul>li]:list-disc" html={t.intro} />
      {t.evidence && (
        <div className="rounded-lg border bg-muted/40 p-4">
          <SectionLabel>Evidence</SectionLabel>
          <dl className="mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[max-content_1fr]">{t.evidence.map(([k, v]) => <Fragment key={k}><dt className="text-muted-foreground">{k}</dt><dd>{v}</dd></Fragment>)}</dl>
        </div>
      )}
      {done ? (
        <>
          <section className="space-y-2"><SectionLabel>Grade</SectionLabel><div className="font-mono text-3xl">{st.score}/{st.max}</div><Checks checks={st.checks!} /></section>
          <div className="rounded-r-md border-l-2 border-primary bg-primary/8 px-4 py-2 text-sm"><b>Takeaway.</b> {t.lesson}</div>
          <div className="flex flex-wrap gap-2">
            {next && <Button asChild><a href={`#/audit/${next.id}`}>Next: {next.step}</a></Button>}
            <Button variant="outline" onClick={() => { retryTask(t.id); commit(); }}>Retry this task</Button>
          </div>
        </>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          {t.kind === "table" ? t.rows!.map((r, i) => (
            <div key={i} className="space-y-2 rounded-lg border bg-muted/30 p-4">
              <div className="font-medium">{i + 1}. {r.name} <span className="font-normal text-muted-foreground">· {r.sub}</span></div>
              <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[max-content_1fr]">{r.kv.map(([k, v]) => <Fragment key={k}><dt className="text-muted-foreground">{k}</dt><dd className={cn("min-w-0 break-words", /Groups|groups|Logged/.test(k) && "font-mono text-xs leading-5")}>{v}</dd></Fragment>)}</dl>
              <label className="block text-sm font-medium" htmlFor={`w-${t.id}-r${i}`}>Result for {r.name.split(" · ")[0]}</label>
              <select id={`w-${t.id}-r${i}`} value={(a[i] as number | undefined) ?? ""} onChange={e => set(i, e.target.value === "" ? undefined : +e.target.value)} className={selectCls}>
                <option value="">Select result</option>{r.opts.map((o, j) => <option key={j} value={j}>{o}</option>)}
              </select>
            </div>
          )) : t.qs!.map((q, i) => (
            <fieldset key={i} className="space-y-1 rounded-lg border p-4">
              <legend className="px-1 font-medium">{q.q}</legend>
              {q.num ? <><label className="sr-only" htmlFor={`w-${t.id}-q${i}`}>{q.short}</label>
                  <input type="number" min={0} id={`w-${t.id}-q${i}`} value={(a[i] as number | undefined) ?? ""} onChange={e => set(i, e.target.value === "" ? undefined : parseInt(e.target.value, 10))} className={cn(selectCls, "w-36")} /></>
                : q.opts!.map((o, j) => {
                  const sel = q.multi ? ((a[i] as number[]) || []).includes(j) : a[i] === j;
                  return (
                    <label key={j} className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-muted/50">
                      <input className="mt-1 size-4 accent-[var(--primary)]" type={q.multi ? "checkbox" : "radio"} name={`w-${t.id}-q${i}`} value={j} checked={sel}
                        onChange={() => set(i, q.multi ? (sel ? ((a[i] as number[]) || []).filter(x => x !== j) : [...((a[i] as number[]) || []), j]) : j)} />
                      <span className="text-sm">{o}</span>
                    </label>);
                })}
            </fieldset>
          ))}
          {err && <div id="wa-err" role="alert" tabIndex={-1} className="rounded-lg border border-bad/30 bg-bad/10 px-4 py-3 text-sm">{err}</div>}
          <Button type="submit">Submit workpaper</Button>
        </form>
      )}
      <FrameworkPanel topics={t.topics} graded={done} />
    </Card>
  );
}

function Controls() {
  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-lg border"><table className="w-full text-sm"><caption className="sr-only">Controls in scope</caption>
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-3">Control</th><th className="p-3">Description</th></tr></thead>
        <tbody className="divide-y">{WEEK_CONTROLS.map(c => <tr key={c[0]}><td className="p-3 align-top"><span className="font-mono">{c[0]}</span><div>{c[1]}</div></td><td className="p-3 align-top">{c[2]}</td></tr>)}</tbody></table></div>
      <Card className="gap-2 p-5"><h2 className="text-lg font-semibold">Finding format</h2><p className="text-sm"><b>Condition</b> (what you found, with numbers) · <b>Criteria</b> (the requirement) · <b>Cause</b> (why it happened) · <b>Effect</b> (the risk or impact) · <b>Recommendation</b> (a fix that addresses the cause).</p></Card>
      <Card className="gap-2 p-5"><h2 className="text-lg font-semibold">Where the evidence is</h2>
        <ul className="ml-5 list-disc space-y-1 text-sm"><li><a className="text-primary-strong underline" href="#/log">Audit log</a>: every change, with time and ticket.</li><li><a className="text-primary-strong underline" href="#/directory">Users</a>: each account as it stands now, with its own change history.</li><li><a className="text-primary-strong underline" href="#/policy">Policy &amp; matrix</a>: the runbook, the role access matrix and the SoD rules.</li></ul></Card>
    </div>
  );
}

export default function WeekAudit({ r }: { r: Route }) {
  const grc = path() === "grc", wa = weekAudit(), tt = waTotals();
  const header = (tabs?: React.ReactNode) => (
    <PageHeader icon={FileSearch} tint="bg-hue-sky/15 text-info" title={grc ? `Audit ${ANALYST.name}' week` : "Friday audit"}
      sub={grc ? `You're Pacific Crest's internal auditor. ${ANALYST.name}, IAM Analyst, worked the Monday and Thursday service-desk shifts. Test the IAM controls against the evidence, write up what you find and review management's response.`
        : "You switch sides for Friday: as internal auditor, you test your own Monday and Thursday against Pacific Crest's IAM controls. Optional."}>{tabs}</PageHeader>
  );

  if (!grc && !wa) {
    const ready = stage() === "thu-done";
    return (
      <>
        {header()}
        {S.wa?.skipped ? (
          <Empty art={IllusChart} title="You skipped the Friday audit">
            <p>Your week summary and report don't include it. You can still do it.</p>
            <Button className="mt-5 font-bold" onClick={() => { unskipFriday(); commit(); }}>Do the Friday audit after all</Button>
          </Empty>
        ) : !ready ? (
          <Empty art={IllusChart} title="Friday comes after Thursday">Finish the Monday and Thursday shifts first. This audit tests your own work from both days.</Empty>
        ) : (
          <Card className="max-w-3xl gap-4 p-6">
            <h2 className="text-xl font-semibold">Audit your own week</h2>
            <p>Seven tasks, the same ones an internal auditor would work: walkthrough, sample selection, control testing, evidence evaluation, a finding, risk ratings and the management response.</p>
            <p className="text-sm text-muted-foreground">The evidence is frozen when you start: your audit log and the directory as they are now. It's scored like a shift.</p>
            <div className="flex flex-wrap gap-2">
              <Button className="font-bold" onClick={() => { buildWeekAudit("self"); commit(); go("#/audit/W1"); }}>Start the Friday audit</Button>
              <Button variant="outline" onClick={() => { skipFriday(); commit(); go("#/week"); toast("Friday skipped. You can come back to it from the audit page."); }}>Skip Friday</Button>
            </div>
          </Card>
        )}
      </>
    );
  }

  const sel = r.id && wa!.tasks.find(t => t.id === r.id) ? r.id : null, controls = r.id === "controls";
  const tabs = (
    <nav aria-label="Audit sections" className="inline-flex rounded-lg border bg-muted/40 p-1">
      {([["#/audit", "Audit tasks", !controls], ["#/audit/controls", "Controls", controls]] as const).map(([href, label, on]) => (
        <a key={href} href={href} aria-current={on ? "page" : undefined}
          className={cn("rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground", on && "bg-background text-foreground shadow-sm")}>{label}</a>))}
    </nav>
  );
  return (
    <>
      {header(tabs)}
      {controls ? <Controls /> : (
        <>
          {tt.done === tt.n && <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
            <span><b>Audit complete: {pct(tt.pct)}.</b> {tt.pct! >= 80 ? "Workpapers are review-ready." : "Retry the tasks you missed before sign-off."}</span>
            <span className="flex gap-2">{!grc && <Button asChild variant="outline" size="sm"><a href="#/week">Week summary</a></Button>}<Button asChild size="sm"><a href="#/report">Readiness report</a></Button></span></div>}
          <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            <nav aria-label="Audit tasks" className={cn("space-y-2", sel && "hidden lg:block")}>
              {wa!.tasks.map((t, i) => { const st = wa!.st[t.id]; return (
                <a key={t.id} href={`#/audit/${t.id}`} aria-current={sel === t.id ? "page" : undefined}
                  className={cn("grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-lg border bg-card p-3 hover:border-input", sel === t.id && "border-primary ring-1 ring-primary", st?.checks && "bg-muted/40")}>
                  <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  <span><span className="block text-sm font-medium">{t.step}</span><span className="block text-xs text-muted-foreground">{t.title}</span></span>
                  <span className="col-start-2 flex gap-1">{st?.checks ? <><Tag tone="ok">Submitted</Tag><Tag className="font-mono">{st.score}/{st.max}</Tag></> : <Tag>Open</Tag>}</span>
                </a>); })}
            </nav>
            <div className={cn(!sel && "hidden lg:block")}>{sel ? <TaskView key={sel} t={wa!.tasks.find(t => t.id === sel)!} /> : <Empty art={IllusChart} title="Pick a task">Work them in order. Each one builds on the last.</Empty>}</div>
          </div>
        </>
      )}
    </>
  );
}
