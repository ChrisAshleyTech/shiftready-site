// Meridian Aerospace: a defense subcontractor machining aerostructure parts and assemblies.
// Handles Controlled Unclassified Information (CUI) and ITAR technical data. Fictional company;
// app names are generic (see TOOL_NOTES for the real products these usually are).
import { makeDirectory, type Core, type Filler } from "../lib/people";
import { makeFmtDay } from "../lib/util";

const STAFF = ["GRP-All-Staff", "APP-Office-Suite-Gov"];
const CUI = [...STAFF, "GRP-CUI-Users"];
export const ROLES: Record<string, string[]> = {
  "Executive|President": [...STAFF, "APP-Finance-Reports"],
  "Finance|Chief Financial Officer": [...STAFF, "APP-Finance-Reports"],
  "Finance|Controller": [...STAFF, "APP-ERP-GL-Post", "APP-ERP-AP-Approve", "APP-Finance-Reports", "APP-Timekeeping-Approve"],
  "Finance|AP Manager": [...STAFF, "APP-ERP-AP-Approve", "APP-Finance-Reports"],
  "Finance|AP Specialist": [...STAFF, "APP-ERP-AP-Entry"],
  "Finance|Vendor Master Analyst": [...STAFF, "APP-ERP-Vendor-Master"],
  "Supply Chain|Procurement Manager": [...CUI, "APP-ERP-Purchasing", "APP-Finance-Reports"],
  "Supply Chain|Buyer": [...CUI, "APP-ERP-Purchasing"],
  "Supply Chain|Receiving Clerk": [...STAFF, "APP-ERP-Receiving"],
  "Program Management|Program Manager": [...CUI, "APP-PLM-CUI", "APP-Finance-Reports", "APP-Timekeeping-Approve"],
  "Engineering|Engineering Manager": [...CUI, "APP-PLM-CUI", "APP-CAD-Workstation", "APP-Timekeeping-Approve"],
  "Engineering|Design Engineer": [...CUI, "APP-PLM-CUI", "APP-CAD-Workstation"],
  "Engineering|Manufacturing Engineer": [...CUI, "APP-PLM-CUI", "APP-MES-Engineering"],
  "Engineering|Engineering Contractor": ["GRP-Contractors", "GRP-CUI-Users", "APP-PLM-CUI", "APP-CAD-Workstation"],
  "Manufacturing|Production Manager": [...CUI, "APP-MES-Operator", "APP-MES-Engineering", "APP-Timekeeping-Approve"],
  "Manufacturing|Machinist": [...CUI, "APP-MES-Operator", "APP-Timekeeping"],
  "Quality|Quality Manager": [...CUI, "APP-QMS-Inspection-Signoff", "APP-QMS-Disposition", "APP-Timekeeping-Approve"],
  "Quality|Quality Inspector": [...CUI, "APP-QMS-Inspection-Signoff", "APP-Timekeeping"],
  "Security|Facility Security Officer": [...STAFF, "APP-Security-Clearances"],
  "HR|HR Manager": [...STAFF, "APP-HR-Payroll"],
  "HR|HR Generalist": [...STAFF, "APP-HR-Payroll"],
  "IT|IT Manager": [...STAFF, "APP-Service-Desk", "ROLE-User-Admin"],
  "IT|Systems Administrator": [...STAFF, "APP-Service-Desk", "ROLE-Domain-Admin"],
  "IT|Security Analyst": [...STAFF, "APP-Service-Desk", "ROLE-Security-Log-Admin"],
  "IT|Service Desk Technician": [...STAFF, "APP-Service-Desk", "ROLE-Helpdesk-Admin"],
};
// ITAR technical data is requestable only with the Facility Security Officer's confirmation of U.S.-person status.
export const REQUESTABLE = ["APP-Finance-Reports", "GRP-ITAR-Technical-Data"];
export const SOD: [string, string, string][] = [
  ["APP-ERP-Purchasing", "APP-ERP-Receiving", "One person could order goods and confirm they arrived, hiding goods that never came."],
  ["APP-MES-Operator", "APP-QMS-Inspection-Signoff", "One person could make a flight part and sign off its own inspection."],
  ["ROLE-Domain-Admin", "ROLE-Security-Log-Admin", "One person could make privileged changes and then clear the logs that record them."],
  ["APP-ERP-Vendor-Master", "APP-ERP-AP-Approve", "One person could create a fake supplier and approve payment to it."],
  ["APP-ERP-AP-Entry", "APP-ERP-AP-Approve", "One person could enter and approve their own invoice."],
];
export const ALL_GROUPS = [...new Set([...Object.values(ROLES).flat(), ...REQUESTABLE, "ROLE-Global-Admin", "SVC-MES-Integration", "SVC-Backup-Operators"])].sort();
export const BASE = new Date(2026, 9, 5);
export const fmtDay = makeFmtDay(BASE);

const R = ROLES;
const CORE: Core[] = [
  ["catherine.aldous", "Catherine Aldous", "MA-40001", "Executive|President", "Board of Directors", { last: 0 }],
  ["desmond.achebe", "Desmond Achebe", "MA-40006", "Finance|Chief Financial Officer", "Catherine Aldous", { last: 0 }],
  // Planted: the Controller also holds vendor master access (SoD with AP approval).
  ["ruth.kaminski", "Ruth Kaminski", "MA-40011", "Finance|Controller", "Desmond Achebe", { groups: [...R["Finance|Controller"], "APP-ERP-Vendor-Master"] }],
  ["oscar.lindahl", "Oscar Lindahl", "MA-40017", "Finance|AP Manager", "Ruth Kaminski"],
  ["priya.venkataraman", "Priya Venkataraman", "MA-40023", "Finance|AP Specialist", "Oscar Lindahl"],
  ["miriam.hollander", "Miriam Hollander", "MA-40028", "Finance|Vendor Master Analyst", "Ruth Kaminski"],
  ["adaeze.okoro", "Adaeze Okoro", "MA-40034", "Supply Chain|Procurement Manager", "Desmond Achebe"],
  // Planted: a buyer who can also receive goods (SoD).
  ["ethan.calloway", "Ethan Calloway", "MA-40041", "Supply Chain|Buyer", "Adaeze Okoro", { groups: [...R["Supply Chain|Buyer"], "APP-ERP-Receiving"] }],
  ["marcus.delacroix", "Marcus Delacroix", "MA-40047", "Program Management|Program Manager", "Catherine Aldous"],
  ["gabriel.fontaine", "Gabriel Fontaine", "MA-40052", "Engineering|Engineering Manager", "Catherine Aldous"],
  ["yusuf.demir", "Yusuf Demir", "MA-40058", "Engineering|Design Engineer", "Gabriel Fontaine", { groups: [...R["Engineering|Design Engineer"], "GRP-ITAR-Technical-Data"] }],
  ["lena.hartmann", "Lena Hartmann", "MA-40063", "Engineering|Manufacturing Engineer", "Gabriel Fontaine"],
  ["raymond.cho", "Raymond Cho", "MA-40069", "Manufacturing|Production Manager", "Catherine Aldous"],
  ["delia.marquez", "Delia Marquez", "MA-40074", "Quality|Quality Manager", "Catherine Aldous"],
  // Planted: a machinist who can sign off inspections of their own work (SoD).
  ["tobias.renner", "Tobias Renner", "MA-40121", "Manufacturing|Machinist", "Raymond Cho", { groups: [...R["Manufacturing|Machinist"], "APP-QMS-Inspection-Signoff"] }],
  ["sharon.whitaker", "Sharon Whitaker", "MA-40080", "Security|Facility Security Officer", "Catherine Aldous"],
  ["rosalind.pryce", "Rosalind Pryce", "MA-40085", "HR|HR Manager", "Catherine Aldous"],
  ["kenji.watanabe", "Kenji Watanabe", "MA-40091", "IT|IT Manager", "Desmond Achebe"],
  // Planted: a sysadmin who can also administer the security logs (SoD).
  ["aleksander.nowak", "Aleksander Nowak", "MA-40096", "IT|Systems Administrator", "Kenji Watanabe", { groups: [...R["IT|Systems Administrator"], "ROLE-Security-Log-Admin"] }],
  ["brianna.cole", "Brianna Cole", "MA-40102", "IT|Service Desk Technician", "Kenji Watanabe"],
  ["dmitri.volkov", "Dmitri Volkov", "MA-40108", "IT|Systems Administrator", "Kenji Watanabe", { last: 0 }],
  // Planted: dormant accounts.
  ["walter.kessler", "Walter Kessler", "MA-40133", "Engineering|Design Engineer", "Gabriel Fontaine", { last: 143 }],
  ["irene.papadakis", "Irene Papadakis", "MA-40139", "Quality|Quality Inspector", "Delia Marquez", { last: 92 }],
  // Planted: resigned six days ago, still enabled and signing in.
  ["curtis.langley", "Curtis Langley", "MA-40146", "Manufacturing|Machinist", "Raymond Cho", { last: 2 }],
  ["nadia.farouk", "Nadia Farouk", "MA-40152", "Quality|Quality Inspector", "Delia Marquez"],
  ["joy.adeleke", "Joy Adeleke", "MA-40158", "Supply Chain|Buyer", "Adaeze Okoro"],
  ["samuel.ortiz", "Samuel Ortiz", "MA-40114", "Manufacturing|Machinist", "Raymond Cho", { enabled: false, groups: ["GRP-All-Staff", "APP-MES-Operator"], last: 250 }],
  ["ivan.petrenko", "Ivan Petrenko", "MA-C-2203", "Engineering|Engineering Contractor", "Gabriel Fontaine (sponsor)", { type: "Contractor", expiry: 2 }],
  ["amara.nwosu", "Amara Nwosu", "MA-40401", "Engineering|Design Engineer", "Gabriel Fontaine", { enabled: false, groups: [], last: null, mfa: false, preHire: true }],
  ["felix.moreau", "Felix Moreau", "MA-40402", "Manufacturing|Machinist", "Raymond Cho", { enabled: false, groups: [], last: null, mfa: false, preHire: true }],
  // Week-one ticket cast (see tickets.js).
  ["bernadette.quigley", "Bernadette Quigley", "MA-40161", "Quality|Quality Inspector", "Delia Marquez", { last: 3 }],
  ["wendell.haskins", "Wendell Haskins", "MA-40163", "Manufacturing|Machinist", "Raymond Cho", { locked: true }],
  ["fiona.galbraith", "Fiona Galbraith", "MA-40165", "Program Management|Program Manager", "Catherine Aldous"],
  ["cyrus.pennington", "Cyrus Pennington", "MA-40167", "Supply Chain|Receiving Clerk", "Adaeze Okoro"],
  ["lorna.breckenridge", "Lorna Breckenridge", "MA-40169", "Engineering|Design Engineer", "Gabriel Fontaine", { last: 89 }],
  ["thaddeus.okonjo", "Thaddeus Okonjo", "MA-40171", "Engineering|Design Engineer", "Gabriel Fontaine", { groups: [...R["Engineering|Design Engineer"], "GRP-ITAR-Technical-Data"] }],
  // Planted: leftover MES and timekeeping approval from covering for the manufacturing engineers.
  ["marguerite.ellison", "Marguerite Ellison", "MA-40173", "Engineering|Design Engineer", "Gabriel Fontaine", { groups: [...R["Engineering|Design Engineer"], "APP-MES-Engineering", "APP-Timekeeping-Approve"] }],
  ["harriet.vance", "Harriet Vance", "MA-40175", "Supply Chain|Buyer", "Adaeze Okoro", { last: 0 }],
  ["svc-nas-backup", "svc-nas-backup", "SVC-024", null, "Kenji Watanabe (owner)", { dept: "IT", title: "Service account: file server backup", type: "Service", groups: ["SVC-Backup-Operators"], last: 170, mfa: false }],
  ["svc-mes", "svc-mes", "SVC-021", null, "Kenji Watanabe (owner)", { dept: "IT", title: "Service account: MES integration", type: "Service", groups: ["SVC-MES-Integration"], last: 0, mfa: false }],
];
const FILLER: Filler[] = [
  ["Manufacturing|Machinist", 34, "Raymond Cho"],
  ["Quality|Quality Inspector", 8, "Delia Marquez"],
  ["Engineering|Design Engineer", 12, "Gabriel Fontaine"],
  ["Engineering|Manufacturing Engineer", 6, "Gabriel Fontaine"],
  ["Supply Chain|Buyer", 4, "Adaeze Okoro"],
  ["Supply Chain|Receiving Clerk", 4, "Adaeze Okoro"],
  ["Program Management|Program Manager", 3, "Catherine Aldous"],
  ["Finance|AP Specialist", 2, "Oscar Lindahl"],
  ["HR|HR Generalist", 2, "Rosalind Pryce"],
  ["IT|Security Analyst", 2, "Kenji Watanabe"],
  ["IT|Service Desk Technician", 2, "Kenji Watanabe"],
  ["Engineering|Engineering Contractor", 5, "Gabriel Fontaine (sponsor)"],
];
export const buildUsers = () => makeDirectory({
  roles: ROLES, core: CORE, filler: FILLER, seed: 20261205,
  empId: n => `MA-${n}`, firstEmp: 40200, conId: n => `MA-C-${2210 + n}`, contractorExpiry: [20, 90],
});

export const HR_FEED = [
  { type: "Hire", who: "Amara Nwosu", detail: "Design Engineer, Engineering. Manager: Gabriel Fontaine. Start date: today. U.S.-person verification: pending with the FSO.", when: 0 },
  { type: "Hire", who: "Felix Moreau", detail: "Machinist, Manufacturing. Manager: Raymond Cho. Start date: today.", when: 0 },
  { type: "Rehire", who: "Samuel Ortiz", detail: "Rehired as Machinist, Manufacturing. Manager: Raymond Cho. Previously Machinist (left Jan 2026).", when: 0 },
  { type: "Transfer", who: "Nadia Farouk", detail: "From Quality Inspector to Manufacturing Engineer, Engineering. New manager: Gabriel Fontaine. Effective today.", when: 0 },
  { type: "Termination", who: "Dmitri Volkov", detail: "Involuntary. Effective today, 9:00 AM. Holds domain administrator rights.", when: 0 },
  { type: "Leave of absence", who: "Joy Adeleke", detail: "Parental leave begins today. Expected return: Jan 11, 2027.", when: 0 },
  { type: "Contract end", who: "Ivan Petrenko", detail: "Contract end date on file: " + fmtDay(2) + ". Sponsor: Gabriel Fontaine.", when: -1 },
  { type: "Termination", who: "Curtis Langley", detail: "Voluntary resignation. Last day: " + fmtDay(-6) + ".", when: -6 },
];
