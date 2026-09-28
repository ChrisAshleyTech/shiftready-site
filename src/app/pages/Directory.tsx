// Directory console: searchable, sortable account table with an account detail panel.
import { useRef, useState } from "react";
import { Users, ArrowDown, ArrowUp, ChevronLeft, Search, ShieldAlert } from "lucide-react";
import { S, U } from "@/engine/store.js";
import { ROLES, ALL_GROUPS, fmtDay } from "@/engine/company.js";
import { TK } from "@/engine/tickets.js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { commit, ui, lastTxt, plural, focusSoon, type Route } from "../sim";
import { doAct } from "../actions";
import { IllusSearch } from "@/components/brand/illustrations";
import { PageHeader, UserTags, SectionLabel, Empty } from "../components/bits";

const STATUS: [string, string][] = [["all", "All statuses"], ["enabled", "Enabled"], ["disabled", "Disabled"], ["locked", "Locked"], ["prehire", "Pre-hire"], ["contractor", "Contractors"], ["service", "Service accounts"]];
const statusOk = (u: any, s: string) => s === "all" || (s === "enabled" && u.enabled) || (s === "disabled" && !u.enabled && !u.preHire) || (s === "locked" && u.locked) || (s === "prehire" && u.preHire) || (s === "contractor" && u.type === "Contractor") || (s === "service" && u.type === "Service");
const COLS: [string, string][] = [["name", "Name"], ["title", "Job"], ["last", "Last sign-in"], ["status", "Status"]];
const sorters: Record<string, (a: any, b: any) => number> = {
  name: (a, b) => a.name.localeCompare(b.name),
  title: (a, b) => (a.dept + a.title).localeCompare(b.dept + b.title) || a.name.localeCompare(b.name),
  last: (a, b) => (b.last ?? -1) - (a.last ?? -1) || a.name.localeCompare(b.name), // oldest sign-in first
  status: (a, b) => (a.enabled - b.enabled) || (b.locked - a.locked) || a.name.localeCompare(b.name),
};
const selectCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm";

function Detail({ id }: { id: string }) {
  const u = U(id);
  const avail = ALL_GROUPS.filter((g: string) => !u.groups.includes(g));
  const at = S.active && S.tickets[S.active]?.status === "working" ? TK[S.active] : null;
  const [grpPick, setGrp] = useState(avail[0] || "");
  const grp = avail.includes(grpPick) ? grpPick : avail[0] || ""; // the picked group may have just been added
  const [job, setJob] = useState(u.dept + "|" + u.title);
  const exp = useRef<HTMLInputElement>(null);
  const kv: [string, React.ReactNode][] = [
    ["Username", <span className="font-mono text-xs">{u.id}@pacificcrest.co</span>],
    ["Employee ID", <span className="font-mono">{u.empId}</span>],
    ["Manager", u.mgr], ["Account type", u.type],
    ["Status", `${u.enabled ? "Enabled" : "Disabled"}${u.locked ? " · Locked (too many failed sign-ins)" : ""}`],
    ["Last sign-in", lastTxt(u.last)],
    ["Account expires", u.expiry === null ? "Never" : `${fmtDay(u.expiry)} (${u.expiry} days)`],
    ["MFA", u.mfa ? "Microsoft Authenticator (registered)" : u.mfaReset ? "Reset: re-registration required" : "Not registered"],
    ["Credential", `${u.pwReset ? "Temporary password issued" : "Set by user"}${u.revoked ? " · Sessions revoked" : ""}`],
  ];
  return (
    <Card className="gap-6 p-5 md:p-6">
      <a href="#/directory" className="inline-flex items-center gap-1 text-sm font-medium text-primary xl:hidden"><ChevronLeft className="size-4" />Directory</a>
      {at ? <div className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm">Changes are logged against <a className="font-mono font-semibold text-primary-strong underline" href={`#/queue/${at.id}`}>{at.id}</a>: {at.title}</div>
        : <div className="flex gap-3 rounded-lg border border-warn/40 bg-warn/10 px-4 py-3 text-sm"><ShieldAlert className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden /><span><b>No active ticket.</b> Changes you make now won't be tied to a ticket, and auditors will flag them. <a className="font-semibold text-primary-strong underline" href="#/queue">Start a ticket first</a>.</span></div>}
      <header className="space-y-2">
        <div className="flex flex-wrap gap-1"><UserTags u={u} /></div>
        <h2 id="u-h" data-panel-focus className="text-2xl font-semibold">{u.name}</h2>
        <p className="text-sm text-muted-foreground">{u.title} · {u.dept}</p>
      </header>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-5 gap-y-1.5 text-sm">
        {kv.map(([k, v]) => <div key={k} className="contents"><dt className="text-muted-foreground">{k}</dt><dd className="min-w-0 break-words">{v}</dd></div>)}
      </dl>
      <section aria-labelledby="ua-h" className="space-y-2">
        <SectionLabel id="ua-h">Account</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {u.enabled ? <Button variant="outline" className="border-bad/60 text-bad hover:bg-bad/10 hover:text-bad" onClick={() => doAct("disable", id)}>Disable</Button>
            : <Button variant="outline" onClick={() => doAct("enable", id)}>Enable</Button>}
          {u.locked && <Button variant="outline" onClick={() => doAct("unlock", id)}>Unlock</Button>}
        </div>
        {!u.locked && <p className="text-xs text-muted-foreground">Not locked, so there's nothing to unlock.</p>}
      </section>
      <section aria-labelledby="uc-h" className="space-y-2">
        <SectionLabel id="uc-h">Credentials and sessions</SectionLabel>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => doAct("pwreset", id)}>Reset password</Button>
          <Button variant="outline" onClick={() => doAct("mfareset", id)}>Reset MFA</Button>
          <Button variant="outline" onClick={() => doAct("revoke", id)}>Revoke sessions</Button>
        </div>
        <p className="text-xs text-muted-foreground">These can't be undone. The user has to set up a new password or MFA method.</p>
      </section>
      <section aria-labelledby="ug-h" className="space-y-2">
        <SectionLabel id="ug-h">Group memberships ({u.groups.length})</SectionLabel>
        {u.groups.length ? (
          <ul className="space-y-1">{u.groups.slice().sort().map((g: string) => (
            <li key={g} className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 py-1 pl-3 pr-1 font-mono text-xs">{g}
              <Button size="sm" variant="ghost" className="h-8 font-sans text-bad hover:bg-bad/10 hover:text-bad" aria-label={`Remove ${g}`} onClick={() => doAct("rmgrp", id, g)}>Remove</Button></li>))}</ul>
        ) : <p className="text-sm text-muted-foreground">No memberships.</p>}
        <div className="flex flex-wrap items-end gap-2 pt-1">
          <div className="min-w-48 flex-1 space-y-1.5"><Label htmlFor="addg">Add a group</Label>
            <select id="addg" value={grp} onChange={e => setGrp(e.target.value)} className={selectCls}>{avail.map((g: string) => <option key={g}>{g}</option>)}</select></div>
          <Button variant="outline" onClick={() => doAct("addgrp", id, grp)}>Add</Button>
        </div>
      </section>
      <section aria-labelledby="uj-h" className="space-y-2">
        <SectionLabel id="uj-h">Job info</SectionLabel>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-48 flex-1 space-y-1.5"><Label htmlFor="job">Department / title</Label>
            <select id="job" value={job} onChange={e => setJob(e.target.value)} className={selectCls}>{Object.keys(ROLES).map(k => <option key={k} value={k}>{k.replace("|", " / ")}</option>)}</select></div>
          <Button variant="outline" onClick={() => doAct("job", id, job)}>Update job info</Button>
        </div>
        <p className="text-xs text-muted-foreground">Updating job info doesn't change group memberships.</p>
      </section>
      <section aria-labelledby="ux-h" className="space-y-2">
        <SectionLabel id="ux-h">Account expiry</SectionLabel>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1.5"><Label htmlFor="exp">Days from today</Label><Input ref={exp} id="exp" type="number" min={0} max={365} inputMode="numeric" className="w-40" /></div>
          <Button variant="outline" onClick={() => { const v = exp.current!.value; if (!v) { toast("Enter a number of days first (0 removes the expiry)."); exp.current!.focus(); return; } doAct("expiry", id, v); exp.current!.value = ""; }}>Set expiry</Button>
        </div>
        <p className="text-xs text-muted-foreground">Enter 0 to remove the expiry.</p>
      </section>
    </Card>
  );
}

export default function Directory({ r }: { r: Route }) {
  const sel = r.id && S.users[r.id] ? r.id : null;
  const q = ui.dirQ.trim().toLowerCase();
  const depts = ["All", ...new Set(Object.values(S.users).map((u: any) => u.dept as string))];
  const list = Object.values(S.users).filter((u: any) => (ui.dirDept === "All" || u.dept === ui.dirDept) && statusOk(u, ui.dirStatus)
    && (!q || u.name.toLowerCase().includes(q) || u.id.includes(q) || u.empId.toLowerCase().includes(q) || u.title.toLowerCase().includes(q))) as any[];
  const { key, dir } = ui.dirSort;
  list.sort((a, b) => dir * sorters[key](a, b));
  const filtered = !!q || ui.dirDept !== "All" || ui.dirStatus !== "all";
  const clear = () => { ui.dirQ = ""; ui.dirDept = "All"; ui.dirStatus = "all"; commit(); focusSoon("#dir-q"); };
  return (
    <>
      <PageHeader icon={Users} tint="bg-hue-violet/12 text-[color:var(--hue-violet)] dark:text-violet-300" title="Directory" sub={`Pacific Crest's identity directory: ${Object.keys(S.users).length} accounts. Search, filter, then open an account to change it.`} />
      <div className={cn("grid gap-4", sel && "xl:grid-cols-[minmax(0,1fr)_440px]")}>
        <div className={cn("min-w-0 space-y-3", sel && "hidden xl:block")}>
          <div role="search" className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
            <div className="space-y-1.5"><Label htmlFor="dir-q">Search</Label>
              <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input id="dir-q" type="search" autoComplete="off" className="pl-9" placeholder="Name, username, employee ID or title" value={ui.dirQ} onChange={e => { ui.dirQ = e.target.value; commit(); }} /></div></div>
            <div className="space-y-1.5"><Label htmlFor="dir-dept">Department</Label>
              <select id="dir-dept" className={selectCls} value={ui.dirDept} onChange={e => { ui.dirDept = e.target.value; commit(); }}>{depts.map(d => <option key={d}>{d}</option>)}</select></div>
            <div className="space-y-1.5"><Label htmlFor="dir-st">Status</Label>
              <select id="dir-st" className={selectCls} value={ui.dirStatus} onChange={e => { ui.dirStatus = e.target.value; commit(); }}>{STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
          </div>
          <div className="flex items-center justify-between">
            <p role="status" className="text-sm text-muted-foreground">{plural(list.length, "account", "accounts")}{filtered ? " match" : ""}</p>
            {filtered && <Button variant="ghost" size="sm" onClick={clear}>Clear filters</Button>}
          </div>
          {list.length ? (
            <div className="max-h-[calc(100svh-19rem)] overflow-auto rounded-lg border">
              <Table>
                <caption className="sr-only">Accounts, sorted by {COLS.find(c => c[0] === key)![1]}</caption>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>{COLS.map(([k, l]) => (
                    <TableHead key={k} aria-sort={key === k ? (dir > 0 ? "ascending" : "descending") : "none"}>
                      <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => { ui.dirSort = { key: k, dir: key === k ? -dir : 1 }; commit(); }}>
                        {l}{key === k && (dir > 0 ? <ArrowUp className="size-3" aria-hidden /> : <ArrowDown className="size-3" aria-hidden />)}</button>
                    </TableHead>))}</TableRow>
                </TableHeader>
                <TableBody>{list.map(u => (
                  <TableRow key={u.id} data-state={sel === u.id ? "selected" : undefined}>
                    <TableCell><a className="font-medium hover:text-primary hover:underline" href={`#/directory/${encodeURIComponent(u.id)}`} aria-current={sel === u.id ? "page" : undefined}>{u.name}</a>
                      <div className="font-mono text-xs text-muted-foreground">{u.id}</div></TableCell>
                    <TableCell className="whitespace-normal">{u.title}<div className="text-xs text-muted-foreground">{u.dept}</div></TableCell>
                    <TableCell className="tabular-nums">{lastTxt(u.last)}</TableCell>
                    <TableCell><div className="flex flex-wrap gap-1"><UserTags u={u} /></div></TableCell>
                  </TableRow>))}
                </TableBody>
              </Table>
            </div>
          ) : <Empty art={IllusSearch} title="No accounts match">Try a shorter search, or <button className="text-primary underline" onClick={clear}>clear the filters</button>.</Empty>}
        </div>
        {sel && <div className="xl:sticky xl:top-20 xl:max-h-[calc(100svh-6rem)] xl:overflow-y-auto"><Detail key={sel} id={sel} /></div>}
      </div>
    </>
  );
}
