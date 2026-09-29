// Screens for a company whose tickets are still being written: an overview in place of the shift
// home, and a notice in place of the queue, results, report, audit desk and lab.
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EarlyAccess } from "@/components/brand/EarlyAccess";
import { S } from "@/engine/store.js";
import { ROLES, SOD, ALL_GROUPS, HR_FEED } from "@/engine/company.js";
import { POLICIES } from "@/engine/policy.js";
import { company } from "../company";
import { PageHeader, Empty } from "./bits";
import { AuditPopulations } from "./AuditPopulations";

export function NoTickets({ title }: { title: string }) {
  const c = company();
  return (
    <>
      <PageHeader title={title} />
      <Empty title={`Tickets for ${c.name} are in development`}>
        <p className="mb-4"><EarlyAccess /></p>
        <p>The directory, groups, access matrix, policies and HR feed are ready to explore now.</p>
        <Button asChild className="mt-5 font-bold"><a href="#/directory">Explore the directory</a></Button>
      </Empty>
    </>
  );
}

export function CompanyOverview() {
  const c = company();
  const users = Object.values(S.users) as any[];
  const stats: [string, number, string][] = [
    ["Accounts", users.length, "#/directory"],
    ["Groups", ALL_GROUPS.length, "#/groups"],
    ["Roles in the access matrix", Object.keys(ROLES).length, "#/policy"],
    ["SoD rules", SOD.length, "#/policy"],
    ["Runbook policies", POLICIES.length, "#/policy"],
    ["HR feed events", HR_FEED.length, "#/hr"],
  ];
  return (
    <>
      <PageHeader icon={Building2} title={c.name} sub={`${c.industry} · ${c.frameworks}`}><EarlyAccess /></PageHeader>
      <div className="space-y-6">
        <p className="max-w-[70ch]">Tickets for {c.name} are in development. You can explore the company now: who works here, what each role is granted, the separation-of-duties rules, the runbook and today's HR feed.</p>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map(([k, n, href]) => (
            <li key={k}><a href={href} className="lift block rounded-xl border bg-card p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className="block font-mono text-2xl">{n}</span><span className="text-sm text-muted-foreground">{k}</span>
            </a></li>
          ))}
        </ul>
        <AuditPopulations className="max-w-xl rounded-xl border bg-card p-5" />
      </div>
    </>
  );
}
