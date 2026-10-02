// Users: searchable, sortable account table. Selecting a user opens a detail panel from the right
// with Overview / Groups / Audit log tabs. Actions are the same engine calls as before.
import { useRef, useState } from "react";
import { Users, ArrowDown, ArrowUp, Eye, Search, ShieldAlert } from "lucide-react";
import { S, U } from "@/engine/store.js";
import { ROLES, ALL_GROUPS, fmtDay } from "@/engine/company.js";
import { TK } from "@/engine/tickets.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { commit, ui, lastTxt, plural, focusSoon, go, type Route } from "../sim";
import { company } from "../company";
import { AppIcon } from "@/packs/appIcons";
import { ExportButtons } from "../components/ExportButtons";
import { accessReview } from "../exportData";
import { downloadCsv, downloadXlsx, fileName } from "../exports";
import { doAct } from "../actions";
import { readOnly } from "../paths";
import { IllusSearch } from "@/components/brand/illustrations";
import { PageHeader, UserTags, SectionLabel, Empty } from "../components/bits";
import { DetailPanel } from "../components/DetailPanel";

const STATUS: [string, string][] = [["all", "All statuses"], ["enabled", "Enabled"], ["disabled", "Disabled"], ["locked", "Locked"], ["prehire", "Pre-hire"], ["contractor", "Contractors"], ["service", "Service accounts"]];
const statusOk = (u: any, s: string) => s === "all" || (s === "enabled" && u.enabled) || (s === "disabled" && !u.enabled && !u.preHire) || (s === "locked" && u.locked) || (s === "prehire" && u.preHire) || (s === "contractor" && u.type === "Contractor") || (s === "service" && u.type === "Service");
const COLS: [string, string][] = [["name", "Name"], ["title", "Job"], ["last", "Last sign-in"], ["status", "Status"]];
const sorters: Record<string, (a: any, b: any) => number> = {
  name: (a, b) => a.name.localeCompare(b.name),
  title: (a, b) => (a.dept + a.title).localeCompare(b.dept + b.title) || a.name.localeCompare(b.name),
  last: (a, b) => (b.last ?? -1) - (a.last ?? -1) || a.name.localeCompare(b.name), // oldest sign-in first
  status: (a, b) => (a.enabled - b.enabled) || (b.locked - a.locked) || a.name.localeCompare(b.name),
};
const selectCls = "h-10 w-full rounded-lg border border-input bg-background px-3 text-[15px]";

function UserPanel({ id }: { id: string }) {
  const u = U(id);
  const avail = ALL_GROUPS.filter((g: string) => !u.groups.includes(g));
  const at = S.active && S.tickets[S.active]?.status === "working" ? TK[S.active] : null, ro = readOnly();
  const [grpPick, setGrp] = useState(avail[0] || "");
  const grp = avail.includes(grpPick) ? grpPick : avail[0] || ""; // the picked group may have just been added
  const [job, setJob] = useState(u.dept + "|" + u.title);
  const exp = useRef<HTMLInputElement>(null);
  const log = S.log.filter((e: any) => e.target === id).slice().reverse();
  const kv: [string, React.ReactNode][] = [
    ["Username", <span className="font-mono text-sm">{u.id}@{company().domain}</span>],
    ["Employee ID", <span className="font-mono">{u.empId}</span>],
    ["Department", u.dept], ["Job title", u.title], ["Manager", u.mgr], ["Account type", u.type],
    ["Status", `${u.enabled ? "Enabled" : "Disabled"}${u.locked ? " · Locked (too many failed sign-ins)" : ""}`],
    ["Last sign-in", lastTxt(u.last)],
    ["Account expires", u.expiry === null ? "Never" : `${fmtDay(u.expiry)} (${u.expiry} days)`],
    ["MFA", u.mfa ? "Microsoft Authenticator (registered)" : u.mfaReset ? "Reset: re-registration required" : "Not registered"],
    ["Credential", `${u.pwReset ? "Temporary password issued" : "Set by user"}${u.revoked ? " · Sessions revoked" : ""}`],
  ];
  return (
    <DetailPanel labelId="u-h" title={u.name} subtitle={`${u.title} · ${u.dept}`} badges={<UserTags u={u} />} onClose={() => go("#/directory")}>
      <div className="space-y-5">
        {ro ? <div className="flex gap-3 rounded-lg border border-info/40 bg-info/10 px-4 py-3 text-sm"><Eye className="mt-0.5 size-4 shrink-0 text-info" aria-hidden /><span><b>Read-only evidence.</b> This is the account as it stood at the end of Jordan Reyes&apos; week. Auditors don&apos;t change what they test.</span></div>
          : at ? <div className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm">Changes are logged against <a className="font-mono font-semibold text-primary-strong underline" href={`#/queue/${at.id}`}>{at.id}</a>: {at.title}</div>
          : <div className="flex gap-3 rounded-lg border border-warn/40 bg-warn/10 px-4 py-3 text-sm"><ShieldAlert className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden /><span><b>No active ticket.</b> Changes made now aren't tied to a ticket, and auditors will flag them. <a className="font-semibold text-primary-strong underline" href="#/queue">Start a ticket first</a>.</span></div>}
        <Tabs defaultValue="overview">
          <TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="groups">Groups ({u.groups.length})</TabsTrigger><TabsTrigger value="audit">Audit log ({log.length})</TabsTrigger></TabsList>

          <TabsContent value="overview" className="space-y-6 pt-4">
            <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-[15px]">
              {kv.map(([k, v]) => <div key={k} className="contents"><dt className="text-muted-foreground">{k}</dt><dd className="min-w-0 break-words">{v}</dd></div>)}
            </dl>
            {!ro && <>
            <section aria-labelledby="ua-h" className="space-y-2">
              <SectionLabel id="ua-h">Account</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {u.enabled ? <Button variant="outline" className="border-bad/60 text-bad hover:bg-bad/10 hover:text-bad" onClick={() => doAct("disable", id)}>Disable</Button>
                  : <Button variant="outline" onClick={() => doAct("enable", id)}>Enable</Button>}
                {u.locked && <Button variant="outline" onClick={() => doAct("unlock", id)}>Unlock</Button>}
              </div>
              {!u.locked && <p className="t-meta">Not locked, so there's nothing to unlock.</p>}
            </section>
            <section aria-labelledby="uc-h" className="space-y-2">
              <SectionLabel id="uc-h">Credentials and sessions</SectionLabel>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => doAct("pwreset", id)}>Reset password</Button>
                <Button variant="outline" onClick={() => doAct("mfareset", id)}>Reset MFA</Button>
                <Button variant="outline" onClick={() => doAct("revoke", id)}>Revoke sessions</Button>
              </div>
              <p className="t-meta">These can't be undone. The user sets up a new password or MFA method.</p>
            </section>
            <section aria-labelledby="uj-h" className="space-y-2">
              <SectionLabel id="uj-h">Job info</SectionLabel>
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-48 flex-1 space-y-1.5"><Label htmlFor="job">Department / title</Label>
                  <select id="job" value={job} onChange={e => setJob(e.target.value)} className={selectCls}>{Object.keys(ROLES).map(k => <option key={k} value={k}>{k.replace("|", " / ")}</option>)}</select></div>
                <Button variant="outline" onClick={() => doAct("job", id, job)}>Update job info</Button>
              </div>
              <p className="t-meta">Updating job info doesn't change group memberships.</p>
            </section>
            <section aria-labelledby="ux-h" className="space-y-2">
              <SectionLabel id="ux-h">Account expiry</SectionLabel>
              <div className="flex flex-wrap items-end gap-2">
                <div className="space-y-1.5"><Label htmlFor="exp">Days from today</Label><Input ref={exp} id="exp" type="number" min={0} max={365} inputMode="numeric" className="w-40" /></div>
                <Button variant="outline" onClick={() => { const v = exp.current!.value; if (!v) { toast("Enter a number of days first (0 removes the expiry)."); exp.current!.focus(); return; } doAct("expiry", id, v); exp.current!.value = ""; }}>Set expiry</Button>
              </div>
              <p className="t-meta">Enter 0 to remove the expiry.</p>
            </section>
            </>}
          </TabsContent>

          <TabsContent value="groups" className="space-y-4 pt-4">
            {u.groups.length ? (
              <ul className="divide-y rounded-lg border">{u.groups.slice().sort().map((g: string) => (
                <li key={g} className="flex items-center justify-between gap-2 py-1 pl-4 pr-1">
                  <a href={`#/groups/${encodeURIComponent(g)}`} className="inline-flex items-center gap-2 font-mono text-sm hover:text-primary-strong hover:underline"><AppIcon icon={company().appIcon(g)} className="size-5" />{g}</a>
                  {!ro && <Button size="sm" variant="ghost" className="text-bad hover:bg-bad/10 hover:text-bad" aria-label={`Remove ${g}`} onClick={() => doAct("rmgrp", id, g)}>Remove</Button>}
                </li>))}</ul>
            ) : <p className="text-muted-foreground">No memberships.</p>}
            {!ro && <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-48 flex-1 space-y-1.5"><Label htmlFor="addg">Add a group</Label>
                <select id="addg" value={grp} onChange={e => setGrp(e.target.value)} className={selectCls}>{avail.map((g: string) => <option key={g}>{g}</option>)}</select></div>
              <Button variant="outline" onClick={() => doAct("addgrp", id, grp)}>Add</Button>
            </div>}
          </TabsContent>

          <TabsContent value="audit" className="pt-4">
            {log.length ? (
              <ul className="space-y-2">{log.map((e: any) => (
                <li key={e.n} className="rounded-lg border px-4 py-2.5 text-sm">
                  <span className="font-mono text-xs text-muted-foreground">{e.t} · {e.ticket ? <a className="text-primary-strong underline" href={`#/queue/${e.ticket}`}>{e.ticket}</a> : "no ticket"}</span><p>{e.d}</p>
                </li>))}</ul>
            ) : <p className="text-muted-foreground">No changes to this account in this shift.</p>}
          </TabsContent>
        </Tabs>
      </div>
    </DetailPanel>
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
      <PageHeader icon={Users} tint="bg-hue-violet/12 text-[color:var(--hue-violet)] dark:text-violet-300" title="Users" sub={`${Object.keys(S.users).length} accounts in the ${company().name} directory. Select a user to view and change the account.`}>
        <ExportButtons label="Access review"
          onCsv={() => downloadCsv(accessReview()[0], fileName(company().id, "access-review", "csv"))}
          onXlsx={() => downloadXlsx(accessReview(), fileName(company().id, "access-review", "xlsx"),
            [["Company", company().name], ["Contents", "Access review (one row per user and group), access matrix, SoD rules"], ["Directory as of", `${fmtDay(0)}, including changes made in this shift`]])} />
      </PageHeader>
      <div className="space-y-3">
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
          <p role="status" className="t-meta">{plural(list.length, "account", "accounts")}{filtered ? " match" : ""}</p>
          {filtered && <Button variant="ghost" size="sm" onClick={clear}>Clear filters</Button>}
        </div>
        {list.length ? (
          <div className="max-h-[calc(100svh-19rem)] overflow-auto rounded-lg border bg-card">
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
                  <TableCell><a className="font-semibold hover:text-primary-strong hover:underline" href={`#/directory/${encodeURIComponent(u.id)}`} aria-current={sel === u.id ? "page" : undefined}>{u.name}</a>
                    <div className="font-mono text-xs text-muted-foreground">{u.id}</div></TableCell>
                  <TableCell className="whitespace-normal">{u.title}<div className="text-xs text-muted-foreground">{u.dept}</div></TableCell>
                  <TableCell className="tabular-nums">{lastTxt(u.last)}</TableCell>
                  <TableCell><div className="flex flex-wrap gap-1"><UserTags u={u} /></div></TableCell>
                </TableRow>))}
              </TableBody>
            </Table>
          </div>
        ) : <Empty art={IllusSearch} title="No accounts match">Try a shorter search, or <button className="font-semibold text-primary-strong underline" onClick={clear}>clear the filters</button>.</Empty>}
      </div>
      {sel && <UserPanel key={sel} id={sel} />}
    </>
  );
}
