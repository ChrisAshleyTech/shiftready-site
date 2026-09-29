// Groups (read-only): every directory group, what grants it, who holds it, and its change history.
// Derived from the engine's directory data; membership changes are made on the user.
import { UsersRound } from "lucide-react";
import { S } from "@/engine/store.js";
import { ROLES, REQUESTABLE, SOD, ALL_GROUPS } from "@/engine/company.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { go, type Route } from "../sim";
import { PageHeader, Tag, UserTags, SectionLabel, Empty } from "../components/bits";
import { DetailPanel } from "../components/DetailPanel";
import { IllusSearch } from "@/components/brand/illustrations";
import { AppIcon } from "@/packs/appIcons";
import { company } from "../company";

const kindOf = (g: string) => g.startsWith("ROLE-") ? "Privileged role" : g.startsWith("SVC-") ? "Service" : REQUESTABLE.includes(g) ? "Requestable" : Object.values(ROLES).some((gs: any) => gs.includes(g)) ? "Birthright" : "Restricted";
const rolesGranting = (g: string) => Object.entries(ROLES).filter(([, gs]: any) => gs.includes(g)).map(([k]) => k.replace("|", " / "));
const members = (g: string) => Object.values(S.users).filter((u: any) => u.groups.includes(g)) as any[];
const sodFor = (g: string) => SOD.filter(([a, b]: string[]) => a === g || b === g);
const TONE: Record<string, "neutral" | "warn" | "info" | "bad" | "primary"> = { "Privileged role": "bad", Service: "neutral", Requestable: "info", Birthright: "primary", Restricted: "warn" };

function Panel({ g }: { g: string }) {
  const m = members(g), log = S.log.filter((e: any) => typeof e.d === "string" && e.d.endsWith(" " + g)).slice().reverse();
  const k = kindOf(g);
  return (
    <DetailPanel labelId="g-h" title={<span className="flex items-center gap-2"><AppIcon icon={company().appIcon(g)} className="size-7" /><span className="font-mono">{g}</span></span>} subtitle={`${m.length} members`} badges={<Tag tone={TONE[k]}>{k}</Tag>} onClose={() => go("#/groups")}>
      <Tabs defaultValue="overview">
        <TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="members">Members</TabsTrigger><TabsTrigger value="audit">Audit log</TabsTrigger></TabsList>
        <TabsContent value="overview" className="space-y-6 pt-4">
          <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2">
            <dt className="text-muted-foreground">Type</dt><dd>{k}</dd>
            <dt className="text-muted-foreground">Members</dt><dd>{m.length} ({m.filter(u => u.enabled).length} enabled)</dd>
            <dt className="text-muted-foreground">Granted by role</dt><dd>{rolesGranting(g).join(", ") || "No role. Granted by exception only."}</dd>
            <dt className="text-muted-foreground">Requestable</dt><dd>{REQUESTABLE.includes(g) ? "Yes, with documented manager approval" : "No"}</dd>
          </dl>
          {sodFor(g).length > 0 && (
            <section className="space-y-2"><SectionLabel>Separation-of-duties rules</SectionLabel>
              <ul className="space-y-2">{sodFor(g).map(([a, b, why]: string[]) => <li key={a + b} className="rounded-lg border border-warn/30 bg-warn/10 p-3 text-sm"><span className="font-mono">{a} + {b}</span><p className="mt-1">{why}</p></li>)}</ul></section>)}
        </TabsContent>
        <TabsContent value="members" className="pt-4">
          {m.length ? (
            <ul className="divide-y rounded-lg border">{m.sort((a, b) => a.name.localeCompare(b.name)).map(u => (
              <li key={u.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span><a href={`#/directory/${encodeURIComponent(u.id)}`} className="font-semibold text-primary-strong hover:underline">{u.name}</a><span className="t-meta block">{u.title} · {u.dept}</span></span>
                <span className="flex flex-wrap gap-1"><UserTags u={u} /></span>
              </li>))}</ul>
          ) : <p className="text-muted-foreground">No members.</p>}
        </TabsContent>
        <TabsContent value="audit" className="pt-4">
          {log.length ? (
            <ul className="space-y-2">{log.map((e: any) => <li key={e.n} className="rounded-lg border px-4 py-2.5 text-sm"><span className="font-mono text-xs text-muted-foreground">{e.t} · {e.ticket || "no ticket"} · {e.target}</span><p>{e.d}</p></li>)}</ul>
          ) : <p className="text-muted-foreground">No membership changes in this shift.</p>}
        </TabsContent>
      </Tabs>
    </DetailPanel>
  );
}

export default function Groups({ r }: { r: Route }) {
  const sel = r.id && ALL_GROUPS.includes(r.id) ? r.id : null;
  return (
    <>
      <PageHeader icon={UsersRound} tint="bg-hue-violet/12 text-[color:var(--hue-violet)] dark:text-violet-300" title="Groups" sub={`${ALL_GROUPS.length} groups. Membership changes are made on the user, and are logged against the active ticket.`} />
      {ALL_GROUPS.length ? (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table>
            <caption className="sr-only">Directory groups</caption>
            <TableHeader><TableRow><TableHead>Group</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Members</TableHead><TableHead>SoD rules</TableHead></TableRow></TableHeader>
            <TableBody>{ALL_GROUPS.map((g: string) => (
              <TableRow key={g} data-state={sel === g ? "selected" : undefined}>
                <TableCell><a href={`#/groups/${encodeURIComponent(g)}`} aria-current={sel === g ? "page" : undefined} className="inline-flex items-center gap-2 font-mono text-sm font-semibold hover:text-primary-strong hover:underline"><AppIcon icon={company().appIcon(g)} />{g}</a></TableCell>
                <TableCell><Tag tone={TONE[kindOf(g)]}>{kindOf(g)}</Tag></TableCell>
                <TableCell className="text-right tabular-nums">{members(g).length}</TableCell>
                <TableCell>{sodFor(g).length || "–"}</TableCell>
              </TableRow>))}
            </TableBody>
          </Table>
        </div>
      ) : <Empty art={IllusSearch} title="No groups" />}
      {sel && <Panel key={sel} g={sel} />}
    </>
  );
}
