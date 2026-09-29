// Consistency checks every company pack must pass: a believable directory, an access matrix that
// only names real groups, finance records that reconcile, and exactly the planted findings.
import { describe, expect, test } from "vitest";
import { COMPANIES } from "../src/packs";
import { detectFinance, MONTHS } from "../src/packs/lib/finance";
import type { User } from "../src/packs/lib/people";
import { dayIso, monthEnd, monthOf } from "../src/packs/lib/util";

const plain = (m: string) => m.replace(/\s*\(.*\)$/, "");

for (const pack of COMPANIES) {
  describe(pack.name, async () => {
    const { company, policy } = (await pack.load()) as any;
    const rec = await pack.loadRecords();
    const users: Record<string, User> = company.buildUsers();
    const list = Object.values(users);
    const byName = new Map(list.map(u => [u.name, u]));
    const fin = rec.finance();
    const today = dayIso(company.BASE, 0);
    const activeOn = (id: string, d: string) => { const e = fin.employment[id], u = users[id];
      return !!e && e.hired <= d && (!e.left || e.left > d) && u.last != null && d <= dayIso(company.BASE, -u.last); };

    test("directory: 100 to 150 people with unique IDs", () => {
      expect(list.length).toBeGreaterThanOrEqual(100);
      expect(list.length).toBeLessThanOrEqual(150);
      expect(new Set(list.map(u => u.empId)).size).toBe(list.length);
      expect(new Set(list.map(u => u.name)).size).toBe(list.length);
      for (const u of list) expect(u.id, u.name).toMatch(/^[a-z0-9.-]+$/);
    });

    test("every manager exists and every chain reaches the top", () => {
      for (const u of list) {
        let cur: User | undefined = u;
        for (let hop = 0; cur && plain(cur.mgr) !== "Board of Directors"; hop++) {
          expect(hop, `${u.id}: manager chain loops`).toBeLessThan(12);
          const next = byName.get(plain(cur.mgr));
          expect(next, `${cur.id}: manager "${cur.mgr}" isn't in the directory`).toBeDefined();
          cur = next;
        }
      }
    });

    test("access matrix, SoD rules and memberships only name real groups", () => {
      const all = new Set<string>(company.ALL_GROUPS);
      for (const [rk, gs] of Object.entries(company.ROLES) as [string, string[]][]) for (const g of gs) expect(all.has(g), `${rk}: ${g}`).toBe(true);
      for (const [a, b, why] of company.SOD) { expect(all.has(a), a).toBe(true); expect(all.has(b), b).toBe(true); expect(why).toBeTruthy(); }
      for (const g of company.REQUESTABLE) expect(all.has(g), g).toBe(true);
      for (const u of list) {
        for (const g of u.groups) expect(all.has(g), `${u.id}: ${g}`).toBe(true);
        if (u.type !== "Service") expect(company.ROLES[`${u.dept}|${u.title}`], `${u.id}: no role ${u.dept}|${u.title}`).toBeDefined();
      }
    });

    test("HR feed names real people; policies have unique keys", () => {
      for (const e of company.HR_FEED) expect(byName.has(e.who), e.who).toBe(true);
      const keys = policy.POLICIES.map((p: any) => p.key);
      expect(new Set(keys).size).toBe(keys.length);
      for (const p of policy.POLICIES) { expect(p.title).toBeTruthy(); expect(p.html).toBeTruthy(); }
    });

    test("finance records name real people, in date order, adding up", () => {
      const ids = new Set(Object.keys(users));
      const pos = new Map(fin.pos.map(p => [p.id, p]));
      const vendors = new Map(fin.vendors.map(v => [v.id, v]));
      expect(fin.vendors.length).toBeGreaterThanOrEqual(25);
      for (const v of fin.vendors) {
        expect(ids.has(v.createdBy) && ids.has(v.owner), v.id).toBe(true);
        expect(v.created >= fin.employment[v.createdBy].hired, `${v.id} created before ${v.createdBy} was hired`).toBe(true);
      }
      for (const p of fin.pos) {
        expect(p.totalCents).toBe(p.lines.reduce((s, l) => s + l.qty * l.unitCents, 0));
        for (const l of p.lines) { expect(Number.isInteger(l.qty) && l.qty > 0).toBe(true); expect(Number.isInteger(l.unitCents) && l.unitCents >= 0).toBe(true); }
        expect(vendors.get(p.vendor)!.created <= p.date, `${p.id} before vendor existed`).toBe(true);
        expect(p.approved >= p.date).toBe(true);
        expect(activeOn(p.requester, p.date), `${p.id}: requester ${p.requester} not active`).toBe(true);
        const planted = fin.exceptions.some(e => e.kind === "approval-after-termination" && e.pos?.includes(p.id));
        if (!planted) expect(activeOn(p.approver, p.approved), `${p.id}: approver ${p.approver} not active`).toBe(true);
        expect(p.approver).not.toBe(p.requester);
      }
      for (const i of fin.invoices) {
        const p = pos.get(i.po)!;
        expect(p, i.id).toBeDefined();
        expect(i.vendor).toBe(p.vendor);
        expect(i.date >= p.approved, `${i.id} before its PO was approved`).toBe(true);
        if (i.paid) expect(i.paid >= i.date).toBe(true);
        expect(i.date <= fin.period.to && (!i.paid || i.paid <= fin.period.to)).toBe(true);
        expect(activeOn(i.enteredBy, i.date), `${i.id}: ${i.enteredBy} not active`).toBe(true);
        expect(activeOn(i.approvedBy, i.date), `${i.id}: ${i.approvedBy} not active`).toBe(true);
        expect(i.enteredBy).not.toBe(i.approvedBy);
      }
      expect(new Set(fin.invoices.map(i => i.id)).size).toBe(fin.invoices.length);
    });

    test("monthly metrics reconcile to the records and the directory", () => {
      expect(fin.metrics.map(m => m.month)).toEqual(MONTHS);
      for (const { month, values: v } of fin.metrics) {
        const end = monthEnd(month);
        const emp = (t: string) => Object.entries(fin.employment).filter(([id, e]) => users[id].type === t && e.hired <= end && (!e.left || e.left > end)).length;
        expect(v.headcount, month).toBe(emp("Employee"));
        expect(v.contractors, month).toBe(emp("Contractor"));
        const inMonth = fin.pos.filter(p => monthOf(p.date) === month);
        expect(v.poCount).toBe(inMonth.length);
        expect(v.poValueCents).toBe(inMonth.reduce((s, p) => s + p.totalCents, 0));
        expect(v.apPaidCents).toBe(fin.invoices.filter(i => i.paid && monthOf(i.paid) === month).reduce((s, i) => s + i.amountCents, 0));
        expect(v.openApCents).toBe(fin.invoices.filter(i => i.date <= end && (!i.paid || i.paid > end)).reduce((s, i) => s + i.amountCents, 0));
        for (const d of fin.metricDefs) expect(Number.isInteger(v[d.key]), `${month} ${d.key}`).toBe(true);
      }
      // Payables carry over into the first month, as they would at a real company.
      expect(fin.metrics[0].values.apPaidCents).toBeGreaterThan(0);
      expect(rec.metricRules(fin.metrics)).toEqual([]);
    });

    test("an auditor's analytics find exactly the planted finance exceptions", () => {
      const found = detectFinance(fin, users).map(d => d.kind).sort();
      expect(found).toEqual(fin.exceptions.map(e => e.kind).sort());
      expect(fin.exceptions.length).toBeGreaterThanOrEqual(5);
    });

    test("directory findings match the answer key exactly", () => {
      const req = new Set<string>(company.REQUESTABLE);
      const found = new Set<string>();
      for (const u of list) {
        if (u.type === "Service") continue;
        if (u.enabled && !u.preHire && (u.last ?? 0) > 90) found.add(`dormant ${u.id}`);
        if (company.SOD.some(([a, b]: string[]) => u.groups.includes(a) && u.groups.includes(b))) found.add(`sod ${u.id}`);
        const role: string[] = company.ROLES[`${u.dept}|${u.title}`] ?? [];
        if (u.enabled && u.groups.some(g => !role.includes(g) && !req.has(g))) found.add(`excess ${u.id}`);
        const left = fin.employment[u.id]?.left;
        if (u.enabled && left && left < today) found.add(`leaver-active ${u.id}`);
      }
      expect([...found].sort()).toEqual(rec.IAM_KEY.map(k => `${k.kind} ${k.user}`).sort());
    });
  });
}
