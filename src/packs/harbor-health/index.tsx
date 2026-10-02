// Harbor Health Network: healthcare, HIPAA Security Rule. Tickets are in development.
import { iconByPrefix, noteByPrefix } from "../appIcons";
import type { CompanyPack } from "../types";
import { Mark } from "./mark";

export const pack: CompanyPack = {
  id: "harbor-health",
  name: "Harbor Health Network",
  industry: "Healthcare",
  frameworks: "HIPAA Security Rule",
  storageKey: "rolevara-sim-harbor-health-v1",
  hasTickets: false,
  Mark,
  appIcon: iconByPrefix({
    "APP-Office-Suite": "suite", "APP-Finance-Reports": "chart", "APP-ERP": "ledger", "APP-EHR-Clinical": "record", "APP-EHR-Orders-Sign": "record",
    "APP-EHR-Scheduling": "calendar", "APP-EHR-Billing": "claim", "APP-EHR-Audit-Reports": "audit", "APP-Claims-Clearinghouse": "claim",
    "APP-eRx-Controlled": "pill", "APP-Pharmacy": "pill", "APP-PACS-Viewer": "scan", "APP-Lab-Results": "flask", "APP-HR-Payroll": "people",
    "APP-Service-Desk": "ticket", "GRP-": "group", "ROLE-EHR-BreakGlass": "alert", "ROLE-": "key", "SVC-": "gear",
  }),
  toolNote: noteByPrefix({
    "APP-EHR": "In most hospitals and health systems this is Epic or Oracle Health (formerly Cerner). Smaller practices often use athenahealth or eClinicalWorks.",
    "APP-eRx-Controlled": "Electronic prescribing of controlled substances (EPCS) is usually a module of the EHR, and DEA rules require two-factor authentication to sign.",
    "APP-Pharmacy": "Hospital pharmacies usually work in the EHR's pharmacy module (for example Epic Willow) alongside automated dispensing cabinets such as Omnicell or BD Pyxis.",
    "APP-PACS-Viewer": "Imaging is read in a PACS; common vendors include Sectra, GE HealthCare and Philips.",
    "APP-Lab-Results": "Results usually arrive in the EHR from a lab system and reference labs such as Quest or Labcorp.",
    "APP-Claims-Clearinghouse": "Claims usually go through a clearinghouse such as Availity or Optum (Change Healthcare).",
    "APP-ERP": "Health systems often run finance and supply chain in Workday, Oracle or Infor.",
    "APP-HR-Payroll": "Common HR and payroll systems are Workday, UKG and ADP.",
    "APP-Service-Desk": "ServiceNow is the most common IT service desk in health systems.",
    "ROLE-EHR-BreakGlass": "Break-glass is a standard EHR feature: a reason is required, and every use appears in the privacy team's audit reports.",
  }),
  load: async () => ({ company: await import("./company"), policy: await import("./policy") }),
  loadRecords: () => import("./finance"),
};
