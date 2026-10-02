// Reference pages: runbook policy and access matrix, HR feed, audit log.
import { useEffect } from "react";
import { BookOpenText, ScrollText, Workflow } from "lucide-react";
import { IllusShield } from "@/components/brand/illustrations";
import { S, U } from "@/engine/store.js";
import { ROLES, SOD, HR_FEED, fmtDay } from "@/engine/company.js";
import { POLICIES } from "@/engine/policy.js";
import { STANDING } from "@/engine/followups.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { plural, type Route } from "../sim";
import { PageHeader, Html, SectionLabel, Tag, Empty } from "../components/bits";

export function MatrixTable({ keys }: { keys: string[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <caption className="sr-only">Access matrix: birthright groups by role</caption>
        <TableHeader><TableRow><TableHead>Department / title</TableHead><TableHead>Birthright groups</TableHead></TableRow></TableHeader>
        <TableBody>{keys.map(k => (
          <TableRow key={k}><TableHead scope="row" className="whitespace-nowrap font-medium text-foreground">{k.replace("|", " / ")}</TableHead>
            <TableCell className="whitespace-normal font-mono text-xs">{(ROLES as any)[k].join(", ")}</TableCell></TableRow>))}
        </TableBody>
      </Table>
    </div>
  );
}
export function SodTable() {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <caption className="sr-only">Separation of duties conflicts</caption>
        <TableHeader><TableRow><TableHead>Conflicting pair</TableHead><TableHead>Risk</TableHead></TableRow></TableHeader>
        <TableBody>{SOD.map(([a, b, risk]: string[]) => (
          <TableRow key={a + b}><TableCell className="font-mono text-xs">{a} + {b}</TableCell><TableCell className="whitespace-normal">{risk}</TableCell></TableRow>))}
        </TableBody>
      </Table>
    </div>
  );
}

function Policy({ r }: { r: Route }) {
  const c = r.query.get("c");
  useEffect(() => { if (c) document.getElementById("pol-" + c)?.scrollIntoView({ block: "center" }); }, [c]);
  return (
    <>
      <PageHeader icon={BookOpenText} title="Policy & access matrix" sub="The runbook every ticket is graded against. Check it before you guess." />
      <div className="space-y-8">
        <Card className="gap-3 p-5 md:p-6">
          <SectionLabel>Runbook policies</SectionLabel>
          <ol className="max-w-[80ch] list-decimal space-y-2.5 pl-5 marker:font-mono marker:text-muted-foreground">
            {POLICIES.map((p: any) => (
              <li key={p.key} id={"pol-" + p.key} className={cn("scroll-mt-24 rounded-md pl-1", c === p.key && "bg-warn/12 outline outline-6 outline-warn/12")}>
                <b>{p.title}.</b> <Html as="span" html={p.html} />
                {p.cite?.length > 0 && <span className="mt-0.5 block text-sm text-muted-foreground">Source: {p.cite.map((s: { label: string; href: string }, i: number) => (
                  <span key={s.label}>{i > 0 && ", "}<a href={s.href} target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-primary-strong">{s.label}<span className="sr-only"> (opens in a new tab)</span></a></span>))}</span>}
              </li>
            ))}
          </ol>
        </Card>
        <section className="space-y-3"><SectionLabel>Access matrix (role-based)</SectionLabel><MatrixTable keys={Object.keys(ROLES)} /></section>
        <section className="space-y-3"><SectionLabel>Separation-of-duties rules</SectionLabel><SodTable /></section>
      </div>
    </>
  );
}

function HR() {
  // The postponed leave lands in the HR feed when its ticket arrives in the queue.
  const back = STANDING[1], uid = back && back.users[0];
  const rows = (back && S.tickets[back.id] && uid ? [{ type: "Leave postponed", who: U(uid).name, detail: "Leave of absence postponed. Working today.", when: 0 }] : []).concat(HR_FEED);
  return (
    <>
      <PageHeader icon={Workflow} tint="bg-hue-amber/15 text-warn" title="HR feed" sub="Workday is the source of truth for joiners, movers and leavers. When a ticket and HR disagree, HR wins." />
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <caption className="sr-only">HR events</caption>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Event</TableHead><TableHead>Worker</TableHead><TableHead>Details</TableHead></TableRow></TableHeader>
          <TableBody>{rows.map((e: any, i: number) => (
            <TableRow key={i}>
              <TableCell className="font-mono text-xs">{fmtDay(e.when)}</TableCell>
              <TableCell><Tag tone={e.type === "Termination" ? "bad" : e.type.includes("ire") ? "ok" : "info"}>{e.type}</Tag></TableCell>
              <TableCell className="font-medium">{e.who}</TableCell>
              <TableCell className="whitespace-normal text-muted-foreground">{e.detail}</TableCell>
            </TableRow>))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function Log() {
  const noTicket = S.log.filter((e: any) => !e.ticket).length;
  return (
    <>
      <PageHeader icon={ScrollText} tint="bg-hue-pink/12 text-bad" title="Audit log" sub="Every change is recorded with the ticket it was made under. Auditors sample this, and so will you on the GRC desk." />
      {noTicket > 0 && <div className="mb-4 rounded-lg border border-warn/30 bg-warn/10 px-4 py-3 text-sm"><b>{plural(noTicket, "change has", "changes have")} no ticket.</b> Changes made without an active ticket are exceptions under control APD-03.</div>}
      {S.log.length ? (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <caption className="sr-only">Audit log, newest first</caption>
            <TableHeader><TableRow><TableHead className="text-right">#</TableHead><TableHead>Time</TableHead><TableHead>Ticket</TableHead><TableHead>Account</TableHead><TableHead>Change</TableHead></TableRow></TableHeader>
            <TableBody>{S.log.slice().reverse().map((e: any) => (
              <TableRow key={e.n}>
                <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">{e.n}</TableCell>
                <TableCell className="font-mono text-xs">{e.t}</TableCell>
                <TableCell>{e.ticket ? <a className="font-mono text-xs text-primary underline-offset-2 hover:underline" href={`#/queue/${e.ticket}`}>{e.ticket}</a> : <Tag tone="bad">No ticket</Tag>}</TableCell>
                <TableCell>{e.target ? <a className="font-mono text-xs text-primary underline-offset-2 hover:underline" href={`#/directory/${encodeURIComponent(e.target)}`}>{e.target}</a> : "–"}</TableCell>
                <TableCell className="whitespace-normal">{e.d}</TableCell>
              </TableRow>))}
            </TableBody>
          </Table>
        </div>
      ) : <Empty art={IllusShield} title="No changes yet">Start a ticket in the <a className="text-primary underline" href="#/queue">queue</a>. Every change you make appears here.</Empty>}
    </>
  );
}

export default function Reference({ r }: { r: Route }) {
  if (r.name === "policy") return <Policy r={r} />;
  if (r.name === "hr") return <HR />;
  return <Log />;
}
