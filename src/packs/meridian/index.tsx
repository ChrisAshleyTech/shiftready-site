// Meridian Aerospace: defense subcontractor, CMMC Level 2 and NIST SP 800-171.
import { iconByPrefix, noteByPrefix } from "../appIcons";
import type { CompanyPack } from "../types";
import { Mark } from "./mark";

export const pack: CompanyPack = {
  id: "meridian",
  name: "Meridian Aerospace",
  industry: "Aerospace and defense",
  frameworks: "CMMC Level 2, NIST SP 800-171",
  storageKey: "rolevara-sim-meridian-v1",
  domain: "meridianaero.com",
  hasTickets: true,
  Mark,
  appIcon: iconByPrefix({
    "APP-Office-Suite": "suite", "APP-Finance-Reports": "chart", "APP-ERP": "ledger", "APP-ERP-Purchasing": "receipt", "APP-ERP-Receiving": "boxes",
    "APP-PLM-CUI": "lock", "APP-CAD": "plane", "APP-MES": "gauge", "APP-QMS": "audit", "APP-Timekeeping": "calendar",
    "APP-Security-Clearances": "lock", "APP-HR-Payroll": "people", "APP-Service-Desk": "ticket",
    "GRP-ITAR": "lock", "GRP-CUI": "lock", "GRP-": "group", "ROLE-": "key", "SVC-": "gear",
  }),
  toolNote: noteByPrefix({
    "APP-Office-Suite-Gov": "Defense contractors handling CUI usually use a government cloud tenant such as Microsoft 365 GCC High, which is built to support DFARS and ITAR obligations.",
    "APP-PLM-CUI": "Engineering data usually lives in a PLM system such as Siemens Teamcenter, Dassault ENOVIA or PTC Windchill, inside the CUI enclave.",
    "APP-CAD": "Common aerospace CAD tools are Dassault CATIA, Siemens NX and PTC Creo.",
    "APP-MES": "Shop-floor work orders run in an MES; examples include Plex, Siemens Opcenter and Solumina.",
    "APP-QMS": "Quality records (inspections, nonconformances, AS9100 evidence) are often kept in a QMS such as ETQ or Intelex.",
    "APP-ERP": "Mid-size defense suppliers commonly run Deltek Costpoint, Epicor or Infor for finance and purchasing.",
    "APP-Timekeeping": "Government contractors track labor by charge number for DCAA; Deltek Time & Expense and Unanet are common.",
    "APP-Security-Clearances": "Facility Security Officers manage clearances in the government's DISS system; companies track them internally too.",
    "ROLE-Security-Log-Admin": "Audit logs usually go to a SIEM such as Microsoft Sentinel or Splunk.",
  }),
  load: async () => ({ company: await import("./company"), policy: await import("./policy"), tickets: (await import("./tickets.js")).set }),
  loadRecords: () => import("./finance"),
};
