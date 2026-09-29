// Pacific Crest Logistics: the original simulator company. Its data files are unchanged from v1.
import * as company from "./company.js";
import * as policy from "./policy.js";
import { iconByPrefix } from "../appIcons";
import type { CompanyPack } from "../types";
import { Mark } from "./mark";

export const pack: CompanyPack = {
  id: "pacific-crest",
  name: "Pacific Crest Logistics",
  industry: "Logistics",
  frameworks: "SOX ITGC, NIST SP 800-53",
  storageKey: "pcl-iam-sim-v1",
  hasTickets: true,
  Mark,
  appIcon: iconByPrefix({
    "APP-M365": "suite", "APP-Finance-Reports": "chart", "APP-Salesforce-Reports": "chart", "APP-Concur": "receipt",
    "APP-SAP": "ledger", "APP-Salesforce": "crm", "APP-CargoWise": "truck", "APP-WMS": "boxes", "APP-Workday": "people",
    "APP-ServiceNow": "ticket", "GRP-": "group", "ROLE-": "key", "SVC-": "gear",
  }),
  load: async () => ({ company, policy }),
  loadRecords: () => import("./finance"),
};
