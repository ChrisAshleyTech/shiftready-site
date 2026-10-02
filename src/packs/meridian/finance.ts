// Meridian Aerospace: vendors, purchase orders, invoices and monthly program metrics.
import { BASE, buildUsers } from "./company";
import { buildFinance, type Finance, type FinanceSpec } from "../lib/finance";
import type { User } from "../lib/people";
import { dayIso, int } from "../lib/util";

const WORDS = ["Anvil Ridge", "Blackwater", "Cinder", "Darrow", "Emberline", "Forgewell", "Graniteview", "Hartwell", "Ironvale", "Jessop",
  "Kingsley", "Lodestar", "Millbrook", "Northgate", "Osprey", "Pinecrest", "Quenby", "Ridgeway", "Stonefield", "Tolland", "Vale", "Westbrook"];

function spec(users: Record<string, User>): FinanceSpec {
  const ids = (rk: string) => Object.values(users).filter(u => `${u.dept}|${u.title}` === rk && !u.preHire && u.enabled).map(u => u.id);
  return {
    seed: 7303, prefix: "MA", base: BASE, words: WORDS,
    limits: { President: 1_000_000, "Chief Financial Officer": 250_000, "Procurement Manager": 150_000, "Engineering Manager": 50_000, Controller: 50_000,
      "IT Manager": 40_000, "Program Manager": 30_000, "HR Manager": 25_000, "Production Manager": 20_000, "Quality Manager": 20_000 },
    categories: [
      { key: "materials", label: "Raw materials", nouns: ["Metals", "Alloys", "Aerospace Materials"], vendors: 4, perMonth: [4, 6], amount: [8000, 95000], items: ["Aluminum 7075-T7351 plate", "Titanium 6Al-4V bar", "Aluminum 2024-T3 sheet", "Stainless 17-4PH bar"], requesters: ["Supply Chain|Buyer"], risk: "Medium", soc: "None" },
      { key: "outside-processing", label: "Outside processing", nouns: ["Finishing", "Heat Treating", "Plating"], vendors: 4, perMonth: [3, 5], amount: [1500, 22000], items: ["Anodize, Type II", "Heat treat and age", "Chemical conversion coat", "Penetrant inspection"], requesters: ["Supply Chain|Buyer"], risk: "Medium", soc: "None" },
      { key: "tooling", label: "Tooling", nouns: ["Tool Supply", "Cutting Tools", "Workholding"], vendors: 3, perMonth: [2, 4], amount: [600, 9000], items: ["Carbide end mills", "Inserts, assorted", "Vise jaws", "Tool holders"], requesters: ["Manufacturing|Machinist"], risk: "Low", soc: "None" },
      { key: "calibration", label: "Calibration", nouns: ["Metrology", "Calibration Labs"], vendors: 2, perMonth: [1, 1], amount: [800, 6000], items: ["Gauge calibration", "CMM service", "Torque wrench calibration"], requesters: ["Quality|Quality Inspector"], risk: "Low", soc: "None" },
      { key: "engineering-software", label: "Engineering software", nouns: ["Engineering Software", "Simulation"], vendors: 2, perMonth: [0, 1], amount: [5000, 45000], items: ["CAD seat renewal", "CAM post-processor", "FEA license"], requesters: ["Engineering|Design Engineer"], risk: "High", soc: "SOC 2 Type II" },
      { key: "it", label: "IT and security", nouns: ["Secure Cloud", "Cyber Services", "Networks"], vendors: 4, perMonth: [1, 2], amount: [2000, 38000], items: ["Government cloud email licenses", "Endpoint detection", "SIEM log storage", "Network switches"], requesters: ["IT|IT Manager", "IT|Security Analyst"], risk: "High", soc: "FedRAMP Moderate" },
      { key: "facilities", label: "Facilities", nouns: ["Facility Services", "Industrial Maintenance"], vendors: 3, perMonth: [1, 2], amount: [900, 14000], items: ["Compressor service", "Coolant disposal", "Crane inspection", "Janitorial, monthly"], requesters: ["Manufacturing|Production Manager"], risk: "Low", soc: "None" },
      { key: "freight", label: "Freight", nouns: ["Freight", "Logistics"], vendors: 2, perMonth: [1, 2], amount: [400, 5000], items: ["Outbound freight, flight parts", "Inbound material freight"], requesters: ["Supply Chain|Receiving Clerk"], risk: "Low", soc: "None" },
      { key: "professional", label: "Professional services", nouns: ["Advisory", "Compliance Partners", "CPAs"], vendors: 3, perMonth: [0, 1], amount: [6000, 48000], items: ["CMMC readiness assessment", "Export compliance review", "Year-end audit fieldwork"], requesters: ["Finance|Controller"], risk: "Medium", soc: "None" },
      { key: "payroll", label: "Payroll and benefits", nouns: ["Payroll Services", "Benefits Administration"], vendors: 2, perMonth: [1, 1], amount: [3500, 10000], items: ["Payroll processing, monthly", "Benefits administration fee"], requesters: ["HR|HR Manager"], risk: "High", soc: "SOC 1 Type II" },
      { key: "office", label: "Office supplies", nouns: ["Office Supply", "Print and Mail"], vendors: 1, perMonth: [1, 1], amount: [150, 2000], items: ["Office supplies", "Toner", "Controlled-document binders"], requesters: ["HR|HR Generalist"], risk: "Low", soc: "None" },
    ],
    apEntry: ids("Finance|AP Specialist"),
    apApprove: ["oscar.lindahl", "ruth.kaminski"],
    vendorAdmins: ["miriam.hollander"],
    employment: { "curtis.langley": { left: dayIso(BASE, -6) }, "dmitri.volkov": { left: dayIso(BASE, 0) } },
    plant: {
      split: { requester: "ethan.calloway", category: "outside-processing" },
      duplicate: { category: "materials" },
      overPo: { category: "outside-processing" },
      // Ruth Kaminski holds vendor master access on top of AP approval (an SoD finding in the directory).
      vendorSod: { user: "ruth.kaminski", requester: "joy.adeleke", category: "outside-processing" },
      approval: { kind: "approval-over-limit", approver: "raymond.cho", requester: ids("Manufacturing|Machinist")[3], category: "tooling" },
    },
    metrics: {
      defs: [
        { key: "backlogStartCents", label: "Contract backlog, start of month", unit: "cents" },
        { key: "bookingsCents", label: "New orders booked", unit: "cents" },
        { key: "revenueCents", label: "Revenue", unit: "cents" },
        { key: "backlogEndCents", label: "Contract backlog, end of month", unit: "cents" },
        { key: "partsShipped", label: "Parts shipped", unit: "count" },
        { key: "firstPassYieldBps", label: "First-pass yield", unit: "bps" },
        { key: "onTimeDeliveryBps", label: "On-time delivery", unit: "bps" },
      ],
      // Lumpy bookings (large orders land a few times a year) against steady revenue.
      gen: (i, r, prev) => {
        // About $26M a year of revenue: realistic for a 115-person machine shop.
        const backlogStartCents = prev ? prev.backlogEndCents : 3_000_000_000;
        const bookingsCents = [2, 5, 9].includes(i) ? 600_000_000 + int(r, 0, 300_000_000) : 120_000_000 + int(r, 0, 120_000_000);
        const revenueCents = 220_000_000 + i * 1_500_000 + int(r, -12_000_000, 12_000_000);
        return { backlogStartCents, bookingsCents, revenueCents, backlogEndCents: backlogStartCents + bookingsCents - revenueCents,
          partsShipped: 3100 + i * 12 + int(r, -120, 120), firstPassYieldBps: 9350 + int(r, -120, 90), onTimeDeliveryBps: 9000 + int(r, -250, 200) };
      },
    },
  };
}

export function metricRules(rows: Finance["metrics"]): string[] {
  return rows.flatMap(({ month, values: v }, i) => [
    v.backlogEndCents === v.backlogStartCents + v.bookingsCents - v.revenueCents || `${month}: backlog doesn't roll forward`,
    i === 0 || v.backlogStartCents === rows[i - 1].values.backlogEndCents || `${month}: opening backlog doesn't match last month's close`,
    v.backlogEndCents > 0 || `${month}: negative backlog`,
  ].filter((x): x is string => typeof x === "string"));
}

export const IAM_KEY = [
  { kind: "sod", user: "ruth.kaminski", note: "AP approval plus vendor master: could create a supplier and pay it." },
  { kind: "excess", user: "ruth.kaminski", note: "Vendor master isn't part of the Controller role." },
  { kind: "sod", user: "ethan.calloway", note: "Can raise purchase orders and receive the goods." },
  { kind: "excess", user: "ethan.calloway", note: "Receiving isn't part of the Buyer role." },
  { kind: "sod", user: "tobias.renner", note: "Machinist who can sign off inspections of parts." },
  { kind: "excess", user: "tobias.renner", note: "Inspection sign-off isn't part of the Machinist role." },
  { kind: "sod", user: "aleksander.nowak", note: "Domain admin who can also administer the security logs." },
  { kind: "excess", user: "aleksander.nowak", note: "Security log admin isn't part of the Systems Administrator role." },
  { kind: "excess", user: "marguerite.ellison", note: "MES engineering and timekeeping approval aren't part of the Design Engineer role." },
  { kind: "dormant", user: "walter.kessler", note: "Enabled with CUI access; no sign-in for 143 days." },
  { kind: "dormant", user: "irene.papadakis", note: "Enabled; no sign-in for 92 days." },
  { kind: "leaver-active", user: "curtis.langley", note: "Resigned six days ago; still enabled and signed in two days ago." },
] as const;

let cache: Finance | null = null;
export function finance(): Finance { return cache ??= buildFinance(spec(buildUsers()), buildUsers()); }
