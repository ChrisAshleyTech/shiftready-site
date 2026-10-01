// Sunset Retail Group: retail, PCI DSS v4.0.1 and SOX.
import { iconByPrefix, noteByPrefix } from "../appIcons";
import type { CompanyPack } from "../types";
import { Mark } from "./mark";

export const pack: CompanyPack = {
  id: "sunset-retail",
  name: "Sunset Retail Group",
  industry: "Retail",
  frameworks: "PCI DSS v4.0.1, SOX ITGC",
  storageKey: "verdelit-sim-sunset-retail-v1",
  domain: "sunsetretail.com",
  hasTickets: true,
  Mark,
  appIcon: iconByPrefix({
    "APP-Office-Suite": "suite", "APP-Store-Mail": "suite", "APP-Finance-Reports": "chart", "APP-GL-Post": "ledger", "APP-AP": "receipt",
    "APP-Vendor-Master": "ledger", "APP-Audit-ReadOnly": "audit", "APP-POS-Reports": "chart", "APP-POS": "register", "APP-Cash-Office": "vault",
    "APP-Store-Scheduling": "calendar", "APP-Store-Receiving": "boxes", "APP-Inventory": "boxes", "APP-Merch-Planning": "tag", "APP-Price-Approve": "tag",
    "APP-Purchase-Orders": "receipt", "APP-Ecommerce-Admin": "cloud", "APP-Order-Management": "truck", "APP-Customer-Support": "ticket",
    "APP-LP-Video": "scan", "APP-Payment-Gateway": "lock", "APP-Service-Desk": "ticket", "APP-HRIS": "people",
    "GRP-": "group", "ROLE-": "key", "SVC-": "gear",
  }),
  toolNote: noteByPrefix({
    "APP-POS": "Store point-of-sale systems are often Oracle Xstore, NCR Voyix, Aptos or Shopify POS.",
    "APP-Cash-Office": "Cash-office counts and deposits are usually done in the POS back office, with safes from vendors such as Brink's.",
    "APP-Payment-Gateway": "Card payments usually run through a processor or gateway such as Adyen, Stripe, Worldpay or Fiserv, with point-to-point encryption at the terminal.",
    "APP-Ecommerce-Admin": "Online stores commonly run on Shopify Plus, Salesforce Commerce Cloud or Adobe Commerce.",
    "APP-Order-Management": "Order management is often Manhattan Active Omni, IBM Sterling or the commerce platform's own module.",
    "APP-Merch-Planning": "Merchandise planning tools include Oracle Retail and Blue Yonder.",
    "APP-Inventory": "Store inventory is usually managed in the POS or ERP, with handheld scanners for counts.",
    "APP-Store-Scheduling": "Store scheduling commonly uses UKG (Kronos), Legion or Deputy.",
    "APP-LP-Video": "Loss prevention teams often pair camera systems with POS exception reporting (for example Agilence).",
    "APP-HRIS": "Retailers often use Workday or UKG for HR and payroll.",
  }),
  load: async () => ({ company: await import("./company"), policy: await import("./policy"), tickets: (await import("./tickets.js")).set }),
  loadRecords: () => import("./finance"),
};
