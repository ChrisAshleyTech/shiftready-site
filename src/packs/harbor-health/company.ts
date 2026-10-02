// Harbor Health Network: a community health network with two clinics and an outpatient
// specialty center. Fictional company; app names are generic (see TOOL_NOTES for the real
// products these usually are).
import { makeDirectory, type Core, type Filler } from "../lib/people";
import { makeFmtDay } from "../lib/util";

const STAFF = ["GRP-All-Staff", "APP-Office-Suite"];
const CLIN = [...STAFF, "GRP-Clinical-Staff"];
const PROVIDER = [...CLIN, "APP-EHR-Clinical", "APP-EHR-Orders-Sign", "APP-eRx-Controlled", "APP-PACS-Viewer", "APP-Lab-Results"];
export const ROLES: Record<string, string[]> = {
  "Executive|Chief Executive Officer": [...STAFF, "APP-Finance-Reports"],
  "Executive|Chief Medical Officer": [...PROVIDER],
  "Finance|Chief Financial Officer": [...STAFF, "APP-Finance-Reports"],
  "Finance|Controller": [...STAFF, "APP-ERP-GL-Post", "APP-ERP-AP-Approve", "APP-Finance-Reports"],
  "Finance|AP Manager": [...STAFF, "APP-ERP-AP-Approve", "APP-Finance-Reports"],
  "Finance|AP Specialist": [...STAFF, "APP-ERP-AP-Entry"],
  "Finance|Vendor Master Analyst": [...STAFF, "APP-ERP-Vendor-Master"],
  "Revenue Cycle|Revenue Cycle Manager": [...STAFF, "APP-EHR-Billing", "APP-Claims-Clearinghouse", "APP-Finance-Reports"],
  "Revenue Cycle|Billing Specialist": [...STAFF, "APP-EHR-Billing", "APP-Claims-Clearinghouse"],
  "Clinical|Physician": [...PROVIDER],
  "Clinical|Nurse Practitioner": [...PROVIDER],
  "Clinical|Nurse Manager": [...CLIN, "APP-EHR-Clinical", "APP-Lab-Results", "APP-EHR-Scheduling"],
  "Clinical|Registered Nurse": [...CLIN, "APP-EHR-Clinical", "APP-Lab-Results"],
  "Clinical|Medical Assistant": [...CLIN, "APP-EHR-Clinical"],
  "Clinical|Agency Nurse": ["GRP-Contractors", "GRP-Clinical-Staff", "APP-EHR-Clinical", "APP-Lab-Results"],
  "Pharmacy|Pharmacy Manager": [...CLIN, "APP-EHR-Clinical", "APP-Pharmacy-Dispense", "APP-Pharmacy-Inventory"],
  "Pharmacy|Pharmacist": [...CLIN, "APP-EHR-Clinical", "APP-Pharmacy-Dispense"],
  "Pharmacy|Pharmacy Technician": [...CLIN, "APP-Pharmacy-Inventory"],
  "Imaging|Radiologic Technologist": [...CLIN, "APP-EHR-Clinical", "APP-PACS-Viewer"],
  "Patient Access|Patient Access Manager": [...STAFF, "APP-EHR-Scheduling", "APP-Finance-Reports"],
  "Patient Access|Patient Access Representative": [...STAFF, "APP-EHR-Scheduling"],
  "HR|HR Director": [...STAFF, "APP-HR-Payroll"],
  "HR|HR Generalist": [...STAFF, "APP-HR-Payroll"],
  "IT|IT Director": [...STAFF, "APP-Service-Desk-Agent", "ROLE-User-Admin"],
  "IT|Service Desk Analyst": [...STAFF, "APP-Service-Desk-Agent", "ROLE-Helpdesk-Admin"],
  "IT|EHR Analyst": [...STAFF, "APP-Service-Desk-Agent", "ROLE-EHR-Security-Admin"],
  "Compliance|Privacy Officer": [...STAFF, "APP-EHR-Audit-Reports"],
  "Facilities|Facilities Manager": [...STAFF],
  "Facilities|Facilities Technician": [...STAFF],
};
export const REQUESTABLE = ["APP-Finance-Reports", "APP-PACS-Viewer"];
export const SOD: [string, string, string][] = [
  ["APP-EHR-Orders-Sign", "APP-Pharmacy-Dispense", "One person could order a medication, including a controlled substance, then verify and dispense it without a second check."],
  ["ROLE-EHR-Security-Admin", "APP-EHR-Audit-Reports", "One person could change EHR access and also review the audit trail that records those changes."],
  ["APP-ERP-Vendor-Master", "APP-ERP-AP-Approve", "One person could create a fake supplier and approve payment to it."],
  ["APP-ERP-AP-Entry", "APP-ERP-AP-Approve", "One person could enter and approve their own invoice."],
];
export const ALL_GROUPS = [...new Set([...Object.values(ROLES).flat(), "ROLE-EHR-BreakGlass", "ROLE-Global-Admin", "SVC-HL7-Interface", "SVC-Backup-Operators"])].sort();
export const BASE = new Date(2026, 9, 5);
export const fmtDay = makeFmtDay(BASE);

const R = ROLES;
const CORE: Core[] = [
  ["margaret.oyelaran", "Margaret Oyelaran", "HHN-10001", "Executive|Chief Executive Officer", "Board of Directors", { last: 0 }],
  ["samuel.achterberg", "Samuel Achterberg", "HHN-10004", "Executive|Chief Medical Officer", "Margaret Oyelaran"],
  ["renee.kowalski", "Renee Kowalski", "HHN-10007", "Finance|Chief Financial Officer", "Margaret Oyelaran", { last: 0 }],
  ["daniel.ferreira", "Daniel Ferreira", "HHN-10012", "Finance|Controller", "Renee Kowalski"],
  // Planted: holds vendor master access on top of AP approval (SoD).
  ["grace.liang", "Grace Liang", "HHN-10019", "Finance|AP Manager", "Daniel Ferreira", { groups: [...R["Finance|AP Manager"], "APP-ERP-Vendor-Master"] }],
  ["hannah.brooks", "Hannah Brooks", "HHN-10023", "Finance|Vendor Master Analyst", "Daniel Ferreira"],
  ["tomasz.nowicki", "Tomasz Nowicki", "HHN-10031", "Finance|AP Specialist", "Grace Liang"],
  ["luis.arroyo", "Luis Arroyo", "HHN-10036", "Revenue Cycle|Revenue Cycle Manager", "Renee Kowalski"],
  ["keisha.holloway", "Keisha Holloway", "HHN-10042", "Clinical|Nurse Manager", "Samuel Achterberg"],
  ["farid.rahimi", "Farid Rahimi", "HHN-10048", "Pharmacy|Pharmacy Manager", "Samuel Achterberg"],
  ["ana-lucia.ortega", "Ana Lucia Ortega", "HHN-10052", "Clinical|Physician", "Samuel Achterberg"],
  // Planted: a physician who kept pharmacy dispensing from a covering shift (SoD).
  ["jonathan.pike", "Jonathan Pike", "HHN-10057", "Clinical|Physician", "Samuel Achterberg", { groups: [...R["Clinical|Physician"], "APP-Pharmacy-Dispense"] }],
  ["carmen.velasquez", "Carmen Velasquez", "HHN-10063", "Patient Access|Patient Access Manager", "Margaret Oyelaran"],
  ["olivia.brandt", "Olivia Brandt", "HHN-10068", "HR|HR Director", "Margaret Oyelaran"],
  ["rashid.karimi", "Rashid Karimi", "HHN-10074", "IT|IT Director", "Renee Kowalski"],
  // Planted: the EHR security admin can also read the EHR audit reports (SoD).
  ["wen.zhao", "Wen Zhao", "HHN-10079", "IT|EHR Analyst", "Rashid Karimi", { groups: [...R["IT|EHR Analyst"], "APP-EHR-Audit-Reports"] }],
  ["kyle.morrison", "Kyle Morrison", "HHN-10083", "IT|Service Desk Analyst", "Rashid Karimi"],
  ["beatrice.njoroge", "Beatrice Njoroge", "HHN-10088", "Compliance|Privacy Officer", "Margaret Oyelaran"],
  // Planted: left in August; account still enabled and used after that.
  ["gregory.hale", "Gregory Hale", "HHN-10092", "Facilities|Facilities Manager", "Renee Kowalski", { last: 30 }],
  // Planted: dormant accounts.
  ["theresa.quinlan", "Theresa Quinlan", "HHN-10131", "Clinical|Registered Nurse", "Keisha Holloway", { last: 121 }],
  ["patrick.doyle", "Patrick Doyle", "HHN-10144", "Revenue Cycle|Billing Specialist", "Luis Arroyo", { last: 96 }],
  // Planted: resigned ten days ago, still enabled and signing in.
  ["maya.estrada", "Maya Estrada", "HHN-10158", "Clinical|Registered Nurse", "Keisha Holloway", { last: 1 }],
  ["leticia.moreno", "Leticia Moreno", "HHN-10166", "Patient Access|Patient Access Representative", "Carmen Velasquez"],
  ["victor.halvorsen", "Victor Halvorsen", "HHN-10172", "Pharmacy|Pharmacy Technician", "Farid Rahimi", { last: 0 }],
  ["siddharth.rao", "Siddharth Rao", "HHN-10179", "Clinical|Registered Nurse", "Keisha Holloway"],
  ["naomi.castell", "Naomi Castell", "HHN-10115", "Clinical|Medical Assistant", "Keisha Holloway", { enabled: false, groups: ["GRP-All-Staff", "GRP-Clinical-Staff", "APP-EHR-Clinical"], last: 300 }],
  ["tessa.lindqvist", "Tessa Lindqvist", "HHN-C-0412", "Clinical|Agency Nurse", "Keisha Holloway (sponsor)", { type: "Contractor", expiry: 2 }],
  ["jada.okonkwo", "Jada Okonkwo", "HHN-10401", "Clinical|Registered Nurse", "Keisha Holloway", { enabled: false, groups: [], last: null, mfa: false, preHire: true }],
  ["ben.castellanos", "Ben Castellanos", "HHN-10402", "Patient Access|Patient Access Representative", "Carmen Velasquez", { enabled: false, groups: [], last: null, mfa: false, preHire: true }],
  ["svc-hl7", "svc-hl7", "SVC-011", null, "Rashid Karimi (owner)", { dept: "IT", title: "Service account: HL7 interface engine", type: "Service", groups: ["SVC-HL7-Interface"], last: 0, mfa: false }],
  // The shift's callers, requesters and planted cases (see tickets.js).
  ["monique.dubois", "Monique Dubois", "HHN-10102", "Revenue Cycle|Billing Specialist", "Luis Arroyo", { last: 3 }],
  ["lorraine.pittman", "Lorraine Pittman", "HHN-10106", "Patient Access|Patient Access Representative", "Carmen Velasquez", { locked: true }],
  ["elias.morrow", "Elias Morrow", "HHN-10109", "Clinical|Physician", "Samuel Achterberg"],
  ["quentin.ashworth", "Quentin Ashworth", "HHN-10111", "Pharmacy|Pharmacist", "Farid Rahimi"],
  ["corinne.faulkner", "Corinne Faulkner", "HHN-10118", "Clinical|Registered Nurse", "Keisha Holloway"],
  // Planted: 89 days since sign-in, one day under the inactive threshold.
  ["gloria.fitzgerald", "Gloria Fitzgerald", "HHN-10121", "Clinical|Medical Assistant", "Keisha Holloway", { last: 89 }],
  // Planted: the Q3 access review marked her lab-results access for removal.
  ["delphine.okafor", "Delphine Okafor", "HHN-10124", "Clinical|Medical Assistant", "Keisha Holloway", { groups: [...R["Clinical|Medical Assistant"], "APP-Lab-Results"] }],
  // Planted: billing access left over from covering the billing office last winter.
  ["tamara.lindsey", "Tamara Lindsey", "HHN-10127", "Patient Access|Patient Access Representative", "Carmen Velasquez", { groups: [...R["Patient Access|Patient Access Representative"], "APP-EHR-Billing", "APP-Finance-Reports"] }],
  ["felicity.ward", "Felicity Ward", "HHN-10135", "Revenue Cycle|Billing Specialist", "Luis Arroyo", { last: 0 }],
  // Planted: no interactive sign-in for months, but the nightly EHR backups run as this account.
  ["svc-ehr-backup", "svc-ehr-backup", "SVC-014", null, "Rashid Karimi (owner)", { dept: "IT", title: "Service account: nightly EHR backups", type: "Service", groups: ["SVC-Backup-Operators"], last: 160, mfa: false }],
];
const FILLER: Filler[] = [
  ["Clinical|Registered Nurse", 30, "Keisha Holloway"],
  ["Clinical|Medical Assistant", 14, "Keisha Holloway"],
  ["Clinical|Physician", 6, "Samuel Achterberg"],
  ["Clinical|Nurse Practitioner", 5, "Samuel Achterberg"],
  ["Pharmacy|Pharmacist", 3, "Farid Rahimi"],
  ["Pharmacy|Pharmacy Technician", 4, "Farid Rahimi"],
  ["Imaging|Radiologic Technologist", 4, "Samuel Achterberg"],
  ["Patient Access|Patient Access Representative", 11, "Carmen Velasquez"],
  ["Revenue Cycle|Billing Specialist", 7, "Luis Arroyo"],
  ["Finance|AP Specialist", 3, "Grace Liang"],
  ["HR|HR Generalist", 3, "Olivia Brandt"],
  ["IT|Service Desk Analyst", 3, "Rashid Karimi"],
  ["Facilities|Facilities Technician", 4, "Gregory Hale"],
  ["Clinical|Agency Nurse", 5, "Keisha Holloway (sponsor)"],
];
export const buildUsers = () => makeDirectory({
  roles: ROLES, core: CORE, filler: FILLER, seed: 20261105,
  empId: n => `HHN-${n}`, firstEmp: 10200, conId: n => `HHN-C-${String(420 + n).padStart(4, "0")}`, contractorExpiry: [15, 85],
});

export const HR_FEED = [
  { type: "Hire", who: "Jada Okonkwo", detail: "Registered Nurse, Clinical. Manager: Keisha Holloway. Start date: today.", when: 0 },
  { type: "Hire", who: "Ben Castellanos", detail: "Patient Access Representative, Patient Access. Manager: Carmen Velasquez. Start date: today.", when: 0 },
  { type: "Rehire", who: "Naomi Castell", detail: "Rehired as Medical Assistant, Clinical. Manager: Keisha Holloway. Previously Medical Assistant (left Dec 2025).", when: 0 },
  { type: "Transfer", who: "Leticia Moreno", detail: "From Patient Access Representative to Billing Specialist, Revenue Cycle. New manager: Luis Arroyo. Effective today.", when: 0 },
  { type: "Termination", who: "Victor Halvorsen", detail: "Involuntary. Effective today, 10:00 AM. Pharmacy access to be removed before end of shift.", when: 0 },
  { type: "Leave of absence", who: "Siddharth Rao", detail: "Medical leave begins today. Expected return: Dec 14, 2026.", when: 0 },
  { type: "Contract end", who: "Tessa Lindqvist", detail: "Agency contract end date on file: " + fmtDay(2) + ". Sponsor: Keisha Holloway.", when: -1 },
  { type: "Termination", who: "Maya Estrada", detail: "Voluntary resignation. Last day: " + fmtDay(-10) + ".", when: -10 },
  { type: "Termination", who: "Gregory Hale", detail: "Voluntary resignation. Last day: Aug 14, 2026. Replacement not yet hired.", when: -52 },
];
