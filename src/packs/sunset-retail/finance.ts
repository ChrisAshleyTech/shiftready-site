// Sunset Retail Group: vendors, purchase orders, invoices and monthly sales metrics.
import { BASE, buildUsers } from "./company";
import { buildFinance, type Finance, type FinanceSpec } from "../lib/finance";
import type { User } from "../lib/people";
import { dayIso, int } from "../lib/util";

const WORDS = ["Amberly", "Birchwood", "Canyonlands", "Desert Rose", "Elmstead", "Flagstone", "Goldleaf", "Hearthside", "Indigo Mesa", "Juniperhill",
  "Kiln House", "Loomcraft", "Mesa Verde", "Nightjar", "Oakwind", "Palisade", "Quarry Lane", "Redrock", "Saguaro", "Terracotta", "Umber", "Wildrye"];

function spec(users: Record<string, User>): FinanceSpec {
  const ids = (rk: string) => Object.values(users).filter(u => `${u.dept}|${u.title}` === rk && !u.preHire && u.enabled).map(u => u.id);
  const reportsTo = (name: string) => Object.values(users).filter(u => u.mgr === name && u.enabled && u.type === "Employee").map(u => u.id);
  return {
    seed: 7606, prefix: "SR", base: BASE, words: WORDS,
    limits: { "Chief Executive Officer": 1_000_000, "Chief Financial Officer": 250_000, "Merchandising Manager": 150_000, Controller: 50_000,
      "IT Director": 50_000, "Regional Manager": 25_000, "Ecommerce Manager": 25_000, "HR Director": 25_000, "Loss Prevention Manager": 15_000, "Store Manager": 5_000 },
    categories: [
      { key: "merchandise", label: "Merchandise", nouns: ["Home Goods", "Textiles", "Ceramics", "Trading Co."], vendors: 8, perMonth: [6, 9], amount: [8000, 110000], items: ["Throw pillows, assorted", "Stoneware dinner sets", "Scented candles", "Woven baskets", "Linen bedding sets", "Outdoor lanterns"], requesters: ["Merchandising|Buyer"], risk: "Medium", soc: "None" },
      { key: "store-supplies", label: "Store supplies", nouns: ["Store Supply", "Retail Fixtures"], vendors: 2, perMonth: [2, 4], amount: [200, 4500], items: ["Receipt paper", "Price tags", "Hangers", "Cleaning supplies"], requesters: ["Stores|Assistant Store Manager"], risk: "Low", soc: "None" },
      { key: "packaging", label: "Packaging", nouns: ["Packaging", "Paper Goods"], vendors: 2, perMonth: [1, 2], amount: [1200, 9000], items: ["Shopping bags, recycled", "Ship cartons", "Tissue paper"], requesters: ["Ecommerce|Ecommerce Specialist", "Ecommerce|Ecommerce Manager"], risk: "Low", soc: "None" },
      { key: "payments", label: "Payment processing", nouns: ["Payments", "Merchant Services"], vendors: 2, perMonth: [1, 1], amount: [9000, 24000], items: ["Card processing fees, monthly", "Payment gateway, monthly", "Point-to-point encryption devices"], requesters: ["IT|Payments Systems Engineer"], risk: "High", soc: "PCI DSS AOC" },
      { key: "ecommerce", label: "Ecommerce platform", nouns: ["Commerce Cloud", "Web Services"], vendors: 2, perMonth: [1, 1], amount: [3000, 18000], items: ["Storefront platform, monthly", "Site search", "Fraud screening"], requesters: ["Ecommerce|Ecommerce Manager"], risk: "High", soc: "SOC 2 Type II" },
      { key: "facilities", label: "Store maintenance", nouns: ["Facility Services", "Maintenance"], vendors: 3, perMonth: [2, 3], amount: [400, 4800], items: ["HVAC service", "Lighting repair", "Janitorial, monthly", "Door repair"], requesters: ["Stores|Store Manager"], risk: "Low", soc: "None" },
      { key: "freight", label: "Freight", nouns: ["Freight", "Logistics"], vendors: 2, perMonth: [2, 3], amount: [600, 4800], items: ["Store replenishment freight", "Parcel shipping, online orders"], requesters: ["Stores|Stock Associate"], risk: "Low", soc: "None" },
      { key: "security", label: "Loss prevention and security", nouns: ["Security Systems", "Protection Services"], vendors: 2, perMonth: [0, 1], amount: [1500, 14000], items: ["Camera system upgrade", "EAS tags", "Guard service, holiday"], requesters: ["Loss Prevention|Loss Prevention Manager"], risk: "Medium", soc: "None" },
      { key: "marketing", label: "Marketing", nouns: ["Media", "Creative"], vendors: 2, perMonth: [1, 2], amount: [2000, 18000], items: ["Social ads", "Holiday catalog printing", "Email platform"], requesters: ["Ecommerce|Ecommerce Manager"], risk: "Low", soc: "None" },
      { key: "professional", label: "Professional services", nouns: ["CPAs", "Advisory", "Law Group"], vendors: 3, perMonth: [0, 1], amount: [8000, 48000], items: ["SOX 404 testing support", "Quarterly review fieldwork", "PCI QSA assessment"], requesters: ["Finance|Controller"], risk: "Medium", soc: "None" },
      { key: "payroll", label: "Payroll and benefits", nouns: ["Payroll Services", "Benefits Administration"], vendors: 2, perMonth: [1, 1], amount: [4000, 12000], items: ["Payroll processing, monthly", "Benefits administration fee"], requesters: ["HR|HR Director"], risk: "High", soc: "SOC 1 Type II" },
    ],
    apEntry: ids("Finance|AP Specialist"),
    apApprove: ["colleen.mcbride", "vikram.sethi"],
    vendorAdmins: ["gina.castellano"],
    employment: { "sabrina.cortez": { left: dayIso(BASE, -9) }, "douglas.whitcombe": { left: "2026-08-28" }, "april.nakamura": { left: dayIso(BASE, 0) } },
    plant: {
      split: { requester: ids("Merchandising|Buyer").filter(id => id !== "percy.oyelowo")[1], category: "merchandise" },
      duplicate: { category: "merchandise" },
      overPo: { category: "ecommerce" },
      // Gina Castellano sets up vendors and was also given AP approval (an SoD finding in the directory).
      vendorSod: { user: "gina.castellano", requester: "ingrid.solberg", category: "store-supplies" },
      approval: { kind: "approval-after-termination", approver: "douglas.whitcombe", requester: reportsTo("Douglas Whitcombe")[0], category: "store-supplies" },
    },
    metrics: {
      defs: [
        { key: "storeSalesCents", label: "Store sales", unit: "cents" },
        { key: "ecommerceSalesCents", label: "Online sales", unit: "cents" },
        { key: "totalSalesCents", label: "Total sales", unit: "cents" },
        { key: "storeTransactions", label: "Store transactions", unit: "count" },
        { key: "avgTicketCents", label: "Average store ticket", unit: "cents" },
        { key: "onlineOrders", label: "Online orders", unit: "count" },
        { key: "returnsCents", label: "Returns", unit: "cents" },
        { key: "shrinkBps", label: "Shrink (share of sales)", unit: "bps" },
      ],
      // About $16M a year across five stores and online, with a holiday peak.
      gen: (i, r) => {
        const season = [0.95, 1.25, 1.7, 0.75, 0.8, 0.95, 1.0, 1.05, 0.95, 0.9, 0.95, 0.85][i];
        const storeTransactions = Math.round(19_500 * season + int(r, -400, 400));
        const avgTicketCents = 5_150 + int(r, -250, 350);
        const storeSalesCents = storeTransactions * avgTicketCents;
        const onlineOrders = Math.round(4_300 * season * (1 + i * 0.01) + int(r, -150, 150));
        const ecommerceSalesCents = onlineOrders * (7_800 + int(r, -300, 300));
        const totalSalesCents = storeSalesCents + ecommerceSalesCents;
        return { storeSalesCents, ecommerceSalesCents, totalSalesCents, storeTransactions, avgTicketCents, onlineOrders,
          returnsCents: Math.round(totalSalesCents * (i === 3 ? 0.12 : 0.07 + r() * 0.02)), shrinkBps: 140 + int(r, -25, 40) };
      },
    },
  };
}

export function metricRules(rows: Finance["metrics"]): string[] {
  return rows.flatMap(({ month, values: v }) => [
    v.totalSalesCents === v.storeSalesCents + v.ecommerceSalesCents || `${month}: total sales don't add up`,
    v.storeSalesCents === v.storeTransactions * v.avgTicketCents || `${month}: store sales don't equal transactions x average ticket`,
    v.returnsCents < v.totalSalesCents || `${month}: returns exceed sales`,
  ].filter((x): x is string => typeof x === "string"));
}

export const IAM_KEY = [
  { kind: "sod", user: "gina.castellano", note: "Sets up vendors and can approve their invoices." },
  { kind: "excess", user: "gina.castellano", note: "AP approval isn't part of the Vendor Setup Specialist role." },
  { kind: "sod", user: "tyrone.gaines", note: "Can approve refunds and reconcile the cash office." },
  { kind: "excess", user: "tyrone.gaines", note: "Cash-office reconcile isn't part of the Assistant Store Manager role." },
  { kind: "sod", user: "marisa.delgado", note: "Can receive goods and write off inventory." },
  { kind: "excess", user: "marisa.delgado", note: "Inventory adjustment isn't part of the Stock Associate role." },
  { kind: "sod", user: "callum.frazer", note: "Cardholder-data-environment admin who can also administer the security logs." },
  { kind: "excess", user: "callum.frazer", note: "Security log admin isn't part of the Payments Systems Engineer role." },
  { kind: "excess", user: "dylan.mercer", note: "Storefront admin (price changes) isn't part of the Customer Care Agent role." },
  { kind: "dormant", user: "heather.lindgren", note: "Enabled POS user; no sign-in for 118 days." },
  { kind: "dormant", user: "percy.oyelowo", note: "Enabled buyer account; no sign-in for 99 days." },
  { kind: "leaver-active", user: "sabrina.cortez", note: "Resigned nine days ago; still enabled and signing in." },
  { kind: "leaver-active", user: "douglas.whitcombe", note: "Left Aug 28; still enabled, and approved a purchase order after leaving." },
] as const;

let cache: Finance | null = null;
export function finance(): Finance { return cache ??= buildFinance(spec(buildUsers()), buildUsers()); }
