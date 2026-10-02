// What the exports contain: the access review (live directory state), GRC samples as workpapers,
// and audit populations built from the company's finance and employment records.
import { S } from "@/engine/store.js";
import { ROLES, REQUESTABLE, SOD, fmtDay } from "@/engine/company.js";
import { company } from "./company";
import type { Cell, Table } from "./exports";

const status = (u: any) => u.preHire ? "Pre-hire" : !u.enabled ? "Disabled" : u.locked ? "Locked" : "Enabled";
const lastSeen = (n: number | null) => n == null ? "Never" : n === 0 ? "Today" : `${n} days ago`;
export const groupType = (g: string) => g.startsWith("ROLE-") ? "Privileged role" : g.startsWith("SVC-") ? "Service"
  : REQUESTABLE.includes(g) ? "Requestable" : Object.values(ROLES).some((gs: any) => gs.includes(g)) ? "Birthright" : "Restricted";
const sodText = (u: any, g: string) => SOD.filter(([a, b]: string[]) => (a === g && u.groups.includes(b)) || (b === g && u.groups.includes(a)))
  .map(([a, b]: string[]) => `${a} + ${b}`).join("; ");

// One row per user and group, the usual layout for a manager certification.
export function accessReview(): Table[] {
  const rows: Cell[][] = [];
  for (const u of Object.values(S.users) as any[]) {
    const role: string[] = ROLES[`${u.dept}|${u.title}`] ?? [];
    const base = [u.id, u.name, u.empId, u.type, status(u), u.dept, u.title, u.mgr, lastSeen(u.last), u.expiry ? fmtDay(u.expiry) : ""];
    if (!u.groups.length) rows.push([...base, "", "", "", "", "", ""]);
    for (const g of [...u.groups].sort()) rows.push([...base, g, groupType(g), role.includes(g) ? "Yes" : "No", sodText(u, g), "", ""]);
  }
  rows.sort((a, b) => String(a[1]).localeCompare(String(b[1])) || String(a[10]).localeCompare(String(b[10])));
  return [
    { name: "Access review", rows, columns: [
      { header: "Username" }, { header: "Name", width: 22 }, { header: "Employee ID", width: 12 }, { header: "Type", width: 12 }, { header: "Status", width: 10 },
      { header: "Department", width: 14 }, { header: "Title", width: 22 }, { header: "Manager", width: 24 }, { header: "Last sign-in", width: 14 },
      { header: "Account expiry", kind: "date", width: 14 }, { header: "Group", width: 26 }, { header: "Group type", width: 16 },
      { header: "Granted by role", width: 14 }, { header: "SoD conflict", width: 34 }, { header: "Decision (keep / remove)", width: 22 }, { header: "Reviewer comments", width: 30 },
    ] },
    { name: "Access matrix", columns: [{ header: "Department", width: 14 }, { header: "Title", width: 22 }, { header: "Birthright groups", width: 90 }],
      rows: Object.entries(ROLES).map(([rk, gs]: any) => [...rk.split("|"), gs.join(", ")]) },
    { name: "SoD rules", columns: [{ header: "Group A", width: 26 }, { header: "Group B", width: 26 }, { header: "Risk", width: 70 }], rows: SOD.map((x: string[]) => [...x]) },
  ];
}

// A GRC table task's sample, as a blank workpaper: the facts plus empty result columns.
export function sampleTable(g: any): Table {
  const keys: string[] = [...new Set<string>(g.rows.flatMap((r: any) => (r.kv ?? []).map(([k]: string[]) => k)))];
  return {
    name: `${g.id} sample`,
    columns: [{ header: "Item", width: 26 }, ...keys.map(k => ({ header: k, width: 22 })), { header: "Conclusion", width: 18 }, { header: "Notes", width: 40 }],
    rows: g.rows.map((r: any) => [r.name, ...keys.map(k => (r.kv ?? []).find(([kk]: string[]) => kk === k)?.[1] ?? ""), "", ""]),
  };
}

// Populations an auditor samples from. Finance and employment records load on demand.
export async function auditPopulations(): Promise<Table[]> {
  const rec = await company().loadRecords();
  const f = rec.finance();
  const users = S.users as Record<string, any>;
  const nm = (id: string) => users[id]?.name ?? id;
  const vendor = new Map(f.vendors.map(v => [v.id, v]));
  const inPeriod = (d?: string) => !!d && d >= f.period.from && d <= f.period.to;
  const emp = Object.entries(f.employment);
  return [
    { name: "Users", columns: [{ header: "Username" }, { header: "Name", width: 22 }, { header: "Employee ID", width: 12 }, { header: "Type", width: 12 }, { header: "Status", width: 10 },
        { header: "Department", width: 14 }, { header: "Title", width: 22 }, { header: "Manager", width: 24 }, { header: "Hire date", kind: "date" }, { header: "Termination date", kind: "date" },
        { header: "Last sign-in", width: 14 }, { header: "Groups", kind: "number", width: 8 }, { header: "Privileged", width: 10 }],
      rows: Object.values(users).map(u => [u.id, u.name, u.empId, u.type, status(u), u.dept, u.title, u.mgr, f.employment[u.id]?.hired ?? "", f.employment[u.id]?.left ?? "",
        lastSeen(u.last), u.groups.length, u.groups.some((g: string) => g.startsWith("ROLE-")) ? "Yes" : "No"]) },
    { name: "Joiners", columns: [{ header: "Name", width: 22 }, { header: "Employee ID", width: 12 }, { header: "Department", width: 14 }, { header: "Title", width: 22 }, { header: "Hire date", kind: "date" }],
      rows: emp.filter(([, e]) => inPeriod(e.hired)).map(([id, e]) => [nm(id), users[id].empId, users[id].dept, users[id].title, e.hired]).sort((a, b) => String(a[4]).localeCompare(String(b[4]))) },
    { name: "Leavers", columns: [{ header: "Name", width: 22 }, { header: "Employee ID", width: 12 }, { header: "Department", width: 14 }, { header: "Title", width: 22 }, { header: "Termination date", kind: "date" }, { header: "Account status now", width: 16 }],
      rows: emp.filter(([, e]) => inPeriod(e.left)).map(([id, e]) => [nm(id), users[id].empId, users[id].dept, users[id].title, e.left!, status(users[id])]).sort((a, b) => String(a[4]).localeCompare(String(b[4]))) },
    { name: "Vendors", columns: [{ header: "Vendor ID", width: 12 }, { header: "Name", width: 28 }, { header: "Category", width: 16 }, { header: "Risk", width: 8 }, { header: "SOC report", width: 16 },
        { header: "Owner", width: 22 }, { header: "Created by", width: 22 }, { header: "Created", kind: "date" }, { header: "Status", width: 10 }],
      rows: f.vendors.map(v => [v.id, v.name, v.category, v.risk, v.soc, nm(v.owner), nm(v.createdBy), v.created, v.status]) },
    { name: "Purchase orders", columns: [{ header: "PO", width: 14 }, { header: "Date", kind: "date" }, { header: "Vendor ID", width: 12 }, { header: "Vendor", width: 28 }, { header: "Requester", width: 22 },
        { header: "Approver", width: 22 }, { header: "Approved", kind: "date" }, { header: "Lines", kind: "number", width: 7 }, { header: "Description", width: 34 }, { header: "Total", kind: "money" }],
      rows: f.pos.map(p => [p.id, p.date, p.vendor, vendor.get(p.vendor)!.name, nm(p.requester), nm(p.approver), p.approved, p.lines.length, p.lines.map(l => l.desc).join("; "), p.totalCents]) },
    { name: "Invoices", columns: [{ header: "AP document", width: 14 }, { header: "Vendor invoice no.", width: 16 }, { header: "Date", kind: "date" }, { header: "Vendor ID", width: 12 }, { header: "Vendor", width: 28 },
        { header: "PO", width: 14 }, { header: "Entered by", width: 22 }, { header: "Approved by", width: 22 }, { header: "Amount", kind: "money" }, { header: "Paid", kind: "date" }],
      rows: f.invoices.map(i => [i.id, i.number, i.date, i.vendor, vendor.get(i.vendor)!.name, i.po, nm(i.enteredBy), nm(i.approvedBy), i.amountCents, i.paid ?? ""]) },
    { name: "Monthly metrics", columns: [{ header: "Month", width: 10 }, ...f.metricDefs.map(d => ({ header: d.unit === "bps" ? `${d.label} (%)` : d.label, kind: d.unit === "cents" ? "money" as const : "number" as const, width: 16 }))],
      rows: f.metrics.map(m => [m.month, ...f.metricDefs.map(d => d.unit === "bps" ? m.values[d.key] / 100 : m.values[d.key])]) },
  ];
}
