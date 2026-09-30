// Sunset Retail Group: a publicly traded home and lifestyle retailer with five stores and an
// online shop. Fictional company; app names are generic (see TOOL_NOTES for the real products
// these usually are).
import { makeDirectory, type Core, type Filler } from "../lib/people";
import { makeFmtDay } from "../lib/util";

const STAFF = ["GRP-All-Staff", "APP-Office-Suite"];
const STORE = ["GRP-All-Staff", "APP-Store-Mail"];
export const ROLES: Record<string, string[]> = {
  "Executive|Chief Executive Officer": [...STAFF, "APP-Finance-Reports"],
  "Finance|Chief Financial Officer": [...STAFF, "APP-Finance-Reports"],
  "Finance|Controller": [...STAFF, "APP-GL-Post", "APP-AP-Approve", "APP-Finance-Reports"],
  "Finance|Staff Accountant": [...STAFF, "APP-GL-Post"],
  "Finance|AP Specialist": [...STAFF, "APP-AP-Entry"],
  "Finance|Vendor Setup Specialist": [...STAFF, "APP-Vendor-Master"],
  "Internal Audit|Internal Audit Manager": [...STAFF, "APP-Finance-Reports", "APP-Audit-ReadOnly"],
  "Stores|Regional Manager": [...STAFF, "APP-POS-Reports", "APP-Finance-Reports"],
  "Stores|Store Manager": [...STORE, "APP-POS-Cashier", "APP-POS-Refund-Override", "APP-Store-Scheduling", "APP-Inventory-Adjust"],
  "Stores|Assistant Store Manager": [...STORE, "APP-POS-Cashier", "APP-POS-Refund-Override", "APP-Store-Scheduling"],
  "Stores|Cash Office Associate": [...STORE, "APP-Cash-Office-Reconcile"],
  "Stores|Sales Associate": [...STORE, "APP-POS-Cashier"],
  "Stores|Stock Associate": [...STORE, "APP-Store-Receiving", "APP-Inventory-Lookup"],
  "Stores|Seasonal Associate": ["GRP-Contractors", "APP-POS-Cashier"],
  "Merchandising|Merchandising Manager": [...STAFF, "APP-Merch-Planning", "APP-Price-Approve", "APP-Finance-Reports"],
  "Merchandising|Buyer": [...STAFF, "APP-Merch-Planning", "APP-Purchase-Orders"],
  "Ecommerce|Ecommerce Manager": [...STAFF, "APP-Ecommerce-Admin", "APP-Order-Management"],
  "Ecommerce|Ecommerce Specialist": [...STAFF, "APP-Ecommerce-Admin"],
  "Customer Care|Customer Care Agent": [...STAFF, "APP-Order-Management", "APP-Customer-Support"],
  "Loss Prevention|Loss Prevention Manager": [...STAFF, "APP-LP-Video", "APP-POS-Reports"],
  "IT|IT Director": [...STAFF, "APP-Service-Desk", "ROLE-User-Admin"],
  "IT|Payments Systems Engineer": [...STAFF, "APP-Service-Desk", "APP-Payment-Gateway", "ROLE-CDE-Admin"],
  "IT|Security Analyst": [...STAFF, "APP-Service-Desk", "ROLE-Security-Log-Admin"],
  "IT|Service Desk Analyst": [...STAFF, "APP-Service-Desk", "ROLE-Helpdesk-Admin"],
  "HR|HR Director": [...STAFF, "APP-HRIS"],
  "HR|HR Generalist": [...STAFF, "APP-HRIS"],
};
export const REQUESTABLE = ["APP-Finance-Reports", "APP-POS-Reports"];
export const SOD: [string, string, string][] = [
  ["APP-POS-Refund-Override", "APP-Cash-Office-Reconcile", "One person could approve a fake refund and then reconcile the drawer to hide the missing cash."],
  ["APP-Store-Receiving", "APP-Inventory-Adjust", "One person could receive goods and then write them off as shrink."],
  ["ROLE-CDE-Admin", "ROLE-Security-Log-Admin", "One person could change the cardholder data environment and delete the logs that record it."],
  ["APP-Purchase-Orders", "APP-Vendor-Master", "One person could set up a supplier and send it purchase orders."],
  ["APP-Vendor-Master", "APP-AP-Approve", "One person could create a fake vendor and approve payment to it."],
  ["APP-AP-Entry", "APP-AP-Approve", "One person could enter and approve their own invoice."],
];
export const ALL_GROUPS = [...new Set([...Object.values(ROLES).flat(), "ROLE-Global-Admin", "SVC-POS-Sync", "SVC-Backup-Operators"])].sort();
export const BASE = new Date(2026, 9, 5);
export const fmtDay = makeFmtDay(BASE);

const R = ROLES;
const MANAGERS = ["Rafael Montoya", "Keiko Hartley", "Bernadette Quaye", "Douglas Whitcombe", "Anneliese Vogt"];
const CORE: Core[] = [
  ["marguerite.laine", "Marguerite Laine", "SR-100001", "Executive|Chief Executive Officer", "Board of Directors", { last: 0 }],
  ["vikram.sethi", "Vikram Sethi", "SR-100004", "Finance|Chief Financial Officer", "Marguerite Laine", { last: 0 }],
  ["colleen.mcbride", "Colleen McBride", "SR-100008", "Finance|Controller", "Vikram Sethi"],
  // Planted: the vendor setup specialist was also given AP approval (SoD).
  ["gina.castellano", "Gina Castellano", "SR-100013", "Finance|Vendor Setup Specialist", "Colleen McBride", { groups: [...R["Finance|Vendor Setup Specialist"], "APP-AP-Approve"] }],
  ["jerome.batiste", "Jerome Batiste", "SR-100017", "Internal Audit|Internal Audit Manager", "Vikram Sethi"],
  ["lorraine.okafor", "Lorraine Okafor", "SR-100021", "Stores|Regional Manager", "Marguerite Laine"],
  ["rafael.montoya", "Rafael Montoya", "SR-100025", "Stores|Store Manager", "Lorraine Okafor"],
  ["keiko.hartley", "Keiko Hartley", "SR-100029", "Stores|Store Manager", "Lorraine Okafor"],
  ["bernadette.quaye", "Bernadette Quaye", "SR-100033", "Stores|Store Manager", "Lorraine Okafor"],
  // Planted: left Aug 28; account still enabled and used after that.
  ["douglas.whitcombe", "Douglas Whitcombe", "SR-100037", "Stores|Store Manager", "Lorraine Okafor", { last: 20 }],
  ["anneliese.vogt", "Anneliese Vogt", "SR-100041", "Stores|Store Manager", "Lorraine Okafor"],
  // Planted: an assistant manager who can also reconcile the cash office (SoD).
  ["tyrone.gaines", "Tyrone Gaines", "SR-100052", "Stores|Assistant Store Manager", "Keiko Hartley", { groups: [...R["Stores|Assistant Store Manager"], "APP-Cash-Office-Reconcile"] }],
  // Planted: a stock associate who can also adjust inventory (SoD).
  ["marisa.delgado", "Marisa Delgado", "SR-100058", "Stores|Stock Associate", "Bernadette Quaye", { groups: [...R["Stores|Stock Associate"], "APP-Inventory-Adjust"] }],
  ["ingrid.solberg", "Ingrid Solberg", "SR-100063", "Merchandising|Merchandising Manager", "Marguerite Laine"],
  ["samir.haddad", "Samir Haddad", "SR-100067", "Ecommerce|Ecommerce Manager", "Marguerite Laine"],
  ["patience.adjei", "Patience Adjei", "SR-100071", "Loss Prevention|Loss Prevention Manager", "Vikram Sethi"],
  ["walter.ng", "Walter Ng", "SR-100075", "IT|IT Director", "Vikram Sethi"],
  // Planted: the payments engineer can also administer the security logs (SoD).
  ["callum.frazer", "Callum Frazer", "SR-100079", "IT|Payments Systems Engineer", "Walter Ng", { groups: [...R["IT|Payments Systems Engineer"], "ROLE-Security-Log-Admin"] }],
  ["ruby.castaneda", "Ruby Castaneda", "SR-100083", "HR|HR Director", "Marguerite Laine"],
  // Planted: a customer care agent with storefront admin (can change prices).
  ["dylan.mercer", "Dylan Mercer", "SR-100088", "Customer Care|Customer Care Agent", "Samir Haddad", { groups: [...R["Customer Care|Customer Care Agent"], "APP-Ecommerce-Admin"] }],
  // Planted: dormant accounts.
  ["heather.lindgren", "Heather Lindgren", "SR-100132", "Stores|Sales Associate", "Rafael Montoya", { last: 118 }],
  ["percy.oyelowo", "Percy Oyelowo", "SR-100137", "Merchandising|Buyer", "Ingrid Solberg", { last: 99 }],
  // Planted: resigned nine days ago, still enabled and signing in.
  ["sabrina.cortez", "Sabrina Cortez", "SR-100143", "Stores|Assistant Store Manager", "Anneliese Vogt", { last: 2 }],
  ["jonah.feldman", "Jonah Feldman", "SR-100148", "Stores|Sales Associate", "Keiko Hartley"],
  ["april.nakamura", "April Nakamura", "SR-100152", "Stores|Cash Office Associate", "Rafael Montoya", { last: 0 }],
  ["leon.baptiste", "Leon Baptiste", "SR-100157", "Merchandising|Buyer", "Ingrid Solberg"],
  ["tatiana.rusu", "Tatiana Rusu", "SR-100109", "Stores|Sales Associate", "Anneliese Vogt", { enabled: false, groups: ["GRP-All-Staff", "APP-POS-Cashier"], last: 290 }],
  ["corey.blackwell", "Corey Blackwell", "SRS-3301", "Stores|Seasonal Associate", "Keiko Hartley (sponsor)", { type: "Contractor", expiry: 2 }],
  ["imani.walker", "Imani Walker", "SR-100401", "Stores|Sales Associate", "Bernadette Quaye", { enabled: false, groups: [], last: null, mfa: false, preHire: true }],
  ["noel.garrido", "Noel Garrido", "SR-100402", "Ecommerce|Ecommerce Specialist", "Samir Haddad", { enabled: false, groups: [], last: null, mfa: false, preHire: true }],
  ["svc-pos-sync", "svc-pos-sync", "SVC-051", null, "Callum Frazer (owner)", { dept: "IT", title: "Service account: POS to ERP sales sync", type: "Service", groups: ["SVC-POS-Sync"], last: 0, mfa: false }],
];
const FILLER: Filler[] = [
  ["Stores|Sales Associate", 38, MANAGERS],
  ["Stores|Stock Associate", 10, MANAGERS],
  ["Stores|Assistant Store Manager", 4, ["Rafael Montoya", "Bernadette Quaye", "Douglas Whitcombe", "Anneliese Vogt"]],
  ["Stores|Cash Office Associate", 4, ["Keiko Hartley", "Bernadette Quaye", "Douglas Whitcombe", "Anneliese Vogt"]],
  ["Merchandising|Buyer", 3, "Ingrid Solberg"],
  ["Ecommerce|Ecommerce Specialist", 3, "Samir Haddad"],
  ["Customer Care|Customer Care Agent", 8, "Samir Haddad"],
  ["Finance|Staff Accountant", 3, "Colleen McBride"],
  ["Finance|AP Specialist", 2, "Colleen McBride"],
  ["IT|Security Analyst", 2, "Walter Ng"],
  ["IT|Service Desk Analyst", 3, "Walter Ng"],
  ["HR|HR Generalist", 3, "Ruby Castaneda"],
  ["Stores|Seasonal Associate", 6, ["Rafael Montoya (sponsor)", "Keiko Hartley (sponsor)", "Anneliese Vogt (sponsor)"]],
];
export const buildUsers = () => makeDirectory({
  roles: ROLES, core: CORE, filler: FILLER, seed: 20270305,
  empId: n => `SR-${n}`, firstEmp: 100200, conId: n => `SRS-${3310 + n}`, contractorExpiry: [15, 75],
});

export const HR_FEED = [
  { type: "Hire", who: "Imani Walker", detail: "Sales Associate, Stores (Canyon Plaza). Manager: Bernadette Quaye. Start date: today.", when: 0 },
  { type: "Hire", who: "Noel Garrido", detail: "Ecommerce Specialist, Ecommerce. Manager: Samir Haddad. Start date: today.", when: 0 },
  { type: "Rehire", who: "Tatiana Rusu", detail: "Rehired as Sales Associate, Stores. Manager: Anneliese Vogt. Previously Sales Associate (left Dec 2025).", when: 0 },
  { type: "Transfer", who: "Jonah Feldman", detail: "From Sales Associate to Stock Associate, Stores. Same manager. Effective today.", when: 0 },
  { type: "Termination", who: "April Nakamura", detail: "Involuntary, following a cash-office variance review. Effective today, 7:00 AM.", when: 0 },
  { type: "Leave of absence", who: "Leon Baptiste", detail: "Leave begins today. Expected return: Dec 7, 2026.", when: 0 },
  { type: "Contract end", who: "Corey Blackwell", detail: "Seasonal assignment end date on file: " + fmtDay(2) + ". Sponsor: Keiko Hartley.", when: -1 },
  { type: "Termination", who: "Sabrina Cortez", detail: "Voluntary resignation. Last day: " + fmtDay(-9) + ".", when: -9 },
  { type: "Termination", who: "Douglas Whitcombe", detail: "Voluntary resignation. Last day: Aug 28, 2026. Store now covered by Lorraine Okafor.", when: -38 },
];
