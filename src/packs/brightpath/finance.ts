// Brightpath SaaS: vendors, purchase orders, invoices and monthly subscription metrics.
import { BASE, buildUsers } from "./company";
import { buildFinance, type Finance, type FinanceSpec } from "../lib/finance";
import type { User } from "../lib/people";
import { dayIso, int } from "../lib/util";

const WORDS = ["Arclight", "Bramble", "Cobaltine", "Dovetail", "Everstack", "Fathom", "Gridwise", "Halcyon", "Inkwell", "Jetstream",
  "Kinetica", "Lumen", "Mosaic", "Nimbus", "Orbital", "Parallax", "Quasar", "Relay", "Sparrow", "Tandem", "Uplift", "Vector"];

function spec(users: Record<string, User>): FinanceSpec {
  const ids = (rk: string) => Object.values(users).filter(u => `${u.dept}|${u.title}` === rk && !u.preHire && u.enabled).map(u => u.id);
  return {
    seed: 7505, prefix: "BP", base: BASE, words: WORDS,
    limits: { "Chief Executive Officer": 1_000_000, "Chief Financial Officer": 250_000, "Chief Technology Officer": 150_000, Controller: 50_000,
      "Head of Security": 40_000, "Engineering Manager": 25_000, "Sales Director": 25_000, "Support Manager": 15_000, "Marketing Manager": 15_000,
      "People Operations Lead": 15_000, "IT Administrator": 10_000 },
    categories: [
      { key: "cloud", label: "Cloud hosting", nouns: ["Cloud", "Compute", "Hosting"], vendors: 2, perMonth: [1, 1], amount: [60000, 95000], items: ["Cloud infrastructure, monthly commit", "Managed database, monthly", "CDN and egress"], requesters: ["Engineering|Site Reliability Engineer"], risk: "High", soc: "SOC 2 Type II" },
      { key: "saas", label: "Software subscriptions", nouns: ["Software", "Labs", "Systems"], vendors: 8, perMonth: [3, 5], amount: [800, 22000], items: ["Observability seats", "Source control seats", "Design tool seats", "Support desk seats", "CRM seats", "Password manager seats"], requesters: ["Engineering|Engineering Manager", "Product|Product Designer", "Customer Success|Support Manager", "Sales|Sales Director"], risk: "Medium", soc: "SOC 2 Type II" },
      { key: "security", label: "Security services", nouns: ["Security", "Cyber Labs"], vendors: 3, perMonth: [0, 1], amount: [5000, 38000], items: ["Annual penetration test", "Bug bounty platform", "SOC 2 audit readiness"], requesters: ["Security|Head of Security"], risk: "High", soc: "SOC 2 Type II" },
      { key: "hardware", label: "Laptops and devices", nouns: ["Devices", "Hardware"], vendors: 2, perMonth: [1, 2], amount: [1800, 14000], items: ["Engineering laptops", "Monitors", "Docking stations"], requesters: ["IT|IT Support Specialist", "IT|IT Administrator"], risk: "Low", soc: "None" },
      { key: "marketing", label: "Marketing", nouns: ["Media", "Creative", "Events"], vendors: 3, perMonth: [1, 2], amount: [2000, 14000], items: ["Paid search", "Webinar platform", "Conference booth", "Content agency retainer"], requesters: ["Marketing|Marketing Manager"], risk: "Low", soc: "None" },
      { key: "recruiting", label: "Recruiting", nouns: ["Talent", "Recruiting Partners"], vendors: 2, perMonth: [0, 1], amount: [4000, 14000], items: ["Contingency search fee", "Job board package", "Background checks"], requesters: ["People|Recruiter"], risk: "Medium", soc: "None" },
      { key: "contractors", label: "Engineering contractors", nouns: ["Dev Partners", "Engineering Studio"], vendors: 2, perMonth: [1, 1], amount: [8000, 24000], items: ["Contract engineering, monthly", "Mobile app sprint"], requesters: ["Engineering|Engineering Manager"], risk: "Medium", soc: "None" },
      { key: "office", label: "Office and workplace", nouns: ["Workspace", "Office Supply"], vendors: 2, perMonth: [1, 1], amount: [300, 6000], items: ["Coworking memberships", "Office snacks", "Team offsite venue"], requesters: ["People|People Operations Lead"], risk: "Low", soc: "None" },
      { key: "professional", label: "Professional services", nouns: ["CPAs", "Law Group", "Advisory"], vendors: 3, perMonth: [0, 1], amount: [6000, 45000], items: ["SOC 2 Type II audit", "Commercial contract review", "Tax provision"], requesters: ["Finance|Controller"], risk: "Medium", soc: "None" },
      { key: "payroll", label: "Payroll and benefits", nouns: ["Payroll", "Benefits"], vendors: 2, perMonth: [1, 1], amount: [4000, 11000], items: ["Payroll processing, monthly", "Benefits administration fee"], requesters: ["People|People Operations Lead"], risk: "High", soc: "SOC 1 Type II" },
    ],
    apEntry: ids("Finance|Accountant"),
    apApprove: ["yolanda.reyes"],
    vendorAdmins: ["bjorn.eklund"],
    employment: { "sienna.park": { left: dayIso(BASE, -5) }, "hana.kobayashi": { left: dayIso(BASE, 0) } },
    plant: {
      split: { requester: ids("Engineering|Site Reliability Engineer").filter(id => id !== "hana.kobayashi")[1], category: "saas" },
      duplicate: { category: "saas" },
      overPo: { category: "saas" },
      // Yolanda Reyes holds vendor master access on top of AP approval (an SoD finding in the directory).
      vendorSod: { user: "yolanda.reyes", requester: "adrienne.cole", category: "security" },
      approval: { kind: "approval-over-limit", approver: "tamsin.okoro", requester: ids("Engineering|Software Engineer").filter(id => users[id].mgr === "Tamsin Okoro")[1], category: "contractors" },
    },
    metrics: {
      defs: [
        { key: "mrrStartCents", label: "MRR, start of month", unit: "cents" },
        { key: "newMrrCents", label: "New MRR", unit: "cents" },
        { key: "expansionMrrCents", label: "Expansion MRR", unit: "cents" },
        { key: "churnedMrrCents", label: "Churned MRR", unit: "cents" },
        { key: "mrrEndCents", label: "MRR, end of month", unit: "cents" },
        { key: "customersStart", label: "Customers, start of month", unit: "count" },
        { key: "newCustomers", label: "New customers", unit: "count" },
        { key: "churnedCustomers", label: "Churned customers", unit: "count" },
        { key: "customersEnd", label: "Customers, end of month", unit: "count" },
        { key: "uptimeBps", label: "Uptime", unit: "bps" },
        { key: "supportTickets", label: "Support tickets", unit: "count" },
      ],
      // About $1.4M MRR (~$17M ARR), growing: in line with a 115-person SaaS company.
      gen: (i, r, prev) => {
        const mrrStartCents = prev ? prev.mrrEndCents : 138_000_000;
        const newMrrCents = 4_800_000 + int(r, -800_000, 1_400_000), expansionMrrCents = 2_200_000 + int(r, -500_000, 700_000);
        const churnedMrrCents = 2_600_000 + int(r, -600_000, 900_000);
        const customersStart = prev ? prev.customersEnd : 1_240;
        const newCustomers = 38 + int(r, -8, 10), churnedCustomers = 17 + int(r, -5, 7);
        return { mrrStartCents, newMrrCents, expansionMrrCents, churnedMrrCents, mrrEndCents: mrrStartCents + newMrrCents + expansionMrrCents - churnedMrrCents,
          customersStart, newCustomers, churnedCustomers, customersEnd: customersStart + newCustomers - churnedCustomers,
          uptimeBps: i === 4 ? 9981 : 9995 + int(r, -3, 4), supportTickets: 2_900 + i * 25 + int(r, -150, 150) };
      },
    },
  };
}

export function metricRules(rows: Finance["metrics"]): string[] {
  return rows.flatMap(({ month, values: v }, i) => [
    v.mrrEndCents === v.mrrStartCents + v.newMrrCents + v.expansionMrrCents - v.churnedMrrCents || `${month}: MRR doesn't roll forward`,
    i === 0 || v.mrrStartCents === rows[i - 1].values.mrrEndCents || `${month}: opening MRR doesn't match last month`,
    v.customersEnd === v.customersStart + v.newCustomers - v.churnedCustomers || `${month}: customers don't roll forward`,
    i === 0 || v.customersStart === rows[i - 1].values.customersEnd || `${month}: opening customers don't match last month`,
    v.uptimeBps <= 10000 || `${month}: uptime above 100%`,
  ].filter((x): x is string => typeof x === "string"));
}

export const IAM_KEY = [
  { kind: "sod", user: "yolanda.reyes", note: "AP approval plus vendor master: could create a vendor and pay it." },
  { kind: "excess", user: "yolanda.reyes", note: "Vendor master isn't part of the Controller role." },
  { kind: "sod", user: "noah.lindqvist", note: "Can approve code reviews and deploy to production." },
  { kind: "excess", user: "noah.lindqvist", note: "Production deploy isn't part of the Senior Software Engineer role." },
  { kind: "sod", user: "ines.carvalho", note: "Production admin who can also administer the SIEM." },
  { kind: "excess", user: "ines.carvalho", note: "SIEM admin isn't part of the SRE role." },
  { kind: "sod", user: "kai.mahoe", note: "Identity provider admin with HR system access." },
  { kind: "excess", user: "kai.mahoe", note: "HR system access isn't part of the IT Administrator role." },
  { kind: "excess", user: "zoe.whitman", note: "Customer impersonation isn't part of the Customer Success Manager role." },
  { kind: "excess", user: "seraphina.holt", note: "Production deploy and the support desk aren't part of the Software Engineer role." },
  { kind: "dormant", user: "chris.albrecht", note: "Enabled; no sign-in for 131 days." },
  { kind: "dormant", user: "lorenzo.gatti", note: "Enabled engineer account; no sign-in for 95 days." },
  { kind: "leaver-active", user: "sienna.park", note: "Resigned five days ago; still enabled and signed in yesterday." },
] as const;

let cache: Finance | null = null;
export function finance(): Finance { return cache ??= buildFinance(spec(buildUsers()), buildUsers()); }
