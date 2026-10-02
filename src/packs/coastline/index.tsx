// Coastline Credit Union: banking, GLBA via NCUA Part 748.
import { iconByPrefix, noteByPrefix } from "../appIcons";
import type { CompanyPack } from "../types";
import { Mark } from "./mark";

export const pack: CompanyPack = {
  id: "coastline",
  name: "Coastline Credit Union",
  industry: "Banking",
  frameworks: "GLBA (NCUA Part 748), FFIEC",
  storageKey: "rolevara-sim-coastline-v1",
  domain: "coastlinecu.org",
  hasTickets: true,
  Mark,
  appIcon: iconByPrefix({
    "APP-Office-Suite": "suite", "APP-Finance-Reports": "chart", "APP-GL-Post": "ledger", "APP-AP": "receipt", "APP-Vendor-Master": "ledger",
    "APP-Core-Teller": "vault", "APP-Core": "bank", "APP-Loan": "claim", "APP-Collections": "claim", "APP-Wire": "bank", "APP-ACH": "bank",
    "APP-Card-Management": "tag", "APP-BSA-Monitoring": "audit", "APP-Digital-Banking-Admin": "cloud", "APP-HR-Payroll": "people",
    "APP-Service-Desk": "ticket", "GRP-": "group", "ROLE-": "key", "SVC-": "gear",
  }),
  toolNote: noteByPrefix({
    "APP-Core": "Credit unions run on a core processing system; common ones are Jack Henry Symitar, Fiserv (DNA, XP2) and Corelation KeyStone.",
    "APP-Loan": "Loan origination is often MeridianLink, nCino or a module of the core system.",
    "APP-Wire": "Wires usually go out through the core system's wire module or a Fed connection, with dual control built in.",
    "APP-ACH": "ACH files are usually built in the core system or an online banking platform, then sent to the Fed or a correspondent.",
    "APP-Card-Management": "Debit card programs usually run through a processor such as Fiserv, FIS or Co-op Solutions.",
    "APP-BSA-Monitoring": "BSA/AML monitoring tools include Verafin (Nasdaq) and Abrigo.",
    "APP-Digital-Banking-Admin": "Online and mobile banking often come from Alkami, Q2 or Banno (Jack Henry).",
    "APP-HR-Payroll": "Common HR and payroll systems are Paylocity, UKG and ADP.",
    "APP-Service-Desk": "Smaller institutions often use Freshservice, Jira Service Management or ServiceNow.",
  }),
  fw: ["glba", "nist"],
  loadPam: async () => (await import("./pam.js")).pam,
  load: async () => ({ company: await import("./company"), policy: await import("./policy"), tickets: (await import("./tickets.js")).set }),
  loadRecords: () => import("./finance"),
};
