// Harbor Health Network: vendors, purchase orders, invoices and monthly clinic metrics.
import { BASE, buildUsers } from "./company";
import { buildFinance, type Finance, type FinanceSpec } from "../lib/finance";
import type { User } from "../lib/people";
import { dayIso, int } from "../lib/util";

const WORDS = ["Bayline", "Calloway", "Dunmore", "Everly", "Fairhaven", "Greystone", "Hollis", "Ivybridge", "Juniper", "Kestrel",
  "Lindell", "Meadowrun", "Norwell", "Oakhurst", "Prescott", "Quillan", "Rowan", "Seabrook", "Tamsin", "Upland", "Verity", "Wrenfield"];

function spec(users: Record<string, User>): FinanceSpec {
  const ids = (rk: string) => Object.values(users).filter(u => `${u.dept}|${u.title}` === rk && !u.preHire && u.enabled).map(u => u.id);
  return {
    seed: 7202, prefix: "HHN", base: BASE, words: WORDS,
    limits: { "Chief Executive Officer": 1_000_000, "Chief Financial Officer": 250_000, "Chief Medical Officer": 100_000, "Pharmacy Manager": 75_000,
      Controller: 50_000, "IT Director": 50_000, "Nurse Manager": 25_000, "HR Director": 25_000, "Facilities Manager": 15_000,
      "Revenue Cycle Manager": 10_000, "Patient Access Manager": 10_000 },
    categories: [
      { key: "medical-supplies", label: "Medical supplies", nouns: ["Medical Supply", "Clinical Products", "Surgical"], vendors: 5, perMonth: [5, 8], amount: [500, 18000], items: ["Exam gloves, nitrile", "IV start kits", "Wound care dressings", "Syringes, 3 mL", "Specimen collection kits"], requesters: ["Clinical|Registered Nurse", "Clinical|Nurse Manager"], risk: "Medium", soc: "None" },
      { key: "pharma", label: "Pharmaceuticals", nouns: ["Pharma Distribution", "Specialty Pharmacy", "Drug Wholesale"], vendors: 3, perMonth: [2, 4], amount: [5000, 60000], items: ["Vaccines, seasonal", "Antibiotics restock", "Controlled substance restock (Schedule II)", "Specialty infusion drugs"], requesters: ["Pharmacy|Pharmacist", "Pharmacy|Pharmacy Manager"], risk: "High", soc: "None" },
      { key: "staffing", label: "Clinical staffing", nouns: ["Nurse Staffing", "Clinical Staffing"], vendors: 2, perMonth: [1, 2], amount: [9000, 24000], items: ["Agency RN hours", "Travel nurse assignment"], requesters: ["Clinical|Nurse Manager"], risk: "Medium", soc: "None" },
      { key: "lab", label: "Reference laboratory", nouns: ["Diagnostics", "Reference Labs"], vendors: 2, perMonth: [1, 2], amount: [3000, 20000], items: ["Send-out lab testing", "Pathology services"], requesters: ["Clinical|Physician"], risk: "High", soc: "SOC 2 Type II" },
      { key: "imaging", label: "Imaging equipment service", nouns: ["Imaging Services", "Biomedical"], vendors: 2, perMonth: [0, 1], amount: [2500, 30000], items: ["X-ray tube replacement", "Ultrasound service contract", "Preventive maintenance visit"], requesters: ["Imaging|Radiologic Technologist"], risk: "Medium", soc: "None" },
      { key: "it", label: "IT and software", nouns: ["Health IT", "Cloud Services", "Networks"], vendors: 4, perMonth: [1, 2], amount: [2000, 40000], items: ["EHR hosting", "Clinical workstation refresh", "Secure messaging licenses", "Firewall support"], requesters: ["IT|IT Director", "IT|EHR Analyst"], risk: "High", soc: "SOC 2 Type II" },
      { key: "facilities", label: "Facilities", nouns: ["Facility Services", "Building Services", "Mechanical"], vendors: 3, perMonth: [1, 2], amount: [800, 12000], items: ["HVAC filter service", "Generator test", "Janitorial, monthly", "Elevator inspection"], requesters: ["Facilities|Facilities Technician", "Facilities|Facilities Manager"], risk: "Low", soc: "None" },
      { key: "waste", label: "Medical waste", nouns: ["Environmental", "Waste Services"], vendors: 2, perMonth: [1, 1], amount: [1200, 4800], items: ["Regulated medical waste pickup", "Sharps container service"], requesters: ["Facilities|Facilities Technician"], risk: "Low", soc: "None" },
      { key: "linen", label: "Linen and laundry", nouns: ["Linen", "Textile Care"], vendors: 1, perMonth: [1, 1], amount: [1500, 4000], items: ["Linen service, monthly", "Scrubs laundering"], requesters: ["Clinical|Nurse Manager"], risk: "Low", soc: "None" },
      { key: "office", label: "Office supplies", nouns: ["Office Supply", "Print and Mail"], vendors: 2, perMonth: [1, 1], amount: [150, 2400], items: ["Office supplies", "Patient statement printing", "Toner"], requesters: ["Patient Access|Patient Access Representative", "HR|HR Generalist"], risk: "Low", soc: "None" },
      { key: "professional", label: "Professional services", nouns: ["Compliance Advisors", "Law Group", "CPAs"], vendors: 2, perMonth: [0, 1], amount: [6000, 40000], items: ["HIPAA risk analysis", "Coding audit", "Year-end audit fieldwork"], requesters: ["Finance|Controller"], risk: "Medium", soc: "None" },
      { key: "payroll", label: "Payroll and benefits", nouns: ["Payroll Services", "Benefits Administration"], vendors: 2, perMonth: [1, 1], amount: [4000, 12000], items: ["Payroll processing, monthly", "Benefits administration fee"], requesters: ["HR|HR Director"], risk: "High", soc: "SOC 1 Type II" },
    ],
    apEntry: ids("Finance|AP Specialist"),
    apApprove: ["grace.liang", "daniel.ferreira"],
    vendorAdmins: ["hannah.brooks"],
    employment: { "maya.estrada": { left: dayIso(BASE, -10) }, "gregory.hale": { left: "2026-08-14" }, "victor.halvorsen": { left: dayIso(BASE, 0) } },
    plant: {
      split: { requester: ids("Clinical|Registered Nurse")[2], category: "medical-supplies" },
      duplicate: { category: "pharma" },
      overPo: { category: "it" },
      // Grace Liang holds vendor master access she shouldn't (an SoD finding in the directory).
      vendorSod: { user: "grace.liang", requester: "keisha.holloway", category: "medical-supplies" },
      approval: { kind: "approval-after-termination", approver: "gregory.hale", requester: ids("Facilities|Facilities Technician")[0], category: "facilities" },
    },
    metrics: {
      defs: [
        { key: "patientVisits", label: "Patient visits", unit: "count" },
        { key: "newPatients", label: "New patients", unit: "count" },
        { key: "telehealthVisits", label: "Telehealth visits", unit: "count" },
        { key: "noShowBps", label: "No-show rate", unit: "bps" },
        { key: "revenuePerVisitCents", label: "Net revenue per visit", unit: "cents" },
        { key: "netPatientRevenueCents", label: "Net patient revenue", unit: "cents" },
        { key: "daysInAr", label: "Days in accounts receivable", unit: "days" },
      ],
      // Respiratory season lifts winter volumes; telehealth grows slowly.
      gen: (i, r) => {
        const season = [1.02, 1.08, 1.14, 1.18, 1.1, 1.0, 0.95, 0.93, 0.9, 0.88, 0.94, 1.0][i];
        const patientVisits = Math.round(5200 * season + int(r, -80, 80));
        const newPatients = Math.round(patientVisits * (0.11 + r() * 0.03));
        const telehealthVisits = Math.round(patientVisits * (0.14 + i * 0.004 + r() * 0.01));
        const revenuePerVisitCents = 16_800 + i * 60 + int(r, -300, 300);
        return { patientVisits, newPatients, telehealthVisits, noShowBps: 700 + int(r, -90, 140), revenuePerVisitCents,
          netPatientRevenueCents: patientVisits * revenuePerVisitCents, daysInAr: 41 + int(r, -4, 6) };
      },
    },
  };
}

export function metricRules(rows: Finance["metrics"]): string[] {
  return rows.flatMap(({ month, values: v }) => [
    v.newPatients <= v.patientVisits || `${month}: more new patients than visits`,
    v.telehealthVisits <= v.patientVisits || `${month}: more telehealth visits than visits`,
    v.netPatientRevenueCents === v.patientVisits * v.revenuePerVisitCents || `${month}: revenue doesn't equal visits x revenue per visit`,
    (v.noShowBps > 0 && v.noShowBps < 2000) || `${month}: implausible no-show rate`,
  ].filter((x): x is string => typeof x === "string"));
}

export const IAM_KEY = [
  { kind: "sod", user: "grace.liang", note: "AP approval plus vendor master: could create a supplier and pay it." },
  { kind: "excess", user: "grace.liang", note: "Vendor master isn't part of the AP Manager role." },
  { kind: "sod", user: "jonathan.pike", note: "Can order and also dispense medications." },
  { kind: "excess", user: "jonathan.pike", note: "Pharmacy dispensing left over from a covering shift." },
  { kind: "sod", user: "wen.zhao", note: "EHR security admin who can also review the EHR audit trail." },
  { kind: "excess", user: "wen.zhao", note: "EHR audit reports aren't part of the EHR Analyst role." },
  { kind: "excess", user: "delphine.okafor", note: "Lab results access isn't part of the Medical Assistant role." },
  { kind: "excess", user: "tamara.lindsey", note: "EHR billing and finance reports aren't part of the Patient Access role." },
  { kind: "dormant", user: "theresa.quinlan", note: "Enabled; no sign-in for 121 days." },
  { kind: "dormant", user: "patrick.doyle", note: "Enabled; no sign-in for 96 days." },
  { kind: "leaver-active", user: "maya.estrada", note: "Resigned ten days ago; still enabled and signed in yesterday." },
  { kind: "leaver-active", user: "gregory.hale", note: "Left Aug 14; still enabled, and approved a purchase order after leaving." },
] as const;

let cache: Finance | null = null;
export function finance(): Finance { return cache ??= buildFinance(spec(buildUsers()), buildUsers()); }
