// The one next thing to do on the current path, for Home.
import { S } from "@/engine/store.js";
import { T } from "@/engine/tickets.js";
import { THU_T } from "@/engine/thursday.js";
import { stage, nextTicket } from "@/engine/skills.js";
import { company } from "./company";
import { path } from "./paths";
import { weekAudit, waTotals } from "./audit/weekAudit";

export function nextStep(): { label: string; href: string } {
  if (!company().hasTickets) return { label: "Explore the directory (tickets in development)", href: "#/directory" };
  const p = path(), wa = weekAudit(), wt = waTotals();
  const auditNext = wa?.tasks.find(t => !wa.st[t.id]?.checks);
  if (p === "grc") return auditNext ? { label: `Audit task ${wa!.tasks.indexOf(auditNext) + 1}: ${auditNext.step}`, href: `#/audit/${auditNext.id}` } : { label: "Share your readiness report", href: "#/report" };
  const st = stage();
  if (st === "new" || st === "mon") { const t = nextTicket(T); return { label: `Monday: ${t.id} ${t.title}`, href: `#/queue/${t.id}` }; }
  if (st === "mon-done") return { label: "Start the Thursday shift", href: "#/results" };
  if (st === "thu") { const t = nextTicket(THU_T); return { label: `Thursday: ${t.id} ${t.title}`, href: `#/queue/${t.id}` }; }
  if (p === "iam-grc" && !S.wa?.skipped) {
    if (!wa) return { label: "Friday: audit your own week (optional)", href: "#/audit" };
    if (auditNext) return { label: `Friday audit task ${wa.tasks.indexOf(auditNext) + 1}: ${auditNext.step}`, href: `#/audit/${auditNext.id}` };
  }
  return wt.done || p === "iam" || S.wa?.skipped ? { label: "Review your week summary", href: "#/week" } : { label: "Share your readiness report", href: "#/report" };
}
