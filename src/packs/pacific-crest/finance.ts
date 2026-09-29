// Pacific Crest Logistics: vendors, purchase orders, invoices and monthly operations metrics.
// Built from the unchanged v1 directory; nothing here alters the simulator's data.
import { BASE, buildUsers } from "./company.js";
import { buildFinance, type Finance, type FinanceSpec } from "../lib/finance";
import type { User } from "../lib/people";
import { dayIso, int } from "../lib/util";

const WORDS = ["Alvora", "Brantwell", "Corvane", "Delmore", "Estrin", "Farrowgate", "Halvern", "Keplan", "Larkstone", "Marrowby",
  "Northvane", "Orrindale", "Pellgrove", "Quarrow", "Redfern", "Saltmere", "Tessly", "Umberton", "Vantrel", "Westerly", "Yarrowby", "Zennor"];

const ops = ["Operations|Dispatcher", "Operations|Operations Manager"];
function spec(users: Record<string, User>): FinanceSpec {
  const ids = (rk: string) => Object.values(users).filter(u => `${u.dept}|${u.title}` === rk && !u.preHire).map(u => u.id);
  return {
    seed: 7101, prefix: "PCL", base: BASE,
    words: WORDS,
    limits: { CEO: 1_000_000, CFO: 250_000, Controller: 50_000, "Operations Manager": 50_000, "HR Director": 25_000, "IT Manager": 25_000, "Warehouse Manager": 10_000, "Sales Manager": 10_000 },
    categories: [
      { key: "linehaul", label: "Freight carriers", nouns: ["Freight Lines", "Transport", "Carriers"], vendors: 6, perMonth: [4, 7], amount: [6000, 45000], items: ["Linehaul, Portland to Reno", "Linehaul, Oakland to Boise", "LTL consolidation", "Drayage, Port of Oakland", "Expedited team run"], requesters: ops, risk: "Medium", soc: "None" },
      { key: "fuel", label: "Fuel", nouns: ["Fuel Supply", "Energy"], vendors: 2, perMonth: [1, 2], amount: [8000, 30000], items: ["Diesel, bulk delivery", "DEF, bulk delivery", "Fleet fuel cards"], requesters: ["Operations|Dispatcher"], risk: "Low", soc: "None" },
      { key: "fleet", label: "Fleet maintenance", nouns: ["Fleet Services", "Truck and Trailer Repair"], vendors: 3, perMonth: [1, 3], amount: [900, 12000], items: ["Brake service", "Tire replacement", "Reefer unit repair", "DOT inspection"], requesters: ["Operations|Dispatcher"], risk: "Low", soc: "None" },
      { key: "equipment", label: "Warehouse equipment", nouns: ["Material Handling", "Equipment Rental", "Industrial Supply"], vendors: 4, perMonth: [1, 3], amount: [800, 9500], items: ["Forklift rental", "Pallet jack", "Racking repair", "Scanner batteries", "Dock leveler service"], requesters: ["Operations|Warehouse Associate", "Operations|Warehouse Manager"], risk: "Low", soc: "None" },
      { key: "packaging", label: "Packaging", nouns: ["Packaging", "Pallet Co.", "Corrugated"], vendors: 3, perMonth: [2, 3], amount: [500, 7500], items: ["Stretch wrap", "Corrugated cartons", "Heat-treated pallets", "Void fill"], requesters: ["Operations|Warehouse Associate"], risk: "Low", soc: "None" },
      { key: "staffing", label: "Staffing", nouns: ["Staffing", "Workforce Solutions"], vendors: 2, perMonth: [1, 2], amount: [12000, 40000], items: ["Temporary warehouse labor", "Peak-season dock crew"], requesters: ["Operations|Operations Manager"], risk: "Medium", soc: "None" },
      { key: "it", label: "IT and software", nouns: ["Networks", "Software", "Cloud Services", "IT Solutions"], vendors: 4, perMonth: [1, 2], amount: [1500, 22000], items: ["Handheld scanner licenses", "Network switches", "Endpoint protection renewal", "Cloud hosting"], requesters: ["IT|Service Desk Tech", "IT|IT Manager"], risk: "High", soc: "SOC 2 Type II" },
      { key: "facilities", label: "Facilities", nouns: ["Facility Services", "Janitorial", "Security Services"], vendors: 3, perMonth: [1, 2], amount: [1200, 9000], items: ["Janitorial, monthly", "Overnight security patrol", "HVAC service"], requesters: ["Operations|Warehouse Manager"], risk: "Low", soc: "None" },
      { key: "office", label: "Office supplies", nouns: ["Office Supply", "Print and Mail"], vendors: 2, perMonth: [1, 2], amount: [150, 2500], items: ["Office supplies", "Toner", "Shipping labels"], requesters: ["HR|HR Generalist", "Finance|AP Clerk"], risk: "Low", soc: "None" },
      { key: "professional", label: "Professional services", nouns: ["Advisory", "Law Group", "CPAs"], vendors: 3, perMonth: [0, 1], amount: [8000, 45000], items: ["Quarterly review fieldwork", "Contract review", "Tax advisory"], requesters: ["Finance|Controller"], risk: "Medium", soc: "None" },
      { key: "marketing", label: "Marketing", nouns: ["Creative", "Events", "Media"], vendors: 2, perMonth: [0, 1], amount: [2000, 9000], items: ["Trade show booth", "Customer event", "Sales collateral printing"], requesters: ["Sales|Account Executive"], risk: "Low", soc: "None" },
      { key: "payroll", label: "Payroll and benefits", nouns: ["Payroll Services", "Benefits Administration"], vendors: 2, perMonth: [1, 1], amount: [3000, 9000], items: ["Payroll processing, monthly", "Benefits administration fee"], requesters: ["HR|HR Director"], risk: "High", soc: "SOC 1 Type II" },
    ],
    apEntry: ids("Finance|AP Clerk"),
    apApprove: ["derek.chan", "dana.whitfield"],
    vendorAdmins: ["dana.whitfield"],
    employment: { "brian.walsh": { left: dayIso(BASE, -14) }, "robert.hayes": { left: dayIso(BASE, 0) } },
    plant: {
      split: { requester: "bob.turner", category: "fleet" },
      duplicate: { category: "linehaul" },
      overPo: { category: "it" },
      // Derek Chan already holds AP entry and approval (an SoD finding in the directory).
      vendorSod: { user: "derek.chan", requester: "dana.whitfield", category: "professional" },
      approval: { kind: "approval-over-limit", approver: "marcus.bell", requester: ids("Operations|Warehouse Associate")[0], category: "equipment" },
    },
    metrics: {
      defs: [
        { key: "shipments", label: "Shipments", unit: "count" },
        { key: "onTimeShipments", label: "On-time shipments", unit: "count" },
        { key: "onTimeBps", label: "On-time rate", unit: "bps" },
        { key: "revenuePerShipmentCents", label: "Revenue per shipment", unit: "cents" },
        { key: "revenueCents", label: "Revenue", unit: "cents" },
      ],
      // Seasonal volume (peak Oct to Dec), steady pricing growth.
      gen: (i, r) => {
        const season = [1.12, 1.18, 1.25, 0.9, 0.88, 0.95, 0.98, 1.0, 1.02, 1.0, 1.04, 1.06][i];
        const shipments = Math.round(4200 * season * (1 + i * 0.006) + int(r, -60, 60));
        const onTimeShipments = Math.round(shipments * (0.935 + r() * 0.03 - (season > 1.15 ? 0.025 : 0)));
        const revenuePerShipmentCents = 184_000 + i * 900 + int(r, -1500, 1500);
        return { shipments, onTimeShipments, onTimeBps: Math.round((onTimeShipments / shipments) * 10000), revenuePerShipmentCents, revenueCents: shipments * revenuePerShipmentCents };
      },
    },
  };
}

// Relationships the monthly figures must keep.
export function metricRules(rows: Finance["metrics"]): string[] {
  return rows.flatMap(({ month, values: v }) => [
    v.onTimeShipments <= v.shipments || `${month}: more on-time shipments than shipments`,
    v.onTimeBps === Math.round((v.onTimeShipments / v.shipments) * 10000) || `${month}: on-time rate doesn't match`,
    v.revenueCents === v.shipments * v.revenuePerShipmentCents || `${month}: revenue doesn't equal shipments x rate`,
  ].filter((x): x is string => typeof x === "string"));
}

// Directory findings planted in the v1 simulator, for future audit tickets. Hidden from learners.
export const IAM_KEY = [
  { kind: "dormant", user: "greg.foster", note: "Enabled; no sign-in for 112 days." },
  { kind: "dormant", user: "nina.shah", note: "Enabled; no sign-in for 97 days." },
  { kind: "dormant", user: "paul.kim", note: "Enabled; no sign-in for 134 days." },
  { kind: "sod", user: "derek.chan", note: "Holds both AP entry and AP approval." },
  { kind: "excess", user: "derek.chan", note: "AP entry isn't part of the AP Manager role." },
  { kind: "excess", user: "bob.turner", note: "A Dispatcher with AP entry, left over from an old role." },
  { kind: "leaver-active", user: "brian.walsh", note: "Resigned two weeks ago; the account is still enabled and signed in 2 days ago." },
] as const;

let cache: Finance | null = null;
export function finance(): Finance { return cache ??= buildFinance(spec(buildUsers()), buildUsers()); }
