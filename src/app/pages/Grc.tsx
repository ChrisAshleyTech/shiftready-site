// GRC audit desk. Answers are read from the rendered form by the engine's gCollect(), exactly as
// in v1, so inputs keep the ids and names it expects.
import { Fragment, useRef, useState } from "react";
import { toast } from "sonner";
import { ClipboardCheck } from "lucide-react";
import { IllusChart } from "@/components/brand/illustrations";
import { S } from "@/engine/store.js";
import { save } from "@/engine/state.js";
import { G, GK, gQs, gTotals, gCollect, gSubmit } from "@/engine/grc.js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { commit, focusSoon, type Route } from "../sim";
import { PageHeader, Html, Checks, Tag, SectionLabel, Empty } from "../components/bits";
import { ExportButtons } from "../components/ExportButtons";
import { AuditPopulations } from "../components/AuditPopulations";
import { sampleTable } from "../exportData";
import { downloadCsv, downloadXlsx, fileName } from "../exports";
import { company } from "../company";

const CONTROLS = [
  ["APD-01", "New user provisioning", "Access is approved by the user's manager before provisioning and limited to the role's birthright groups.", "Per event · Manual · Preventive"],
  ["APD-02", "Timely terminations", "Accounts are disabled within one business day of the HR termination date.", "Per event · Manual · Preventive"],
  ["APD-03", "Change authorization", "Every account change references an approved ticket. Caller identity is verified before any credential change.", "Per event · Manual · Preventive"],
  ["UAR-01", "Quarterly access review", "Managers certify all directory accounts, including contractors and service accounts, each quarter. Revocations are completed within 5 business days.", "Quarterly · Manual · Detective"],
  ["VEN-01", "Vendor oversight", "SOC reports for critical vendors are reviewed each year, including exceptions, gap coverage, subservice providers and user entity controls.", "Annual · Manual · Detective"],
];

const selectCls = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

function Task({ id }: { id: string }) {
  const g: any = GK[id], gs = S.grc[id] || (S.grc[id] = {}), done = !!gs.checks, lk = g.lock && g.lock();
  const form = useRef<HTMLFormElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const d = gs.draft || {};
  const draft = () => { if (form.current) { gs.draft = gCollect(g, gs, form.current as any); save(); } };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = gSubmit(id, gCollect(g, gs, form.current as any));
    if (msg) { setErr(msg + "."); return; }
    setErr(null); commit(); focusSoon("#gt-h"); toast(`Workpaper submitted: ${S.grc[id].score}/${S.grc[id].max}.`);
  };
  return (
    <Card className="gap-5 p-5 md:p-6">
      <a href="#/grc" className="text-sm font-medium text-primary lg:hidden">← Audit tasks</a>
      <div className="space-y-2">
        <div className="flex gap-2"><Tag tone="primary" className="font-mono">{g.ctrl}</Tag>{done && <Tag tone="ok">Submitted</Tag>}</div>
        <h2 id="gt-h" data-panel-focus className="text-xl font-semibold">{g.title}</h2>
      </div>
      <Html className="prose-sm max-w-[70ch] space-y-2 [&_li]:ml-5 [&_li]:list-disc" html={g.intro} />
      {g.kind === "table" && <ExportButtons label="Download the sample"
        onCsv={() => downloadCsv(sampleTable(g), fileName(company().id, g.id.toLowerCase() + "-sample", "csv"))}
        onXlsx={() => downloadXlsx([sampleTable(g)], fileName(company().id, g.id.toLowerCase() + "-sample", "xlsx"), [["Company", company().name], ["Task", `${g.ctrl}: ${g.title}`]])} />}
      {g.evidence && (
        <div className="rounded-lg border bg-muted/40 p-4">
          <SectionLabel>Evidence</SectionLabel>
          <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">{g.evidence.map(([k, v]: string[]) => <Fragment key={k}><dt className="text-muted-foreground">{k}</dt><dd>{v}</dd></Fragment>)}</dl>
        </div>
      )}
      {lk ? <div className="rounded-lg border border-warn/30 bg-warn/10 p-4 text-sm">{lk} <a className="font-semibold text-primary-strong underline" href="#/queue">Go to the queue</a></div>
        : done ? (
          <>
            <section className="space-y-2"><SectionLabel>Grade</SectionLabel><div className="font-mono text-3xl">{gs.score}/{gs.max}</div><Checks checks={gs.checks} /></section>
            <div className="rounded-r-md border-l-2 border-primary bg-primary/8 px-4 py-2 text-sm"><b>Takeaway.</b> {g.lesson}</div>
            <div><Button variant="outline" onClick={() => { S.grc[id] = {}; save(); commit(); }}>Retry this task</Button></div>
          </>
        ) : (
          <form ref={form} onSubmit={submit} onChange={draft} noValidate className="space-y-4">
            {g.kind === "table" ? g.rows.map((r: any, i: number) => (
              <div key={i} className="space-y-2 rounded-lg border bg-muted/30 p-4">
                <div className="font-medium">{i + 1}. {r.name} <span className="font-normal text-muted-foreground">· {r.sub}</span></div>
                <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">{r.kv.map(([k, v]: string[]) => <Fragment key={k}><dt className="text-muted-foreground">{k}</dt><dd className={cn(k === "Groups granted" && "font-mono text-xs")}>{v}</dd></Fragment>)}</dl>
                <label className="block text-sm font-medium" htmlFor={`g-${id}-r${i}`}>Result for {r.name}</label>
                <select id={`g-${id}-r${i}`} defaultValue={d[i] ?? ""} className={selectCls}>
                  <option value="">Select result</option>{g.opts.map((o: string, j: number) => <option key={j} value={j}>{o}</option>)}
                </select>
              </div>
            )) : (
              <>
                {g.dynamic && <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">Evidence snapshot of your log: {S.log.length} entries.
                  <Button type="button" size="sm" variant="outline" onClick={() => { delete gs.frozen; delete gs.draft; save(); commit(); toast("Snapshot refreshed from your current log."); }}>Refresh snapshot</Button></div>}
                {gQs(g, gs).map((q: any, i: number) => (
                  <fieldset key={i} className="space-y-1 rounded-lg border p-4">
                    <legend className="px-1 font-medium">{q.q}</legend>
                    {q.num ? <><label className="sr-only" htmlFor={`g-${id}-q${i}`}>{q.short}</label><input type="number" min={0} id={`g-${id}-q${i}`} defaultValue={d[i] ?? ""} className={cn(selectCls, "w-36")} /></>
                      : q.opts.map((o: string, j: number) => (
                        <label key={j} className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-muted/50">
                          <input className="mt-1 size-4 accent-[var(--primary)]" type={q.multi ? "checkbox" : "radio"} name={`g-${id}-q${i}`} value={j}
                            defaultChecked={q.multi ? (d[i] || []).includes(j) : d[i] === j} />
                          <span className="text-sm">{o}</span>
                        </label>))}
                  </fieldset>
                ))}
              </>
            )}
            {err && <div role="alert" className="rounded-lg border border-bad/30 bg-bad/10 px-4 py-3 text-sm">{err}</div>}
            <Button type="submit">Submit workpaper</Button>
          </form>
        )}
    </Card>
  );
}

export default function Grc({ r }: { r: Route }) {
  const tt = gTotals(), sel = r.id && GK[r.id] ? r.id : null, controls = r.id === "controls";
  const tabs = (
    <nav aria-label="Audit desk sections" className="inline-flex rounded-lg border bg-muted/40 p-1">
      {[["#/grc", "Audit tasks", !controls], ["#/grc/controls", "Controls & definitions", controls]].map(([href, label, on]) => (
        <a key={href as string} href={href as string} aria-current={on ? "page" : undefined}
          className={cn("rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground", on && "bg-background text-foreground shadow-sm")}>{label}</a>))}
    </nav>
  );
  return (
    <>
      <PageHeader icon={ClipboardCheck} tint="bg-hue-sky/15 text-info" title="GRC audit desk" sub="You're the IT auditor for Pacific Crest's Q3 SOX cycle. Test the access controls, judge what you find, and write it up. Task 4 audits your own IAM shift.">{tabs}</PageHeader>
      {controls ? (
        <div className="space-y-6">
          <div className="overflow-x-auto rounded-lg border"><table className="w-full text-sm"><caption className="sr-only">Controls in scope</caption>
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-3">Control</th><th className="p-3">Description</th><th className="p-3">Attributes</th></tr></thead>
            <tbody className="divide-y">{CONTROLS.map(c => <tr key={c[0]}><td className="p-3 align-top"><span className="font-mono">{c[0]}</span><div>{c[1]}</div></td><td className="p-3 align-top">{c[2]}</td><td className="p-3 align-top text-muted-foreground">{c[3]}</td></tr>)}</tbody></table></div>
          <Card className="gap-2 p-5"><h2 className="text-lg font-semibold">Deficiency levels (SOX)</h2>
            <ul className="ml-5 max-w-[80ch] list-disc space-y-1 text-sm">
              <li><b>Control deficiency:</b> a control's design or operation doesn't prevent or detect misstatements on a timely basis.</li>
              <li><b>Significant deficiency:</b> less severe than a material weakness, but important enough to merit the attention of those overseeing financial reporting.</li>
              <li><b>Material weakness:</b> a reasonable possibility that a material misstatement won't be prevented or detected on a timely basis.</li></ul>
            <p className="text-sm text-muted-foreground">Weigh the likelihood and size of a possible misstatement, the systems involved, and whether compensating controls operate.</p></Card>
          <Card className="gap-2 p-5"><h2 className="text-lg font-semibold">Finding format</h2><p className="text-sm"><b>Condition</b> (what you found, with numbers) · <b>Criteria</b> (the requirement) · <b>Cause</b> (why it happened) · <b>Effect</b> (the risk or impact) · <b>Recommendation</b> (a fix that addresses the cause).</p></Card>
        </div>
      ) : (
        <>
          {tt.done === G.length && <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm"><b>Fieldwork complete: {tt.pct}%.</b> {tt.pct! >= 90 ? "Workpapers are review-ready." : tt.pct! >= 75 ? "Solid fieldwork. Go back over the items you missed." : "Retry the tasks you missed before sign-off."}</div>}
          <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className={cn("space-y-4", sel && "hidden lg:block")}>
            <nav aria-label="Audit tasks" className="space-y-2">
              {G.map((g: any, i: number) => { const gs = S.grc[g.id] || {}; const lk = g.lock && g.lock(); return (
                <a key={g.id} href={`#/grc/${g.id}`} aria-current={sel === g.id ? "page" : undefined}
                  className={cn("grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-lg border bg-card p-3 hover:border-input", sel === g.id && "border-primary ring-1 ring-primary", gs.checks && "bg-muted/40")}>
                  <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  <span><span className="block text-sm font-medium">{g.title}</span><span className="block text-xs text-muted-foreground"><span className="font-mono">{g.ctrl}</span> · {g.kind === "table" ? g.rows.length + " items to test" : "Judgment"}</span></span>
                  <span className="col-start-2 flex gap-1">{gs.checks ? <><Tag tone="ok">Submitted</Tag><Tag className="font-mono">{gs.score}/{gs.max}</Tag></> : <Tag>{lk ? "Locked" : "Open"}</Tag>}</span>
                </a>); })}
            </nav>
            <AuditPopulations className="rounded-lg border bg-card p-4" />
            </div>
            <div className={cn(!sel && "hidden lg:block")}>{sel ? <Task key={sel} id={sel} /> : <Empty art={IllusChart} title="Pick a task">Work them in order. Later tasks build on earlier findings.</Empty>}</div>
          </div>
        </>
      )}
    </>
  );
}
