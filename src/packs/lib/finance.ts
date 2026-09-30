// Finance and operations data for a company pack: vendors, purchase orders, invoices, employment
// dates and 12 months of metrics (Oct 2025 to Sep 2026). Amounts are whole cents.
// Everything is generated from the directory, so requesters, approvers and AP staff are real
// people in the company with the right roles, and the monthly figures reconcile to the records.
// A few exceptions are planted on purpose for future audit and procurement work; detectFinance()
// finds them, and the pack tests check it finds nothing else.
import type { User } from "./people";
import { addDays, dayIso, int, monthEnd, monthOf, pick, rng, ymd, type Rng } from "./util";

export type Risk = "High" | "Medium" | "Low";
export type Vendor = { id: string; name: string; category: string; risk: Risk; soc: string; owner: string; createdBy: string; created: string; status: "Active" };
export type Line = { desc: string; qty: number; unitCents: number };
export type PO = { id: string; vendor: string; requester: string; approver: string; date: string; approved: string; lines: Line[]; totalCents: number };
export type Invoice = { id: string; number: string; vendor: string; po: string; date: string; enteredBy: string; approvedBy: string; amountCents: number; paid: string | null };
export type Employment = Record<string, { hired: string; left?: string }>;
export type MetricDef = { key: string; label: string; unit: "count" | "cents" | "pct" | "bps" | "days" };
export type MonthRow = { month: string; values: Record<string, number> };
export type ExceptionKind = "split-po" | "duplicate-invoice" | "vendor-sod" | "invoice-over-po" | "approval-over-limit" | "approval-after-termination";
export type FinanceException = { id: string; kind: ExceptionKind; note: string; pos?: string[]; invoices?: string[]; vendor?: string; user?: string };
export type Finance = {
  period: { from: string; to: string }; vendors: Vendor[]; pos: PO[]; invoices: Invoice[]; employment: Employment;
  limits: Record<string, number>; metricDefs: MetricDef[]; metrics: MonthRow[]; exceptions: FinanceException[];
};

export type Category = {
  key: string; label: string; nouns: string[]; vendors: number; perMonth: [number, number];
  amount: [number, number]; items: string[]; requesters: string[]; risk: Risk; soc: string;
};
type Plant = { requester: string; category: string };
export type FinanceSpec = {
  seed: number; prefix: string; base: Date; words: string[]; categories: Category[];
  // PO approval authority in dollars, by job title. Titles not listed can't approve.
  limits: Record<string, number>;
  apEntry: string[]; apApprove: string[]; vendorAdmins: string[];
  employment?: Record<string, { hired?: string; left?: string }>;
  plant: {
    split: Plant; duplicate: { category: string }; overPo: { category: string };
    vendorSod: Plant & { user: string };
    approval: Plant & { kind: "approval-over-limit" | "approval-after-termination"; approver: string };
  };
  metrics: { defs: MetricDef[]; gen: (i: number, r: Rng, prev: Record<string, number> | null, base: Record<string, number>) => Record<string, number> };
};

export const PERIOD = { from: "2025-10-01", to: "2026-09-30" };
export const MONTHS = Array.from({ length: 12 }, (_, i) => ymd(2025, 9 + i, 1).slice(0, 7));
// Orders start two months early, so October opens with invoices already in the pipeline.
const ORDER_MONTHS = ["2025-08", "2025-09", ...MONTHS];
const BASE_DEFS: MetricDef[] = [
  { key: "headcount", label: "Employees at month end", unit: "count" },
  { key: "contractors", label: "Contractors at month end", unit: "count" },
  { key: "poCount", label: "Purchase orders issued", unit: "count" },
  { key: "poValueCents", label: "Purchase order value", unit: "cents" },
  { key: "invoicedCents", label: "Invoices received", unit: "cents" },
  { key: "apPaidCents", label: "Accounts payable paid", unit: "cents" },
  { key: "openApCents", label: "Open accounts payable at month end", unit: "cents" },
];

const plainName = (mgr: string) => mgr.replace(/\s*\(.*\)$/, "");
const weekday = (s: string) => { const d = new Date(s + "T00:00:00Z").getUTCDay(); return d === 0 ? addDays(s, 1) : d === 6 ? addDays(s, 2) : s; };
const employedOn = (e: Employment, id: string, day: string) => { const x = e[id]; return !!x && x.hired <= day && (!x.left || x.left > day); };

export function employmentFor(users: Record<string, User>, base: Date, seed: number, over: FinanceSpec["employment"] = {}, tenured: string[] = []): Employment {
  const r = rng(seed ^ 0x5eed);
  const out: Employment = {};
  // Managers were hired by 2019, so the approval chain exists for the whole period.
  // So are the people in planted exceptions, so each exception happens while they work there.
  const managers = new Set([...Object.values(users).map(u => plainName(u.mgr)), ...tenured.map(id => users[id]?.name)]);
  for (const u of Object.values(users)) {
    if (u.type === "Service") continue;
    const o = over[u.id] ?? {};
    const today = dayIso(base, 0);
    let left = o.left;
    if (!left && !u.enabled && !u.preHire) left = dayIso(base, -(u.last ?? 400));
    // Hired before their last sign-in (and before they left), between 2011 and a week before Monday.
    const latest = u.preHire ? today : [dayIso(base, -((u.last ?? 0) + 7)), left ? addDays(left, -30) : today, managers.has(u.name) ? "2019-12-31" : today].sort()[0];
    const hired = o.hired ?? (u.preHire ? today : addDays("2011-01-03", int(r, 0, Math.max(0, daysBetween("2011-01-03", latest)))));
    out[u.id] = left ? { hired, left } : { hired };
  }
  return out;
}
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);

export function buildFinance(spec: FinanceSpec, users: Record<string, User>): Finance {
  const r = rng(spec.seed);
  const pl = spec.plant;
  const emp = employmentFor(users, spec.base, spec.seed, spec.employment,
    [pl.split.requester, pl.vendorSod.user, pl.vendorSod.requester, pl.approval.requester, pl.approval.approver]);
  const byName = new Map(Object.values(users).map(u => [u.name, u]));
  const limit = (id: string) => spec.limits[users[id]?.title] ?? 0;
  // Acting on a day needs employment and, for dormant accounts, a sign-in since then.
  const activeOn = (id: string, day: string) => employedOn(emp, id, day) && users[id].last != null && day <= dayIso(spec.base, -users[id].last!);
  const cat = (k: string) => spec.categories.find(c => c.key === k)!;
  const P = spec.prefix;

  // The first manager up the chain who is employed that day and may approve this amount.
  function approverFor(requester: string, cents: number, day: string) {
    let u = byName.get(plainName(users[requester].mgr));
    for (let hop = 0; u && hop < 10; hop++) {
      if (activeOn(u.id, day) && limit(u.id) * 100 >= cents) return u.id;
      u = byName.get(plainName(u.mgr));
    }
    throw new Error(`${P}: no approver for ${requester} at ${cents / 100}`);
  }
  const requestersFor = (c: Category, day: string) =>
    Object.values(users).filter(u => c.requesters.includes(`${u.dept}|${u.title}`) && activeOn(u.id, day)).map(u => u.id);

  // ---------- Vendors ----------
  const vendors: Vendor[] = [];
  const usedNames = new Set<string>();
  let vn = 1001;
  const words = [...spec.words];
  for (const c of spec.categories) {
    for (let k = 0; k < c.vendors; k++) {
      let name = "";
      do { name = `${pick(r, words)} ${pick(r, c.nouns)}`; } while (usedNames.has(name));
      usedNames.add(name);
      const createdBy = pick(r, spec.vendorAdmins);
      const drawn = r() < 0.85 ? addDays("2016-01-04", int(r, 0, 3400)) : addDays(PERIOD.from, int(r, 0, 200));
      const created = drawn < emp[createdBy].hired ? weekday(addDays(emp[createdBy].hired, int(r, 5, 60))) : drawn;
      const owners = Object.values(users).filter(u => c.requesters.includes(`${u.dept}|${u.title}`)).map(u => u.id);
      vendors.push({ id: `V-${P}-${vn++}`, name, category: c.key, risk: c.risk, soc: c.soc, owner: pick(r, owners),
        createdBy, created, status: "Active" });
    }
  }
  const vendorsIn = (c: string, day: string) => vendors.filter(v => v.category === c && v.created <= day && v.createdBy !== spec.plant.vendorSod.user);

  // ---------- Purchase orders ----------
  type Draft = Omit<PO, "id">;
  const drafts: Draft[] = [];
  const recent = new Map<string, string>(); // vendor|requester -> last PO date (avoids accidental split patterns)
  // Up to three lines. Earlier lines take a share as quantity x unit price; the last line is a
  // single unit carrying the exact remainder, so the lines always add up to the order total.
  const makeLines = (c: Category, cents: number): Line[] => {
    const n = cents < 200000 ? 1 : Math.min(int(r, 1, 3), c.items.length);
    const lines: Line[] = []; let left = cents;
    const descs = [...c.items].sort(() => r() - 0.5);
    for (let i = 0; i < n - 1; i++) {
      const qty = int(r, 2, 12), unit = Math.floor((left * (0.3 + r() * 0.3)) / qty);
      lines.push({ desc: descs[i % descs.length], qty, unitCents: unit });
      left -= qty * unit;
    }
    lines.push({ desc: descs[(n - 1) % descs.length], qty: 1, unitCents: left });
    return lines;
  };
  const total = (ls: Line[]) => ls.reduce((s, l) => s + l.qty * l.unitCents, 0);
  const addPO = (d: Omit<Draft, "totalCents">) => { const t = total(d.lines); drafts.push({ ...d, totalCents: t }); return drafts[drafts.length - 1]; };

  ORDER_MONTHS.forEach(month => {
    for (const c of spec.categories) {
      const n = int(r, c.perMonth[0], c.perMonth[1]);
      for (let k = 0; k < n; k++) {
        const date = weekday(`${month}-${String(int(r, 1, 26)).padStart(2, "0")}`);
        const vs = vendorsIn(c.key, date), rs = requestersFor(c, date);
        if (!vs.length || !rs.length) continue;
        const v = pick(r, vs), q = pick(r, rs);
        const key = `${v.id}|${q}`;
        if (recent.has(key) && daysBetween(recent.get(key)!, date) < 10) continue;
        recent.set(key, date);
        const cents = int(r, c.amount[0], c.amount[1]) * 100 + int(r, 0, 99);
        const lines = makeLines(c, cents);
        const approver = approverFor(q, total(lines), date);
        addPO({ vendor: v.id, requester: q, approver, date, approved: weekday(addDays(date, int(r, 0, 2))), lines });
      }
    }
  });

  const exceptions: FinanceException[] = [];
  const planted: { po: Draft; tag: string }[] = [];

  // Split PO: two orders on the same day, each just under the approver's limit.
  {
    const p = spec.plant.split, c = cat(p.category), date = weekday("2026-05-12");
    const approver = byName.get(plainName(users[p.requester].mgr))!.id, lim = limit(approver) * 100;
    const v = vendorsIn(c.key, date)[0];
    for (const f of [0.97, 0.935]) {
      const po = addPO({ vendor: v.id, requester: p.requester, approver, date, approved: date, lines: [{ desc: pick(r, c.items), qty: 1, unitCents: Math.round(lim * f) }] });
      planted.push({ po, tag: "split" });
    }
  }
  // Approval outside authority.
  {
    const p = spec.plant.approval, c = cat(p.category);
    const date = p.kind === "approval-after-termination" ? weekday(addDays(emp[p.approver].left!, 9)) : weekday("2026-03-17");
    const cents = p.kind === "approval-over-limit" ? limit(p.approver) * 100 * 3 + 4217 : int(r, c.amount[0], c.amount[1]) * 100;
    const po = addPO({ vendor: vendorsIn(c.key, date)[1].id, requester: p.requester, approver: p.approver, date, approved: date, lines: [{ desc: pick(r, c.items), qty: 1, unitCents: cents }] });
    planted.push({ po, tag: "approval" });
  }
  // Vendor created by someone who then approves its invoices.
  const sodVendor: Vendor = (() => {
    const p = spec.plant.vendorSod, c = cat(p.category);
    let name = ""; do { name = `${pick(r, words)} ${pick(r, c.nouns)}`; } while (usedNames.has(name)); usedNames.add(name);
    const v: Vendor = { id: `V-${P}-${vn++}`, name, category: c.key, risk: c.risk, soc: "None", owner: p.requester, createdBy: p.user, created: "2026-06-02", status: "Active" };
    vendors.push(v);
    for (const m of ["2026-06-09", "2026-07-14"]) {
      const cents = int(r, c.amount[0], c.amount[1]) * 100;
      const lines = [{ desc: pick(r, c.items), qty: 1, unitCents: cents }];
      planted.push({ po: addPO({ vendor: v.id, requester: p.requester, approver: approverFor(p.requester, cents, m), date: m, approved: m, lines }), tag: "vendorSod" });
    }
    return v;
  })();

  drafts.sort((a, b) => a.date.localeCompare(b.date) || a.vendor.localeCompare(b.vendor));
  let pn = 10001;
  const pos: PO[] = drafts.map(d => Object.assign(d, { id: `PO-${P}-${pn++}` }) as PO);

  // ---------- Invoices ----------
  const invoices: Invoice[] = [];
  const invNo = new Map<string, number>();
  const nextNo = (v: string) => { const n = (invNo.get(v) ?? int(r, 1000, 8000)) + int(r, 1, 40); invNo.set(v, n); return `INV-${n}`; };
  const entryFor = (d: string) => pick(r, spec.apEntry.filter(a => activeOn(a, d)));
  const approveFor = (v: Vendor, entered: string, d: string) => pick(r, spec.apApprove.filter(a => a !== entered && a !== v.createdBy && activeOn(a, d)));
  const vend = new Map(vendors.map(v => [v.id, v]));
  const payDate = (d: string) => { const p = weekday(addDays(d, int(r, 24, 34))); return p <= PERIOD.to ? p : null; };
  for (const po of pos) {
    const v = vend.get(po.vendor)!;
    const parts = po.totalCents > 1500000 && r() < 0.35 ? [Math.round(po.totalCents * (0.5 + r() * 0.2))] : [];
    parts.push(po.totalCents - parts.reduce((a, b) => a + b, 0));
    let d = po.approved;
    for (const amt of parts) {
      d = weekday(addDays(d, int(r, 6, 35)));
      if (d > PERIOD.to) break;
      const enteredBy = entryFor(d);
      const approvedBy = v.id === sodVendor.id ? spec.plant.vendorSod.user : enteredBy && approveFor(v, enteredBy, d);
      // Nobody who could enter or approve it was working that day: the bill waits, and the PO stays unbilled.
      if (!enteredBy || !approvedBy) break;
      invoices.push({ id: "", number: nextNo(v.id), vendor: v.id, po: po.id, date: d, enteredBy, approvedBy, amountCents: amt, paid: payDate(d) });
    }
  }
  // Duplicate invoice: the same bill entered twice with a suffix, both paid.
  {
    const c = spec.plant.duplicate.category;
    const orig = invoices.find(i => i.date >= "2026-02-01" && i.paid && vend.get(i.vendor)!.category === c && invoices.filter(j => j.po === i.po).length === 1)!;
    invoices.push({ ...orig, number: orig.number + "-A", date: weekday(addDays(orig.date, 16)), enteredBy: entryFor(orig.date), paid: weekday(addDays(orig.paid!, 13)) });
    exceptions.push({ id: "", kind: "duplicate-invoice", vendor: orig.vendor, invoices: [orig.number, orig.number + "-A"], note: "The same invoice was entered twice, once with a suffix, and both were paid." });
  }
  // Invoice over its purchase order.
  {
    const c = spec.plant.overPo.category;
    const inv = invoices.find(i => i.date >= "2026-04-01" && vend.get(i.vendor)!.category === c && invoices.filter(j => j.po === i.po).length === 1 && !exceptions.some(e => e.invoices?.includes(i.number)))!;
    inv.amountCents = Math.round(inv.amountCents * 1.12);
    exceptions.push({ id: "", kind: "invoice-over-po", vendor: inv.vendor, pos: [inv.po], invoices: [inv.number], note: "Invoiced 12% above the approved purchase order, and paid without a PO change." });
  }
  invoices.sort((a, b) => a.date.localeCompare(b.date) || a.number.localeCompare(b.number));
  let iv = 50001; for (const i of invoices) i.id = `AP-${P}-${iv++}`;

  const idsOf = (tag: string) => planted.filter(p => p.tag === tag).map(p => (p.po as PO).id);
  exceptions.unshift(
    { id: "", kind: "split-po", pos: idsOf("split"), user: spec.plant.split.requester, note: "Two orders to the same vendor on the same day, each just under the approver's limit; together they exceed it." },
    { id: "", kind: spec.plant.approval.kind, pos: idsOf("approval"), user: spec.plant.approval.approver,
      note: spec.plant.approval.kind === "approval-over-limit" ? "Approved by a manager whose approval limit is below the order value." : "Approved after the approver's termination date, so their account was still usable." },
    { id: "", kind: "vendor-sod", vendor: sodVendor.id, user: spec.plant.vendorSod.user, note: "The person who created this vendor also approved its invoices for payment." },
  );
  exceptions.forEach((e, i) => { e.id = `${P}-FX-${i + 1}`; });

  // ---------- Metrics ----------
  const metrics: MonthRow[] = [];
  let prev: Record<string, number> | null = null;
  const mr = rng(spec.seed ^ 0xabc);
  for (const month of MONTHS) {
    const end = monthEnd(month);
    const base: Record<string, number> = {
      headcount: Object.keys(emp).filter(id => users[id].type === "Employee" && employedOn(emp, id, end)).length,
      contractors: Object.keys(emp).filter(id => users[id].type === "Contractor" && employedOn(emp, id, end)).length,
      poCount: pos.filter(p => monthOf(p.date) === month).length,
      poValueCents: pos.filter(p => monthOf(p.date) === month).reduce((s, p) => s + p.totalCents, 0),
      invoicedCents: invoices.filter(i => monthOf(i.date) === month).reduce((s, i) => s + i.amountCents, 0),
      apPaidCents: invoices.filter(i => i.paid && monthOf(i.paid) === month).reduce((s, i) => s + i.amountCents, 0),
      openApCents: invoices.filter(i => i.date <= end && (!i.paid || i.paid > end)).reduce((s, i) => s + i.amountCents, 0),
    };
    const values: Record<string, number> = { ...base, ...spec.metrics.gen(metrics.length, mr, prev, base) };
    metrics.push({ month, values }); prev = values;
  }

  return { period: PERIOD, vendors, pos, invoices, employment: emp, limits: spec.limits,
    metricDefs: [...BASE_DEFS, ...spec.metrics.defs], metrics, exceptions };
}

// ---------- Audit detectors ----------
// What an auditor's analytics would flag. Used by the pack tests, and later by audit tickets.
export function detectFinance(f: Finance, users: Record<string, User>): { kind: ExceptionKind; key: string }[] {
  const out: { kind: ExceptionKind; key: string }[] = [];
  const lim = (id: string) => (f.limits[users[id]?.title] ?? 0) * 100;
  const norm = (n: string) => n.replace(/[^0-9]/g, "");
  // Duplicates: same vendor, amount and invoice number digits.
  const seen = new Map<string, Invoice>(); const dupes = new Set<string>();
  for (const i of f.invoices) {
    const k = `${i.vendor}|${i.amountCents}|${norm(i.number)}`;
    if (seen.has(k)) { out.push({ kind: "duplicate-invoice", key: i.vendor }); dupes.add(i.id); } else seen.set(k, i);
  }
  for (const po of f.pos) {
    const billed = f.invoices.filter(i => i.po === po.id && !dupes.has(i.id)).reduce((s, i) => s + i.amountCents, 0);
    if (billed > po.totalCents) out.push({ kind: "invoice-over-po", key: po.id });
    if (lim(po.approver) < po.totalCents) out.push({ kind: "approval-over-limit", key: po.id });
    const left = f.employment[po.approver]?.left;
    if (left && po.approved >= left) out.push({ kind: "approval-after-termination", key: po.id });
  }
  // Splits: same vendor and requester within 3 days, each under the approver's limit, together over it.
  const byVR = new Map<string, PO[]>();
  for (const po of f.pos) { const k = `${po.vendor}|${po.requester}`; byVR.set(k, [...(byVR.get(k) ?? []), po]); }
  for (const list of byVR.values()) for (let a = 0; a < list.length; a++) for (let b = a + 1; b < list.length; b++) {
    const x = list[a], y = list[b];
    if (Math.abs(daysBetween(x.date, y.date)) <= 3 && x.totalCents <= lim(x.approver) && y.totalCents <= lim(y.approver) && x.totalCents + y.totalCents > lim(x.approver))
      out.push({ kind: "split-po", key: `${x.id}+${y.id}` });
  }
  for (const v of f.vendors) if (f.invoices.some(i => i.vendor === v.id && i.approvedBy === v.createdBy)) out.push({ kind: "vendor-sod", key: v.id });
  return out;
}
