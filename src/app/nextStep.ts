// The one next thing to do on the current path, for Home.
import { S } from "@/engine/store.js";
import { stage, nextTicket } from "@/engine/skills.js";
import { company } from "./company";
import { path } from "./paths";
import { weekAudit, waTotals } from "./audit/weekAudit";
import { ticketNo, ticketName } from "./ticketLabel";

export function nextStep(): { label: string; href: string } {
  if (!company().hasTickets) return { label: "Explore the directory (tickets in development)", href: "#/directory" };
  const p = path(), wa = weekAudit(), wt = waTotals();
  const auditNext = wa?.tasks.find(t => !wa.st[t.id]?.checks);
  if (p === "grc") return auditNext ? { label: `Audit task ${wa!.tasks.indexOf(auditNext) + 1}: ${auditNext.step}`, href: `#/audit/${auditNext.id}` } : { label: "Share your readiness report", href: "#/report" };
  if (stage() !== "done") { const t = nextTicket(); return { label: `${ticketNo(t)} ${ticketName(t)}`, href: `#/queue/${t.id}` }; }
  if (p === "iam-grc" && !S.wa?.skipped) {
    if (!wa) return { label: "Audit your own shift (optional)", href: "#/audit" };
    if (auditNext) return { label: `Self-audit task ${wa.tasks.indexOf(auditNext) + 1}: ${auditNext.step}`, href: `#/audit/${auditNext.id}` };
  }
  return wt.done || p === "iam" || p === "pam" || S.wa?.skipped ? { label: "Review your shift summary", href: "#/week" } : { label: "Share your readiness report", href: "#/report" };
}
