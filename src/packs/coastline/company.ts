// Coastline Credit Union: a federally insured credit union with three branches. Fictional
// company; app names are generic (see TOOL_NOTES for the real products these usually are).
import { makeDirectory, type Core, type Filler } from "../lib/people";
import { makeFmtDay } from "../lib/util";

const STAFF = ["GRP-All-Staff", "APP-Office-Suite"];
export const ROLES: Record<string, string[]> = {
  "Executive|President and CEO": [...STAFF, "APP-Finance-Reports"],
  "Executive|Chief Financial Officer": [...STAFF, "APP-Finance-Reports"],
  "Executive|Chief Operating Officer": [...STAFF, "APP-Finance-Reports"],
  "Executive|Chief Lending Officer": [...STAFF, "APP-Loan-Approval", "APP-Finance-Reports"],
  "Branch|Branch Manager": [...STAFF, "APP-Core-Teller", "APP-Core-Account-Open", "APP-Finance-Reports"],
  "Branch|Head Teller": [...STAFF, "APP-Core-Teller", "APP-Wire-Initiate"],
  "Branch|Teller": [...STAFF, "APP-Core-Teller"],
  "Branch|Member Service Representative": [...STAFF, "APP-Core-Account-Open", "APP-Core-Maintenance"],
  "Lending|Lending Manager": [...STAFF, "APP-Loan-Approval", "APP-Loan-Servicing", "APP-Finance-Reports"],
  "Lending|Loan Officer": [...STAFF, "APP-Loan-Origination"],
  "Lending|Underwriter": [...STAFF, "APP-Loan-Approval"],
  "Lending|Loan Servicing Specialist": [...STAFF, "APP-Loan-Servicing"],
  "Lending|Collections Specialist": [...STAFF, "APP-Collections", "APP-Loan-Servicing"],
  "Operations|Payments Supervisor": [...STAFF, "APP-Wire-Approve", "APP-ACH-Origination"],
  "Operations|Payments Specialist": [...STAFF, "APP-Wire-Initiate", "APP-ACH-Origination"],
  "Operations|Card Services Specialist": [...STAFF, "APP-Card-Management"],
  "Compliance|BSA Officer": [...STAFF, "APP-BSA-Monitoring", "APP-Finance-Reports"],
  "Compliance|Compliance Analyst": [...STAFF, "APP-BSA-Monitoring"],
  "Finance|Controller": [...STAFF, "APP-GL-Post", "APP-AP-Approve", "APP-Finance-Reports"],
  "Finance|Accountant": [...STAFF, "APP-GL-Post"],
  "Finance|AP Specialist": [...STAFF, "APP-AP-Entry"],
  "Finance|Vendor Management Analyst": [...STAFF, "APP-Vendor-Master"],
  "HR|HR Manager": [...STAFF, "APP-HR-Payroll"],
  "HR|HR Generalist": [...STAFF, "APP-HR-Payroll"],
  "IT|IT Manager": [...STAFF, "APP-Service-Desk", "ROLE-User-Admin"],
  "IT|Core Systems Administrator": [...STAFF, "APP-Service-Desk", "ROLE-Core-Security-Admin"],
  "IT|Digital Banking Specialist": [...STAFF, "APP-Digital-Banking-Admin"],
  "IT|Service Desk Analyst": [...STAFF, "APP-Service-Desk", "ROLE-Helpdesk-Admin"],
  "IT|IT Contractor": ["GRP-Contractors", "APP-Service-Desk"],
  "Marketing|Marketing Coordinator": [...STAFF],
};
export const REQUESTABLE = ["APP-Finance-Reports"];
export const SOD: [string, string, string][] = [
  ["APP-Wire-Initiate", "APP-Wire-Approve", "One person could send a wire transfer and approve it themselves."],
  ["APP-Loan-Origination", "APP-Loan-Approval", "One person could take a loan application and approve it, including for themselves or a relative."],
  ["APP-Core-Maintenance", "APP-Card-Management", "One person could change a member's address and then order a new debit card to it: a classic account takeover."],
  ["APP-Core-Teller", "APP-GL-Post", "One person could take cash at the window and cover the shortage with a ledger entry."],
  ["APP-Vendor-Master", "APP-AP-Approve", "One person could create a fake vendor and approve payment to it."],
  ["APP-AP-Entry", "APP-AP-Approve", "One person could enter and approve their own invoice."],
];
export const ALL_GROUPS = [...new Set([...Object.values(ROLES).flat(), "ROLE-Global-Admin", "SVC-Core-Batch", "SVC-Card-Processor"])].sort();
export const BASE = new Date(2026, 9, 5);
export const fmtDay = makeFmtDay(BASE);

const R = ROLES;
const CORE: Core[] = [
  ["eleanor.vasquez", "Eleanor Vasquez", "60001", "Executive|President and CEO", "Board of Directors", { last: 0 }],
  ["kwame.asante", "Kwame Asante", "60004", "Executive|Chief Financial Officer", "Eleanor Vasquez", { last: 0 }],
  ["linnea.berg", "Linnea Berg", "60007", "Executive|Chief Operating Officer", "Eleanor Vasquez"],
  ["arturo.mejia", "Arturo Mejia", "60010", "Executive|Chief Lending Officer", "Eleanor Vasquez"],
  // Planted: the Controller also holds vendor master access (SoD with AP approval).
  ["martina.kovac", "Martina Kovac", "60015", "Finance|Controller", "Kwame Asante", { groups: [...R["Finance|Controller"], "APP-Vendor-Master"] }],
  ["joel.sandoval", "Joel Sandoval", "60019", "Finance|Vendor Management Analyst", "Martina Kovac"],
  ["amy.thibodeaux", "Amy Thibodeaux", "60024", "Finance|AP Specialist", "Martina Kovac"],
  ["patrice.duval", "Patrice Duval", "60028", "Branch|Branch Manager", "Linnea Berg"],
  ["caroline.ashby", "Caroline Ashby", "60033", "Branch|Branch Manager", "Linnea Berg"],
  // Planted: left Jul 31; account still enabled and used after that.
  ["howard.teague", "Howard Teague", "60037", "Branch|Branch Manager", "Linnea Berg", { last: 55 }],
  // Planted: a head teller who can also approve wires (SoD).
  ["rosa.villanueva", "Rosa Villanueva", "60042", "Branch|Head Teller", "Patrice Duval", { groups: [...R["Branch|Head Teller"], "APP-Wire-Approve"] }],
  ["nathan.greer", "Nathan Greer", "60046", "Lending|Lending Manager", "Arturo Mejia"],
  // Planted: a loan officer who can also approve loans (SoD).
  ["trevor.boateng", "Trevor Boateng", "60051", "Lending|Loan Officer", "Nathan Greer", { groups: [...R["Lending|Loan Officer"], "APP-Loan-Approval"] }],
  // Planted: a member service rep who can also issue cards (SoD).
  ["lucia.bianchi", "Lucia Bianchi", "60057", "Branch|Member Service Representative", "Caroline Ashby", { groups: [...R["Branch|Member Service Representative"], "APP-Card-Management"] }],
  ["simone.achterberg", "Simone Achterberg", "60062", "Operations|Payments Supervisor", "Linnea Berg"],
  ["harriet.osei", "Harriet Osei", "60066", "Compliance|BSA Officer", "Eleanor Vasquez"],
  ["dennis.mulroney", "Dennis Mulroney", "60071", "IT|IT Manager", "Linnea Berg"],
  ["priscilla.ng", "Priscilla Ng", "60075", "IT|Core Systems Administrator", "Dennis Mulroney"],
  ["gwen.halloran", "Gwen Halloran", "60080", "HR|HR Manager", "Eleanor Vasquez"],
  // Planted: dormant accounts.
  ["gordon.pell", "Gordon Pell", "60112", "Lending|Loan Servicing Specialist", "Nathan Greer", { last: 188 }],
  ["yvette.lambert", "Yvette Lambert", "60118", "Branch|Teller", "Caroline Ashby", { last: 104 }],
  // Planted: resigned eight days ago, still enabled and signing in.
  ["diego.salcedo", "Diego Salcedo", "60124", "Operations|Payments Specialist", "Simone Achterberg", { last: 3 }],
  ["mei-ling.chu", "Mei-Ling Chu", "60129", "Branch|Teller", "Patrice Duval"],
  ["colton.reyes", "Colton Reyes", "60133", "Branch|Teller", "Patrice Duval", { last: 0 }],
  ["farah.qureshi", "Farah Qureshi", "60138", "Lending|Underwriter", "Nathan Greer"],
  ["brendan.oshea", "Brendan O'Shea", "60095", "Branch|Member Service Representative", "Caroline Ashby", { enabled: false, groups: ["GRP-All-Staff", "APP-Core-Account-Open"], last: 380 }],
  ["raj.malhotra", "Raj Malhotra", "C-7701", "IT|IT Contractor", "Dennis Mulroney (sponsor)", { type: "Contractor", expiry: 2 }],
  ["kiara.thompson", "Kiara Thompson", "60401", "Branch|Teller", "Caroline Ashby", { enabled: false, groups: [], last: null, mfa: false, preHire: true }],
  ["omar.farouk", "Omar Farouk", "60402", "Lending|Loan Officer", "Nathan Greer", { enabled: false, groups: [], last: null, mfa: false, preHire: true }],
  // The shift's ticket cast (see tickets.js).
  ["rosalyn.whitcombe", "Rosalyn Whitcombe", "60141", "Lending|Loan Servicing Specialist", "Nathan Greer", { last: 3 }],
  ["ambrose.kittredge", "Ambrose Kittredge", "60143", "Branch|Teller", "Patrice Duval", { locked: true }],
  ["clementine.rourke", "Clementine Rourke", "60145", "Lending|Loan Officer", "Nathan Greer"],
  ["leopold.fairweather", "Leopold Fairweather", "60147", "Branch|Member Service Representative", "Caroline Ashby"],
  ["imelda.prescott", "Imelda Prescott", "60149", "Lending|Collections Specialist", "Nathan Greer"],
  ["margery.dunleavy", "Margery Dunleavy", "60151", "Branch|Member Service Representative", "Caroline Ashby", { last: 89 }],
  ["wesley.tranter", "Wesley Tranter", "60153", "IT|Service Desk Analyst", "Dennis Mulroney"],
  ["barnaby.whitlock", "Barnaby Whitlock", "60155", "Operations|Card Services Specialist", "Simone Achterberg", { groups: [...R["Operations|Card Services Specialist"], "APP-Finance-Reports"] }],
  // Planted: leftover servicing and collections access from a year in collections.
  ["vivienne.strand", "Vivienne Strand", "60157", "Lending|Loan Officer", "Nathan Greer", { groups: [...R["Lending|Loan Officer"], "APP-Loan-Servicing", "APP-Collections"] }],
  ["rupert.sinclair", "Rupert Sinclair", "60159", "Operations|Payments Specialist", "Simone Achterberg", { last: 0 }],
  ["svc-card-files", "svc-card-files", "SVC-034", null, "Priscilla Ng (owner)", { dept: "IT", title: "Service account: card processor file transfer", type: "Service", groups: ["SVC-Card-Processor"], last: 140, mfa: false }],
  ["svc-core-batch", "svc-core-batch", "SVC-031", null, "Priscilla Ng (owner)", { dept: "IT", title: "Service account: core nightly batch", type: "Service", groups: ["SVC-Core-Batch"], last: 0, mfa: false }],
];
const BRANCHES = ["Patrice Duval", "Caroline Ashby", "Howard Teague"];
const FILLER: Filler[] = [
  ["Branch|Teller", 24, BRANCHES],
  ["Branch|Head Teller", 2, ["Caroline Ashby", "Howard Teague"]],
  ["Branch|Member Service Representative", 15, BRANCHES],
  ["Lending|Loan Officer", 8, "Nathan Greer"],
  ["Lending|Underwriter", 4, "Nathan Greer"],
  ["Lending|Loan Servicing Specialist", 5, "Nathan Greer"],
  ["Lending|Collections Specialist", 5, "Nathan Greer"],
  ["Operations|Payments Specialist", 4, "Simone Achterberg"],
  ["Operations|Card Services Specialist", 5, "Simone Achterberg"],
  ["Compliance|Compliance Analyst", 3, "Harriet Osei"],
  ["Finance|Accountant", 3, "Martina Kovac"],
  ["Finance|AP Specialist", 2, "Martina Kovac"],
  ["HR|HR Generalist", 2, "Gwen Halloran"],
  ["IT|Service Desk Analyst", 3, "Dennis Mulroney"],
  ["IT|Digital Banking Specialist", 2, "Dennis Mulroney"],
  ["Marketing|Marketing Coordinator", 3, "Linnea Berg"],
  ["IT|IT Contractor", 3, "Dennis Mulroney (sponsor)"],
];
export const buildUsers = () => makeDirectory({
  roles: ROLES, core: CORE, filler: FILLER, seed: 20270105,
  empId: n => String(n), firstEmp: 60200, conId: n => `C-${7710 + n}`, contractorExpiry: [25, 90],
});

export const HR_FEED = [
  { type: "Hire", who: "Kiara Thompson", detail: "Teller, Branch (Harborside). Manager: Caroline Ashby. Start date: today.", when: 0 },
  { type: "Hire", who: "Omar Farouk", detail: "Loan Officer, Lending. Manager: Nathan Greer. Start date: today.", when: 0 },
  { type: "Rehire", who: "Brendan O'Shea", detail: "Rehired as Member Service Representative, Branch. Manager: Caroline Ashby. Previously Member Service Representative (left Sep 2025).", when: 0 },
  { type: "Transfer", who: "Mei-Ling Chu", detail: "From Teller to Member Service Representative, Branch. Same manager. Effective today.", when: 0 },
  { type: "Termination", who: "Colton Reyes", detail: "Involuntary, following a cash-drawer investigation. Effective today, 8:30 AM.", when: 0 },
  { type: "Leave of absence", who: "Farah Qureshi", detail: "Leave begins today. Expected return: Nov 30, 2026.", when: 0 },
  { type: "Contract end", who: "Raj Malhotra", detail: "Contract end date on file: " + fmtDay(2) + ". Sponsor: Dennis Mulroney.", when: -1 },
  { type: "Termination", who: "Diego Salcedo", detail: "Voluntary resignation. Last day: " + fmtDay(-8) + ".", when: -8 },
  { type: "Termination", who: "Howard Teague", detail: "Retirement. Last day: Jul 31, 2026. Branch now covered by Linnea Berg.", when: -66 },
];
