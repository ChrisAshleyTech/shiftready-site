// Coastline Credit Union: vendors, purchase orders, invoices and monthly balance-sheet metrics.
import { BASE, buildUsers } from "./company";
import { buildFinance, type Finance, type FinanceSpec } from "../lib/finance";
import type { User } from "../lib/people";
import { dayIso, int } from "../lib/util";

const WORDS = ["Anchorage", "Beacon Hill", "Coralline", "Driftwood", "Estuary", "Foghorn", "Gullwing", "Heron", "Inlet", "Jetty",
  "Keel", "Leeward", "Mariner", "Nautilus", "Otterbay", "Pelican", "Quayside", "Riptide", "Sandpiper", "Tidewater", "Undertow", "Windward"];

function spec(users: Record<string, User>): FinanceSpec {
  const ids = (rk: string) => Object.values(users).filter(u => `${u.dept}|${u.title}` === rk && !u.preHire && u.enabled).map(u => u.id);
  const reportsTo = (name: string) => Object.values(users).filter(u => u.mgr === name && u.enabled).map(u => u.id);
  return {
    seed: 7404, prefix: "CCU", base: BASE, words: WORDS,
    limits: { "President and CEO": 1_000_000, "Chief Financial Officer": 250_000, "Chief Operating Officer": 150_000, "Chief Lending Officer": 100_000,
      Controller: 50_000, "IT Manager": 40_000, "HR Manager": 25_000, "Lending Manager": 20_000, "BSA Officer": 15_000, "Branch Manager": 10_000, "Payments Supervisor": 10_000 },
    categories: [
      { key: "card", label: "Card processing", nouns: ["Card Services", "Payment Processing"], vendors: 2, perMonth: [1, 1], amount: [18000, 42000], items: ["Debit card processing, monthly", "Card fraud monitoring", "Card reissue batch"], requesters: ["Operations|Card Services Specialist"], risk: "High", soc: "SOC 1 Type II" },
      { key: "core-it", label: "Core and digital banking", nouns: ["Financial Technology", "Data Services", "Digital Banking"], vendors: 3, perMonth: [1, 2], amount: [6000, 38000], items: ["Core processing, monthly", "Online banking platform", "Mobile deposit licenses"], requesters: ["IT|IT Manager", "IT|Digital Banking Specialist"], risk: "High", soc: "SOC 2 Type II" },
      { key: "cash", label: "Cash logistics and ATMs", nouns: ["Armored Services", "ATM Services"], vendors: 2, perMonth: [2, 3], amount: [1500, 9000], items: ["Armored courier, weekly", "ATM first-line maintenance", "Vault cash order handling"], requesters: ["Branch|Branch Manager", "Branch|Head Teller"], risk: "Medium", soc: "SOC 1 Type II" },
      { key: "branch", label: "Branch facilities", nouns: ["Facility Services", "Building Maintenance", "Security Systems"], vendors: 3, perMonth: [2, 3], amount: [600, 8500], items: ["Janitorial, monthly", "Alarm monitoring", "HVAC service", "Drive-up window repair"], requesters: ["Branch|Teller", "Branch|Member Service Representative"], risk: "Low", soc: "None" },
      { key: "statements", label: "Statements and printing", nouns: ["Print and Mail", "Document Services"], vendors: 2, perMonth: [1, 1], amount: [3000, 9000], items: ["Member statements, monthly", "Notice printing and mailing"], requesters: ["Operations|Card Services Specialist"], risk: "High", soc: "SOC 2 Type II" },
      { key: "collections", label: "Collections and legal", nouns: ["Recovery Services", "Law Group"], vendors: 2, perMonth: [0, 1], amount: [1500, 12000], items: ["Collection agency fees", "Repossession services", "Legal filing fees"], requesters: ["Lending|Collections Specialist"], risk: "Medium", soc: "None" },
      { key: "security", label: "IT security", nouns: ["Cyber Defense", "Security Services"], vendors: 2, perMonth: [1, 1], amount: [3000, 24000], items: ["Managed detection and response", "Penetration test", "Phishing simulation licenses"], requesters: ["IT|IT Manager"], risk: "High", soc: "SOC 2 Type II" },
      { key: "marketing", label: "Marketing", nouns: ["Creative", "Media"], vendors: 2, perMonth: [1, 1], amount: [1000, 9000], items: ["Auto-loan campaign", "Community event sponsorship", "Direct mail"], requesters: ["Marketing|Marketing Coordinator"], risk: "Low", soc: "None" },
      { key: "professional", label: "Professional services", nouns: ["CPAs", "Advisory", "Compliance Partners"], vendors: 3, perMonth: [0, 1], amount: [6000, 45000], items: ["Supervisory committee audit", "BSA independent test", "Loan review"], requesters: ["Finance|Controller"], risk: "Medium", soc: "None" },
      { key: "payroll", label: "Payroll and benefits", nouns: ["Payroll Services", "Benefits Administration"], vendors: 2, perMonth: [1, 1], amount: [3500, 10000], items: ["Payroll processing, monthly", "Benefits administration fee"], requesters: ["HR|HR Manager"], risk: "High", soc: "SOC 1 Type II" },
      { key: "office", label: "Office supplies", nouns: ["Office Supply", "Business Forms"], vendors: 2, perMonth: [1, 2], amount: [150, 2500], items: ["Office supplies", "Deposit slips", "Toner"], requesters: ["Branch|Member Service Representative", "HR|HR Generalist"], risk: "Low", soc: "None" },
    ],
    apEntry: ids("Finance|AP Specialist"),
    apApprove: ["martina.kovac", "kwame.asante"],
    vendorAdmins: ["joel.sandoval"],
    employment: { "diego.salcedo": { left: dayIso(BASE, -8) }, "howard.teague": { left: "2026-07-31" }, "colton.reyes": { left: dayIso(BASE, 0) } },
    plant: {
      split: { requester: ids("Branch|Teller").filter(id => users[id].mgr === "Patrice Duval")[1], category: "branch" },
      duplicate: { category: "card" },
      overPo: { category: "core-it" },
      // Martina Kovac holds vendor master access on top of AP approval (an SoD finding in the directory).
      vendorSod: { user: "martina.kovac", requester: "dennis.mulroney", category: "security" },
      approval: { kind: "approval-after-termination", approver: "howard.teague", requester: reportsTo("Howard Teague").filter(id => users[id].type === "Employee")[0], category: "branch" },
    },
    metrics: {
      defs: [
        { key: "membersStart", label: "Members, start of month", unit: "count" },
        { key: "newMembers", label: "New members", unit: "count" },
        { key: "closedMembers", label: "Closed memberships", unit: "count" },
        { key: "membersEnd", label: "Members, end of month", unit: "count" },
        { key: "depositsCents", label: "Member deposits (shares)", unit: "cents" },
        { key: "loansCents", label: "Loans outstanding", unit: "cents" },
        { key: "delinquentLoansCents", label: "Loans 60+ days delinquent", unit: "cents" },
        { key: "delinquencyBps", label: "Delinquency rate", unit: "bps" },
        { key: "loanToShareBps", label: "Loan-to-share ratio", unit: "bps" },
      ],
      // About $410M in deposits: typical for a 120-person, three-branch credit union.
      gen: (i, r, prev) => {
        const membersStart = prev ? prev.membersEnd : 38_420;
        const newMembers = 260 + int(r, -40, 60), closedMembers = 190 + int(r, -30, 40);
        const depositsCents = (prev ? prev.depositsCents : 41_000_000_000) + int(r, -150_000_000, 400_000_000);
        const loansCents = (prev ? prev.loansCents : 31_500_000_000) + int(r, 50_000_000, 350_000_000);
        const delinquentLoansCents = Math.round(loansCents * (0.0072 + r() * 0.0025));
        return { membersStart, newMembers, closedMembers, membersEnd: membersStart + newMembers - closedMembers, depositsCents, loansCents, delinquentLoansCents,
          delinquencyBps: Math.round((delinquentLoansCents / loansCents) * 10000), loanToShareBps: Math.round((loansCents / depositsCents) * 10000) };
      },
    },
  };
}

export function metricRules(rows: Finance["metrics"]): string[] {
  return rows.flatMap(({ month, values: v }, i) => [
    v.membersEnd === v.membersStart + v.newMembers - v.closedMembers || `${month}: membership doesn't roll forward`,
    i === 0 || v.membersStart === rows[i - 1].values.membersEnd || `${month}: opening members don't match last month`,
    v.delinquencyBps === Math.round((v.delinquentLoansCents / v.loansCents) * 10000) || `${month}: delinquency rate doesn't match`,
    v.loanToShareBps === Math.round((v.loansCents / v.depositsCents) * 10000) || `${month}: loan-to-share ratio doesn't match`,
  ].filter((x): x is string => typeof x === "string"));
}

export const IAM_KEY = [
  { kind: "sod", user: "martina.kovac", note: "AP approval plus vendor master: could create a vendor and pay it." },
  { kind: "excess", user: "martina.kovac", note: "Vendor master isn't part of the Controller role." },
  { kind: "sod", user: "rosa.villanueva", note: "Head teller who can initiate and approve wires." },
  { kind: "excess", user: "rosa.villanueva", note: "Wire approval isn't part of the Head Teller role." },
  { kind: "sod", user: "trevor.boateng", note: "Loan officer who can approve loans." },
  { kind: "excess", user: "trevor.boateng", note: "Loan approval isn't part of the Loan Officer role." },
  { kind: "sod", user: "lucia.bianchi", note: "Can change member contact details and issue cards." },
  { kind: "excess", user: "lucia.bianchi", note: "Card management isn't part of the Member Service Representative role." },
  { kind: "excess", user: "vivienne.strand", note: "Loan servicing and collections aren't part of the Loan Officer role." },
  { kind: "dormant", user: "gordon.pell", note: "Enabled; no sign-in for 188 days." },
  { kind: "dormant", user: "yvette.lambert", note: "Enabled teller account; no sign-in for 104 days." },
  { kind: "leaver-active", user: "diego.salcedo", note: "Payments specialist who resigned eight days ago; still enabled and signing in." },
  { kind: "leaver-active", user: "howard.teague", note: "Retired Jul 31; still enabled, and approved a purchase order after leaving." },
] as const;

let cache: Finance | null = null;
export function finance(): Finance { return cache ??= buildFinance(spec(buildUsers()), buildUsers()); }
