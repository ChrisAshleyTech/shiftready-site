// Ticket queue: list, ticket detail with tiered hints, and the guided tutor.
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Inbox, ArrowRight, Bot, ChevronLeft, Lightbulb, MessageCircleQuestion, Phone, Send, UserRound } from "lucide-react";
import { S, U } from "@/engine/store.js";
import { TK } from "@/engine/tickets.js";
import { CONSEQ, queueTickets, queueDone } from "@/engine/followups.js";
import { HINT_TIERS, hintsUsed, hintCost, finalScore, isAssisted } from "@/engine/state.js";
import { HINTS, hintSteps } from "@/engine/hints.js";
import { POLICY } from "@/engine/policy.js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { commit, ui, num, plural, type Route } from "../sim";
import * as A from "../actions";
import { ask, KIND_TERMS, kindOf, termLabel } from "../tutor";
import { PageHeader, Pri, Status, Mode, Score, Tag, UserTags, Checks, Html, SectionLabel, Empty } from "../components/bits";
import { MatrixTable, SodTable } from "./Reference";
import { IllusQueue } from "@/components/brand/illustrations";
import { FrameworkPanel } from "../components/FrameworkPanel";
import { ticketTopics } from "../frameworks";
import { path, showFrameworks } from "../paths";
import { ticketNo, ticketName, statusOf, supersededIds } from "../ticketLabel";

const useWide = () => {
  const q = "(min-width: 1536px)"; // Tailwind 2xl: wide enough for list + ticket + docked tutor
  const [wide, set] = useState(() => matchMedia(q).matches);
  useEffect(() => { const m = matchMedia(q); const on = () => set(m.matches); m.addEventListener("change", on); return () => m.removeEventListener("change", on); }, []);
  return wide;
};
const tutorOpen = (wide: boolean) => ui.tutorOpen ?? wide;
const toggleTutor = (wide: boolean) => { ui.tutorOpen = !tutorOpen(wide); commit(); };

// ---------- Tutor ----------
function Tutor({ tid, onClose }: { tid: string; onClose?: () => void }) {
  const ts = S.tickets[tid], log = ui.tutor[tid] || [];
  const [terms, setTerms] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [log.length]);
  const chips: [string, string][] = [["@start", "Where do I start?"], ["@recap", "What have I done so far?"], ["@who", "Who's involved?"], ["@terms", "Explain a term"], ts.checks ? ["@why", "Why did I lose points?"] : ["@risk", "What's the risk?"]];
  const send = (q: string, label?: string) => { ask(tid, q, label); setTerms(q === "@terms"); commit(); };
  const submit = (e: FormEvent) => { e.preventDefault(); const q = input.current!.value.trim(); if (!q) return; send(q); input.current!.value = ""; input.current!.focus(); };
  return (
    <section aria-labelledby="tutor-h" className="flex h-full min-h-0 flex-col">
      <header className="flex items-start justify-between gap-2 border-b p-4">
        <div>
          <h2 id="tutor-h" className="flex items-center gap-2 font-sans text-base font-semibold"><Bot className="size-4 text-primary" aria-hidden />Tutor</h2>
          <p className="mt-1 text-xs text-muted-foreground">Guided and rule-based, not generative AI. It asks questions and looks things up. It won't give you the answer.</p>
        </div>
        {onClose && <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>}
      </header>
      <div role="log" aria-live="polite" aria-label="Tutor conversation" id="tutor-log" className="min-h-40 flex-1 space-y-3 overflow-y-auto p-4 text-sm [&_a]:text-primary [&_a]:underline [&_ul]:ml-4 [&_ul]:list-disc [&_ul]:space-y-0.5">
        {!log.length && <div><p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Tutor</p><p>Stuck on <span className="font-mono">{ticketNo(TK[tid])}</span>? I can help you think it through. Pick a question below or type your own.</p></div>}
        {log.map((m, i) => m.who === "me"
          ? <div key={i} className="ml-auto w-fit max-w-[85%] rounded-xl rounded-br-sm bg-primary/15 px-3 py-2" dangerouslySetInnerHTML={{ __html: m.html }} />
          : <div key={i} className="space-y-1.5"><p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Tutor</p><Html className="space-y-1.5" html={m.html} /></div>)}
        <div ref={end} />
      </div>
      {terms && (
        <div role="group" aria-label="Terms" className="flex flex-wrap gap-1.5 border-t px-4 pt-3">
          {KIND_TERMS[kindOf(tid)].map(k => <Button key={k} size="sm" variant="secondary" className="h-8 rounded-full text-xs" onClick={() => send("@term:" + k, termLabel(k))}>{termLabel(k)}</Button>)}
        </div>
      )}
      <div role="group" aria-label="Suggested questions" className="flex flex-wrap gap-1.5 px-4 pt-3">
        {chips.map(([q, l]) => <Button key={q} size="sm" variant="outline" className="h-8 rounded-full text-xs" onClick={() => send(q, l)}>{l}</Button>)}
      </div>
      <form onSubmit={submit} className="flex gap-2 p-4">
        <label className="sr-only" htmlFor="tutor-in">Ask the tutor</label>
        <Input ref={input} id="tutor-in" autoComplete="off" placeholder="Ask about a term, person or role" />
        <Button type="submit" size="icon" aria-label="Ask"><Send /></Button>
      </form>
    </section>
  );
}

// ---------- Hints ----------
function clauseHtml(c: any) {
  let out = (c.keys || []).map((k: string) => `<blockquote class="border-l-2 border-border pl-3"><b>${POLICY[k].title}.</b> ${POLICY[k].html} <a class="text-primary underline" href="#/policy?c=${k}">In the runbook</a></blockquote>`).join("");
  if (c.note) out += `<p>${c.note}</p>`;
  return out;
}
function Tier({ id, i }: { id: string; i: number }) {
  const H = HINTS[id];
  if (i === 0) return <Html html={`<p>${H.nudge}</p>`} />;
  if (i === 1) return (
    <div className="space-y-3">
      <Html className="space-y-2" html={clauseHtml(H.clause)} />
      {H.clause.matrix && <MatrixTable keys={H.clause.matrix} />}
      {H.clause.sod && <SodTable />}
    </div>
  );
  return <ol className="ml-5 list-decimal space-y-1">{hintSteps(id).map((x: string, j: number) => <li key={j} dangerouslySetInnerHTML={{ __html: x }} />)}</ol>;
}

function Hints({ id }: { id: string }) {
  const H = HINTS[id], ts = S.tickets[id];
  if (!H) return null;
  const used = hintsUsed(ts), closed = !!ts.checks;
  const shownN = closed ? Math.max(used, ui.freeHints[id] || 0) : used;
  const next = HINT_TIERS[shownN];
  const pc = (x: number) => Math.round(x * 100) + "%";
  return (
    <section aria-labelledby={`hints-h-${id}`} className="space-y-3 rounded-xl border border-dashed bg-muted/20 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id={`hints-h-${id}`} className="flex items-center gap-2 font-sans text-sm font-semibold"><Lightbulb className="size-4 text-warn" aria-hidden />Hints</h3>
        <span className="text-xs text-muted-foreground">{closed ? (used ? `${plural(used, "tier", "tiers")} used before closing` : "Solved without hints") : "You lose the % of the highest tier you open. Exact steps marks the ticket Assisted."}</span>
      </div>
      {HINT_TIERS.slice(0, shownN).map((tier: any, i: number) => (
        <div key={i} id={`hint-${id}-${i}`} tabIndex={-1} className="space-y-2 rounded-lg border bg-card p-4 text-sm [&_.mono]:font-mono [&_.mono]:text-xs">
          <div className="flex items-center gap-2 font-medium">{tier.label}
            {i < used ? <Tag tone={i === 2 ? "warn" : "neutral"}>{closed ? "Used" : "−" + pc(tier.cost)}</Tag> : <Tag tone="ok">Free review</Tag>}</div>
          <Tier id={id} i={i} />
        </div>
      ))}
      {next && closed && <Button size="sm" variant="outline" onClick={() => A.hintFree(id)}>Show {next.label.toLowerCase()} (free now)</Button>}
      {next && !closed && ui.hintConfirm === id && (
        <div role="group" aria-labelledby={`hc-${id}`} className="space-y-3 rounded-lg border border-input bg-card p-4 text-sm">
          <p id={`hc-${id}`}>Show the {next.label.toLowerCase()}? This ticket's score will be reduced by <b>{pc(next.cost)}</b>
            {shownN === 2 ? <> instead of {pc(HINT_TIERS[1].cost)}, and the ticket will be marked <b>Assisted</b></> : shownN === 1 ? <> instead of {pc(HINT_TIERS[0].cost)}</> : null}.</p>
          <div className="flex gap-2"><Button id="hint-yes" size="sm" onClick={() => A.hintYes(id)}>Show {next.label.toLowerCase()}</Button><Button size="sm" variant="outline" onClick={() => A.hintNo(id)}>Cancel</Button></div>
        </div>
      )}
      {next && !closed && ui.hintConfirm !== id && (
        <Button id={`hint-ask-${id}`} size="sm" variant="outline" onClick={() => A.hintAsk(id)}>Show {next.label.toLowerCase()} <span className="text-muted-foreground">(−{pc(next.cost)})</span></Button>
      )}
    </section>
  );
}

// ---------- Ticket detail ----------
// A follow-up: what earlier work caused it. A reopen shows the requester's reply and the
// original request; a related ticket links back to its source.
function FollowUpNote({ id }: { id: string }) {
  const t = TK[id];
  if (!t.src) return null;
  const cause = CONSEQ.find((x: any) => x.key === t.key)?.cause;
  const src = TK[t.src];
  return t.reopens ? (
    <div className="space-y-3 rounded-lg border border-bad/40 bg-bad/10 p-4 text-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-bad">Reopened · reply from {t.from}</p>
      <p className="font-semibold">{t.title}</p>
      <Html className="space-y-2" html={t.body} />
      <details className="rounded-md border bg-card px-3 py-2"><summary className="cursor-pointer font-medium">Original request</summary>
        <Html className="mt-2 space-y-2 text-muted-foreground" html={src.body} />
        <a href={`#/queue/${src.id}`} className="mt-2 inline-block font-semibold text-primary-strong underline">See how you resolved it</a></details>
    </div>
  ) : (
    <div className="rounded-lg border border-bad/40 bg-bad/10 p-4 text-sm">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-bad">Related to {t.src}</p>
      {cause} <a href={`#/queue/${t.src}`} className="font-semibold text-primary-strong underline">See {src.id}</a>
    </div>
  );
}

// Replies that reopened this ticket because the fix didn't take.
function Replies({ id }: { id: string }) {
  const ts = S.tickets[id];
  if (!ts.replies?.length) return null;
  return (
    <ol aria-label="Replies" className="space-y-2">
      {ts.replies.map((r: any, i: number) => (
        <li key={i} className="rounded-lg border border-bad/40 bg-bad/10 p-4 text-sm">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-bad">Reopened · reply from {r.from} · {r.t}</p>
          <p>"{r.text}"</p>
        </li>))}
    </ol>
  );
}

function Working({ id }: { id: string }) {
  const t = TK[id], ts = S.tickets[id];
  const [who, setWho] = useState("Security team");
  const note = useRef<HTMLTextAreaElement>(null), ans = useRef<HTMLInputElement>(null);
  const close = (kind: "resolve" | "reject") => A.closeTicket(id, kind, note.current?.value || "", ans.current?.value);
  return (
    <>
      <section aria-labelledby="ta-h" className="space-y-3">
        <SectionLabel id="ta-h">Ticket actions</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {t.caller && <Button variant="outline" onClick={() => A.verify(id)}>Mark identity verified</Button>}
          <Button variant="outline" onClick={() => A.requestApproval(id)}>Request manager approval</Button>
        </div>
        {ts.approval && <div className="rounded-lg border bg-muted/40 p-3 text-sm"><p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Approval response</p>{ts.approval}</div>}
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1.5"><Label htmlFor={`esc-${id}`}>Escalate to</Label>
            <select id={`esc-${id}`} value={who} onChange={e => setWho(e.target.value)} className="h-9 w-56 rounded-md border border-input bg-background px-3 text-sm">
              <option>Security team</option><option>Account owner</option><option>Requester's manager</option></select></div>
          <Button variant="outline" onClick={() => A.escalate(id, who)}>Escalate</Button>
        </div>
        {ts.esc.length > 0 && <p className="text-sm text-muted-foreground">Escalated to: {ts.esc.join(", ")}</p>}
      </section>
      <section aria-labelledby="ct-h" className="space-y-3">
        <SectionLabel id="ct-h">Close ticket</SectionLabel>
        {t.question && <div className="space-y-1.5"><Label htmlFor={`ans-${id}`}>Answer for the auditor</Label>
          <Input ref={ans} id={`ans-${id}`} defaultValue={ts.answer || ""} aria-describedby={`ans-help-${id}`} />
          <p id={`ans-help-${id}`} className="text-xs text-muted-foreground">Usernames (first.last) separated by commas, or "none".</p></div>}
        <div className="space-y-1.5"><Label htmlFor={`note-${id}`}>Resolution notes <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <Textarea ref={note} id={`note-${id}`} defaultValue={ts.note || ""} placeholder="What you did and why" /></div>
        {ui.closeError && <div id="close-error" role="alert" tabIndex={-1} className="rounded-lg border border-bad/40 bg-bad/10 px-4 py-3 text-sm">{ui.closeError}</div>}
        <div className="flex flex-wrap gap-2"><Button onClick={() => close("resolve")}>Resolve</Button><Button variant="outline" className="border-bad/60 text-bad hover:bg-bad/10 hover:text-bad" onClick={() => close("reject")}>Reject</Button></div>
        <p className="text-sm text-muted-foreground">Reject when the request shouldn't be fulfilled. {ts.first ? "The first resolution's grade stands. If it still isn't fixed, it comes back again." : "Closing grades the ticket. If the fix doesn't work, the requester replies and it comes back to the queue."}</p>
      </section>
    </>
  );
}

function Grade({ id }: { id: string }) {
  const t = TK[id], ts = S.tickets[id], used = hintsUsed(ts);
  return (
    <>
      <section aria-labelledby="grade-h" className="space-y-3">
        <SectionLabel id="grade-h">Grade</SectionLabel>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-3xl tabular-nums">{num(finalScore(ts))}/{ts.max}</span><Mode ts={ts} />
          <span className="scoremath text-sm text-muted-foreground">{used ? `Raw ${ts.score}/${ts.max} − ${Math.round(hintCost(ts) * 100)}% for the ${HINT_TIERS[used - 1].label.toLowerCase()} hint = ${num(finalScore(ts))}` : "No hints used"}</span>
        </div>
        <Checks checks={ts.checks} />
        {ts.reopens > 0 && <p className="text-sm text-muted-foreground">Reopened {ts.reopens === 1 ? "once" : `${ts.reopens} times`} because the fix didn't work. The grade above is your first resolution.{ts.status !== "reopened" && ts.last ? " It's fixed now." : ""}</p>}
      </section>
      <div className="rounded-r-md border-l-2 border-primary bg-primary/8 px-4 py-2.5 text-sm"><b>Takeaway.</b> {t.lesson}</div>
      {ts.answer && <div className="rounded-lg border bg-muted/40 p-3 text-sm"><p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Your answer</p>{ts.answer}</div>}
      {ts.note && <div className="rounded-lg border bg-muted/40 p-3 text-sm"><p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Your notes</p>{ts.note}</div>}
    </>
  );
}

// Everything logged under this ticket, plus approval and escalation state.
function Activity({ id }: { id: string }) {
  const ts = S.tickets[id], log = S.log.filter((e: any) => e.ticket === id).slice().reverse();
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1.5 text-[15px]">
        <dt className="text-muted-foreground">Status</dt><dd><Status st={statusOf(TK[id])} /></dd>
        <dt className="text-muted-foreground">Approval</dt><dd>{ts.approval || "Not requested"}</dd>
        <dt className="text-muted-foreground">Escalated to</dt><dd>{ts.esc.length ? ts.esc.join(", ") : "Not escalated"}</dd>
      </dl>
      {log.length ? (
        <ol className="space-y-2">{log.map((e: any) => (
          <li key={e.n} className="rounded-lg border px-4 py-2.5 text-sm"><span className="font-mono text-xs text-muted-foreground">{e.t}{e.target ? " · " + e.target : ""}</span><p>{e.d}</p></li>))}</ol>
      ) : <p className="text-muted-foreground">No activity yet. Start work to make this the active ticket.</p>}
    </div>
  );
}

function Ticket({ id, wide }: { id: string; wide: boolean }) {
  const t = TK[id], ts = S.tickets[id], active = S.active === id, closed = !!ts.checks;
  return (
    <Card className="gap-6 p-5 md:p-6">
      <a href="#/queue" className="inline-flex items-center gap-1 text-sm font-medium text-primary lg:hidden"><ChevronLeft className="size-4" />All tickets</a>
      <header data-tour="ticket" className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2"><Pri p={t.pri} /><span className="font-mono text-sm text-muted-foreground">{ticketNo(t)}</span><Status st={statusOf(t)} /><Mode ts={ts} /></div>
          {!tutorOpen(wide) && <Button size="sm" variant="outline" onClick={() => toggleTutor(wide)}><MessageCircleQuestion />Ask the tutor</Button>}
        </div>
        <h2 id="t-h" data-panel-focus className="text-2xl font-semibold">{ticketName(t)}</h2>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground"><span>{t.type}</span><span>From: {t.reopens ? TK[t.reopens].from : t.from}</span><span>Via: {t.reopens ? TK[t.reopens].channel : t.channel}</span><span>{t.reopens ? `Reopened ${t.opened}` : `Opened ${t.opened}`}</span></p>
      </header>
      <Tabs defaultValue="details">
        <TabsList data-tour="help">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="activity">Activity ({S.log.filter((e: any) => e.ticket === id).length})</TabsTrigger>
          <TabsTrigger value="hints" id={`hints-tab-${id}`}>Hints{hintsUsed(ts) ? ` (${hintsUsed(ts)} used)` : ""}</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="space-y-6 pt-5">
          <FollowUpNote id={id} />
          <Replies id={id} />
          {!t.reopens && <Html className="max-w-[68ch] space-y-2 [&_.mono]:font-mono [&_.mono]:text-sm" html={t.body} />}
          {t.caller && (
            <div className="flex gap-3 rounded-lg border bg-muted/40 p-4 text-sm">
              <Phone className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <div><p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Caller-provided identity details</p>
                Employee ID <span className="font-mono">{t.caller.empId}</span> · Manager named: {t.caller.mgr}
                <p className="mt-1 text-xs text-muted-foreground">Policy: compare both against the directory before any credential change.</p></div>
            </div>
          )}
          {t.users.length > 0 && (
            <section className="space-y-2"><SectionLabel>Related accounts</SectionLabel>
              <div className="flex flex-wrap gap-2">{t.users.map((u: string) => (
                <a key={u} href={`#/directory/${encodeURIComponent(u)}`} className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm hover:border-input">
                  <UserRound className="size-4 text-muted-foreground" aria-hidden />{U(u).name}<UserTags u={U(u)} /><ArrowRight className="size-3.5 text-muted-foreground" aria-hidden /></a>))}</div>
            </section>
          )}
          {closed ? <Grade id={id} />
            : ts.status === "new" || ts.status === "reopened" ? (
                <section data-tour="start" className="space-y-2"><Button size="lg" onClick={() => A.startWork(id)}>{ts.status === "reopened" ? "Pick it back up" : "Start work"}</Button>
                  <p className="text-sm text-muted-foreground">Starting makes this the active ticket. Changes made in the directory are logged against it.</p></section>)
            : !active ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warn/40 bg-warn/10 p-4 text-sm">
                  <span>Another ticket is active. Make this one active before working on it, so changes are logged against it.</span>
                  <Button variant="outline" onClick={() => A.resume(id)}>Make this the active ticket</Button></div>)
            : <Working key={id} id={id} />}
          {showFrameworks() && <FrameworkPanel topics={ticketTopics(id)} graded={closed} />}
        </TabsContent>
        <TabsContent value="activity" className="pt-5"><Activity id={id} /></TabsContent>
        <TabsContent value="hints" className="pt-5"><Hints id={id} /></TabsContent>
      </Tabs>
    </Card>
  );
}

// ---------- Page ----------
export default function Queue({ r }: { r: Route }) {
  const wide = useWide();
  // A source ticket that a requester reopened is listed once, as the reopened ticket.
  const hide = supersededIds(), list = queueTickets().filter((t: any) => !hide.has(t.id));
  const sel = r.id && TK[r.id] && S.tickets[r.id] ? r.id : null;
  const closedN = list.filter((t: any) => S.tickets[t.id].checks).length;
  const shown = list.filter((t: any) => ui.qfilter === "all" || (ui.qfilter === "closed") === !!S.tickets[t.id].checks)
    .sort((a: any, b: any) => (S.tickets[a.id].checks ? 1 : 0) - (S.tickets[b.id].checks ? 1 : 0) || a.pri - b.pri);
  const done = queueDone();
  const docked = wide && tutorOpen(wide) && sel;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && ui.hintConfirm) { ui.hintConfirm = null; commit(); } };
    addEventListener("keydown", onKey); return () => removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <PageHeader icon={Inbox} title="Ticket queue"
        sub={`${closedN} of ${list.length} closed. Work the P1s first, and start a ticket before changing accounts so the audit log ties your changes to it. New work and replies land here as you go.`} />
      {done && <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm"><span><b>Queue clear.</b> {path() === "iam-grc" ? "Next, audit your own shift, or skip to the summary." : "Your shift summary is ready."}</span><span className="flex gap-2"><Button asChild variant="outline"><a href="#/week">Shift summary</a></Button>{path() === "iam-grc" ? <Button asChild><a href="#/audit">Audit your shift</a></Button> : <Button asChild><a href="#/report">Readiness report</a></Button>}</span></div>}

      <div className={cn("grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]", docked && "2xl:grid-cols-[300px_minmax(0,1fr)_360px]")}>
        <div className={cn("min-w-0 space-y-2 lg:sticky lg:top-20 lg:max-h-[calc(100svh-6rem)] lg:overflow-y-auto lg:p-0.5", sel && "hidden lg:block")}>
          <div role="group" aria-label="Filter tickets" className="grid grid-cols-3 rounded-lg border bg-muted/40 p-1">
            {([["open", "Open", list.length - closedN], ["closed", "Closed", closedN], ["all", "All", list.length]] as const).map(([k, l, n]) => (
              <button key={k} aria-pressed={ui.qfilter === k} onClick={() => { ui.qfilter = k; commit(); }}
                className={cn("rounded-md py-1.5 text-sm font-medium text-muted-foreground", ui.qfilter === k && "bg-background text-foreground shadow-sm")}>{l} <span className="font-mono text-xs">{n}</span></button>))}
          </div>
          <nav aria-label="Tickets" data-tour="queue-list" className="space-y-2">
            {shown.length ? shown.map((t: any) => { const ts = S.tickets[t.id]; return (
              <a key={t.id} href={`#/queue/${t.id}`} aria-current={sel === t.id ? "page" : undefined}
                className={cn("lift grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 rounded-xl border bg-card p-3.5 hover:border-primary/40", sel === t.id && "border-primary ring-1 ring-primary", ts.checks && "bg-muted/30")}>
                <Pri p={t.pri} />
                <span><span className={cn("block text-sm font-medium leading-snug", ts.checks && "text-muted-foreground")}>{ticketName(t)}</span>
                  <span className="block truncate text-xs text-muted-foreground"><span className="font-mono">{ticketNo(t)}</span> · {t.from}</span></span>
                {(statusOf(t) !== "new" || hintsUsed(ts) > 0) && <span className="col-start-2 flex flex-wrap gap-1">{statusOf(t) !== "new" && <Status st={statusOf(t)} />}<Score ts={ts} /><Mode ts={ts} />
                  {!ts.checks && hintsUsed(ts) > 0 && !isAssisted(ts) && <Tag>{plural(hintsUsed(ts), "hint", "hints")}</Tag>}</span>}
              </a>); }) : <Empty art={IllusQueue} title={ui.qfilter === "open" ? "No open tickets" : "No closed tickets yet"}>{ui.qfilter === "open" ? "Nice work." : "Close a ticket and it shows up here."}</Empty>}
          </nav>
        </div>
        <div className={cn("min-w-0", !sel && "hidden lg:block")}>
          {sel ? <Ticket key={sel} id={sel} wide={wide} /> : <Empty art={IllusQueue} title="Pick a ticket">Priority 1 tickets are the most urgent. Open one to read it and start work.</Empty>}
        </div>
        {docked && (
          <aside className="sticky top-20 hidden h-[calc(100svh-13rem)] min-h-[28rem] self-start 2xl:block">
            <Card className="h-full gap-0 overflow-hidden p-0"><Tutor tid={sel!} onClose={() => toggleTutor(wide)} /></Card>
          </aside>
        )}
      </div>
      {sel && !wide && (
        <Sheet open={tutorOpen(wide)} onOpenChange={o => { ui.tutorOpen = o; commit(); }}>
          <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
            <SheetHeader className="sr-only"><SheetTitle>Tutor</SheetTitle><SheetDescription>Guided tutor for {ticketNo(TK[sel])}</SheetDescription></SheetHeader>
            <Tutor tid={sel} />
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
