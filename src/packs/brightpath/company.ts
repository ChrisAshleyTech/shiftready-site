// Brightpath SaaS: a B2B scheduling platform with a SOC 2 Type II report. Fictional company;
// app names are generic (see TOOL_NOTES for the real products these usually are).
import { makeDirectory, type Core, type Filler } from "../lib/people";
import { makeFmtDay } from "../lib/util";

const STAFF = ["GRP-All-Staff", "APP-Office-Suite", "APP-Chat"];
const ENG = [...STAFF, "GRP-Engineering", "APP-Code-Repo", "APP-Observability", "APP-Cloud-Console-ReadOnly"];
export const ROLES: Record<string, string[]> = {
  "Executive|Chief Executive Officer": [...STAFF, "APP-Finance-Reports", "APP-CRM"],
  "Executive|Chief Technology Officer": [...ENG, "APP-Code-Review-Approve"],
  "Finance|Chief Financial Officer": [...STAFF, "APP-Finance-Reports", "APP-Billing-Platform"],
  "Finance|Controller": [...STAFF, "APP-ERP-GL-Post", "APP-ERP-AP-Approve", "APP-Finance-Reports"],
  "Finance|Accountant": [...STAFF, "APP-ERP-GL-Post", "APP-ERP-AP-Entry"],
  "Finance|Vendor Management Analyst": [...STAFF, "APP-ERP-Vendor-Master"],
  "Finance|Billing Specialist": [...STAFF, "APP-Billing-Platform", "APP-CRM"],
  "Engineering|Engineering Manager": [...ENG, "APP-Code-Review-Approve"],
  "Engineering|Senior Software Engineer": [...ENG, "APP-Code-Review-Approve"],
  "Engineering|Software Engineer": [...ENG],
  "Engineering|Site Reliability Engineer": [...ENG, "APP-CI-CD-Deploy-Prod", "ROLE-Cloud-Prod-Admin"],
  "Engineering|Engineering Contractor": ["GRP-Contractors", "APP-Chat", "APP-Code-Repo"],
  "Product|Product Manager": [...STAFF, "APP-Observability", "APP-CRM"],
  "Product|Product Designer": [...STAFF],
  "Security|Security Engineer": [...STAFF, "APP-Security-SIEM", "APP-Cloud-Console-ReadOnly"],
  "Security|Head of Security": [...STAFF, "APP-Security-SIEM", "ROLE-SIEM-Admin"],
  "IT|IT Administrator": [...STAFF, "APP-IT-Device-Mgmt", "ROLE-IdP-Admin"],
  "IT|IT Support Specialist": [...STAFF, "APP-IT-Device-Mgmt", "ROLE-Helpdesk-Admin"],
  "Customer Success|Customer Success Manager": [...STAFF, "APP-CRM", "APP-Support-Desk"],
  "Customer Success|Support Engineer": [...STAFF, "APP-Support-Desk", "APP-Customer-Impersonation"],
  "Customer Success|Support Manager": [...STAFF, "APP-Support-Desk", "APP-Customer-Impersonation"],
  "Sales|Sales Director": [...STAFF, "APP-CRM", "APP-Finance-Reports"],
  "Sales|Account Executive": [...STAFF, "APP-CRM"],
  "Sales|Sales Development Rep": [...STAFF, "APP-CRM"],
  "Marketing|Marketing Manager": [...STAFF, "APP-CRM"],
  "People|People Operations Lead": [...STAFF, "APP-HRIS"],
  "People|Recruiter": [...STAFF, "APP-HRIS"],
};
export const REQUESTABLE = ["APP-Finance-Reports", "APP-Prod-DB-Read"];
export const SOD: [string, string, string][] = [
  ["APP-Code-Review-Approve", "APP-CI-CD-Deploy-Prod", "One person could approve their own code change and deploy it to production without an independent review."],
  ["ROLE-Cloud-Prod-Admin", "ROLE-SIEM-Admin", "One person could change production and then delete the security logs that record it."],
  ["ROLE-IdP-Admin", "APP-HRIS", "One person could create a fake employee in HR and give them system access."],
  ["APP-ERP-Vendor-Master", "APP-ERP-AP-Approve", "One person could create a fake vendor and approve payment to it."],
  ["APP-ERP-AP-Entry", "APP-ERP-AP-Approve", "One person could enter and approve their own invoice."],
];
export const ALL_GROUPS = [...new Set([...Object.values(ROLES).flat(), ...REQUESTABLE, "ROLE-Global-Admin", "SVC-CI-Deployer", "SVC-Backup-Operators"])].sort();
export const BASE = new Date(2026, 9, 5);
export const fmtDay = makeFmtDay(BASE);

const R = ROLES;
const CORE: Core[] = [
  ["elena.marchetti", "Elena Marchetti", "BP-0001", "Executive|Chief Executive Officer", "Board of Directors", { last: 0 }],
  ["tunde.bakare", "Tunde Bakare", "BP-0003", "Executive|Chief Technology Officer", "Elena Marchetti", { last: 0 }],
  ["hollis.grant", "Hollis Grant", "BP-0005", "Finance|Chief Financial Officer", "Elena Marchetti"],
  // Planted: the Controller also holds vendor master access (SoD with AP approval).
  ["yolanda.reyes", "Yolanda Reyes", "BP-0009", "Finance|Controller", "Hollis Grant", { groups: [...R["Finance|Controller"], "APP-ERP-Vendor-Master"] }],
  ["bjorn.eklund", "Bjorn Eklund", "BP-0014", "Finance|Vendor Management Analyst", "Yolanda Reyes"],
  ["tamsin.okoro", "Tamsin Okoro", "BP-0018", "Engineering|Engineering Manager", "Tunde Bakare"],
  ["raul.dominguez", "Raul Dominguez", "BP-0022", "Engineering|Engineering Manager", "Tunde Bakare"],
  // Planted: a senior engineer who can also deploy to production (SoD).
  ["noah.lindqvist", "Noah Lindqvist", "BP-0027", "Engineering|Senior Software Engineer", "Tamsin Okoro", { groups: [...R["Engineering|Senior Software Engineer"], "APP-CI-CD-Deploy-Prod"] }],
  // Planted: an SRE who can also administer the SIEM (SoD).
  ["ines.carvalho", "Ines Carvalho", "BP-0031", "Engineering|Site Reliability Engineer", "Raul Dominguez", { groups: [...R["Engineering|Site Reliability Engineer"], "ROLE-SIEM-Admin"] }],
  ["adrienne.cole", "Adrienne Cole", "BP-0035", "Security|Head of Security", "Tunde Bakare"],
  ["jun.takahashi", "Jun Takahashi", "BP-0039", "Security|Security Engineer", "Adrienne Cole"],
  // Planted: the IdP admin also has HR system access (SoD).
  ["kai.mahoe", "Kai Mahoe", "BP-0043", "IT|IT Administrator", "Adrienne Cole", { groups: [...R["IT|IT Administrator"], "APP-HRIS"] }],
  ["priya.shankar", "Priya Shankar", "BP-0047", "Customer Success|Support Manager", "Elena Marchetti"],
  // Planted: a customer success manager with a support impersonation tool she doesn't need.
  ["zoe.whitman", "Zoe Whitman", "BP-0052", "Customer Success|Customer Success Manager", "Priya Shankar", { groups: [...R["Customer Success|Customer Success Manager"], "APP-Customer-Impersonation"] }],
  ["dante.russo", "Dante Russo", "BP-0056", "Sales|Sales Director", "Elena Marchetti"],
  ["freya.nilsen", "Freya Nilsen", "BP-0060", "People|People Operations Lead", "Elena Marchetti"],
  ["marisol.ibanez", "Marisol Ibanez", "BP-0064", "Product|Product Manager", "Tunde Bakare"],
  ["owen.fairclough", "Owen Fairclough", "BP-0068", "Marketing|Marketing Manager", "Elena Marchetti"],
  // Planted: dormant accounts.
  ["chris.albrecht", "Chris Albrecht", "BP-0103", "Sales|Account Executive", "Dante Russo", { last: 131 }],
  ["lorenzo.gatti", "Lorenzo Gatti", "BP-0109", "Engineering|Software Engineer", "Raul Dominguez", { last: 95 }],
  // Planted: resigned five days ago, still enabled and signing in.
  ["sienna.park", "Sienna Park", "BP-0114", "Customer Success|Customer Success Manager", "Priya Shankar", { last: 1 }],
  ["theo.vandenberg", "Theo Vandenberg", "BP-0120", "Engineering|Software Engineer", "Tamsin Okoro"],
  ["hana.kobayashi", "Hana Kobayashi", "BP-0124", "Engineering|Site Reliability Engineer", "Raul Dominguez", { last: 0 }],
  ["amelia.stroud", "Amelia Stroud", "BP-0129", "Sales|Account Executive", "Dante Russo"],
  ["gideon.mensah", "Gideon Mensah", "BP-0088", "Customer Success|Support Engineer", "Priya Shankar", { enabled: false, groups: ["GRP-All-Staff", "APP-Chat", "APP-Support-Desk"], last: 320 }],
  ["lukas.brenner", "Lukas Brenner", "BPC-0501", "Engineering|Engineering Contractor", "Tamsin Okoro (sponsor)", { type: "Contractor", expiry: 2 }],
  ["ayanna.brooks", "Ayanna Brooks", "BP-0401", "Engineering|Software Engineer", "Tamsin Okoro", { enabled: false, groups: [], last: null, mfa: false, preHire: true }],
  ["mateo.silva", "Mateo Silva", "BP-0402", "Sales|Sales Development Rep", "Dante Russo", { enabled: false, groups: [], last: null, mfa: false, preHire: true }],
  ["svc-ci-deployer", "svc-ci-deployer", "SVC-041", null, "Raul Dominguez (owner)", { dept: "Engineering", title: "Service account: CI/CD production deployer", type: "Service", groups: ["SVC-CI-Deployer"], last: 0, mfa: false }],
];
const FILLER: Filler[] = [
  ["Engineering|Software Engineer", 16, ["Tamsin Okoro", "Raul Dominguez"]],
  ["Engineering|Senior Software Engineer", 8, ["Tamsin Okoro", "Raul Dominguez"]],
  ["Engineering|Site Reliability Engineer", 3, "Raul Dominguez"],
  ["Customer Success|Support Engineer", 10, "Priya Shankar"],
  ["Customer Success|Customer Success Manager", 7, "Priya Shankar"],
  ["Sales|Account Executive", 9, "Dante Russo"],
  ["Sales|Sales Development Rep", 6, "Dante Russo"],
  ["Product|Product Manager", 3, "Marisol Ibanez"],
  ["Product|Product Designer", 4, "Marisol Ibanez"],
  ["Marketing|Marketing Manager", 3, "Owen Fairclough"],
  ["Finance|Accountant", 3, "Yolanda Reyes"],
  ["Finance|Billing Specialist", 2, "Yolanda Reyes"],
  ["Security|Security Engineer", 2, "Adrienne Cole"],
  ["IT|IT Support Specialist", 2, "Kai Mahoe"],
  ["People|Recruiter", 2, "Freya Nilsen"],
  ["Engineering|Engineering Contractor", 4, "Raul Dominguez (sponsor)"],
];
export const buildUsers = () => makeDirectory({
  roles: ROLES, core: CORE, filler: FILLER, seed: 20270205,
  empId: n => `BP-${String(n).padStart(4, "0")}`, firstEmp: 200, conId: n => `BPC-${510 + n}`, contractorExpiry: [20, 85],
});

export const HR_FEED = [
  { type: "Hire", who: "Ayanna Brooks", detail: "Software Engineer, Engineering. Manager: Tamsin Okoro. Start date: today.", when: 0 },
  { type: "Hire", who: "Mateo Silva", detail: "Sales Development Rep, Sales. Manager: Dante Russo. Start date: today.", when: 0 },
  { type: "Rehire", who: "Gideon Mensah", detail: "Rehired as Support Engineer, Customer Success. Manager: Priya Shankar. Previously Support Engineer (left Nov 2025).", when: 0 },
  { type: "Transfer", who: "Theo Vandenberg", detail: "From Software Engineer to Site Reliability Engineer, Engineering. New manager: Raul Dominguez. Effective today.", when: 0 },
  { type: "Termination", who: "Hana Kobayashi", detail: "Involuntary. Effective today, 11:00 AM. Holds production admin access.", when: 0 },
  { type: "Leave of absence", who: "Amelia Stroud", detail: "Leave begins today. Expected return: Jan 18, 2027.", when: 0 },
  { type: "Contract end", who: "Lukas Brenner", detail: "Contract end date on file: " + fmtDay(2) + ". Sponsor: Tamsin Okoro.", when: -1 },
  { type: "Termination", who: "Sienna Park", detail: "Voluntary resignation. Last day: " + fmtDay(-5) + ".", when: -5 },
];
