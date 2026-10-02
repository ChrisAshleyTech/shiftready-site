// Brightpath SaaS runbook. Clauses map to the AICPA Trust Services Criteria used in SOC 2
// reports. The criteria are copyrighted, so only their IDs appear here, with our own summaries
// in the runbook text, and a link to the AICPA's published criteria.
import { REQUESTABLE } from "./company";

const g = (x: string) => `<span class="mono">${x}</span>`;
const TSC = "https://www.aicpa-cima.com/resources/download/2017-trust-services-criteria-with-revised-points-of-focus-2022";
const cc = (id: string) => ({ label: `SOC 2 ${id} (AICPA Trust Services Criteria)`, href: TSC });

export type Policy = { key: string; title: string; html: string; cite?: { label: string; href: string }[] };
export const POLICIES: Policy[] = [
  { key: "verify", title: "Identity verification", html: "Before any password, MFA or device action for a caller, confirm their employee ID <i>and</i> manager match the directory. If either doesn't match, don't proceed. Escalate suspected social engineering to Security in the #security-incidents channel." },
  { key: "joiners", title: "Joiners", html: "Enable the pre-hire account and grant exactly the birthright groups for the role, on the start date. Access is only created from an HR record: no HR record, no account.", cite: [cc("CC6.2")] },
  { key: "movers", title: "Movers", html: "Update job info, remove the old role's groups, grant the new role's groups. Production access never carries over between teams.", cite: [cc("CC6.3")] },
  { key: "leavers", title: "Leavers", html: "Disable, revoke sessions and tokens, and remove all group memberships on the last day. For production administrators, rotate any shared secrets they could see.", cite: [cc("CC6.2"), cc("CC6.3")] },
  { key: "loa", title: "Leave of absence", html: "Disable the account. Keep group memberships for the return." },
  { key: "rehires", title: "Rehires", html: "Enable, reset the password, remove prior-role access, grant the new role's groups." },
  { key: "requestable", title: "Requestable access", html: `${g(REQUESTABLE[0])} may be granted with documented manager approval. ${g("APP-Prod-DB-Read")} (customer data) needs approval from the Head of Security, expires after 30 days, and is logged.`, cite: [cc("CC6.1")] },
  { key: "sod", title: "Separation of duties", html: "Never grant access that creates an SoD conflict below, regardless of approval. Code that reaches production is reviewed by someone other than its author.", cite: [cc("CC6.3"), cc("CC8.1")] },
  { key: "priv", title: "Privileged roles", html: `${g("ROLE-Cloud-Prod-Admin")}, ${g("ROLE-IdP-Admin")}, ${g("ROLE-SIEM-Admin")} and ${g("ROLE-Global-Admin")} are never assigned by ticket. Production admin sessions use just-in-time elevation with a ticket reference.`, cite: [cc("CC6.1"), cc("CC6.3")] },
  { key: "impersonation", title: "Customer impersonation", html: `${g("APP-Customer-Impersonation")} is only for support staff, only with the customer's consent recorded in the support ticket, and every session is logged.` },
  { key: "review", title: "Access reviews", html: "Managers review their team's access every quarter; production and customer-data access is reviewed monthly. Findings are fixed within 5 business days.", cite: [cc("CC6.2"), cc("CC6.3")] },
  { key: "inactive", title: "Inactive accounts", html: "Disable user accounts with no sign-in for more than 90 days. Pre-hires are excluded. Service accounts are never disabled by the desk; escalate them to the account owner." },
  { key: "contractors", title: "Contractors", html: "Accounts must have an expiry date. Extensions require sponsor approval and are capped at 90 days. Contractors never get production or customer-data access." },
  { key: "shared", title: "Shared accounts", html: "Prohibited. Every person gets a unique ID; shared service credentials live in the secrets manager, not with people." },
  { key: "compromised", title: "Compromised accounts", html: "Revoke sessions and tokens, reset the password, reset MFA, and escalate to Security. Security decides whether customers must be notified under their contracts.", cite: [cc("CC7.2")] },
];
export const POLICY = Object.fromEntries(POLICIES.map(p => [p.key, p]));
