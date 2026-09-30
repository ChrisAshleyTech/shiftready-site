// Harbor Health Network runbook. Each clause cites the HIPAA Security Rule provision it
// implements (45 CFR Part 164, Subpart C). Quoted regulation text is a US government work;
// provisions checked against eCFR, current as of Sep 25, 2026.
import { REQUESTABLE } from "./company";

const g = (x: string) => `<span class="mono">${x}</span>`;
const ECFR = "https://www.ecfr.gov/current/title-45";
const s308 = (p: string) => ({ label: `45 CFR 164.308${p}`, href: `${ECFR}/section-164.308` });
const s312 = (p: string) => ({ label: `45 CFR 164.312${p}`, href: `${ECFR}/section-164.312` });

export type Policy = { key: string; title: string; html: string; cite?: { label: string; href: string }[] };
export const POLICIES: Policy[] = [
  { key: "verify", title: "Identity verification", html: "Before any password, MFA or unlock action for a caller, confirm their employee ID <i>and</i> manager match the directory. If either doesn't match, don't proceed. Escalate suspected social engineering to Security and the Privacy Officer.", cite: [s312("(d)")] },
  { key: "joiners", title: "Joiners", html: "Enable the pre-hire account and grant exactly the birthright groups for the role. Clinical access starts on the hire date, never before. Never copy another user's access.", cite: [s308("(a)(4)(ii)(B)")] },
  { key: "movers", title: "Movers", html: "Update job info, remove the old role's groups, grant the new role's groups. HIPAA calls for procedures that \"establish, document, review, and modify a user's right of access.\"", cite: [s308("(a)(4)(ii)(C)")] },
  { key: "leavers", title: "Leavers", html: "Disable, revoke sessions, and remove all group memberships on the last day. Involuntary terminations are done before the person is told. HIPAA: \"Implement procedures for terminating access to electronic protected health information when the employment of, or other arrangement with, a workforce member ends.\"", cite: [s308("(a)(3)(ii)(C)")] },
  { key: "loa", title: "Leave of absence", html: "Disable the account. Keep group memberships for the return." },
  { key: "rehires", title: "Rehires", html: "Enable, reset the password, remove prior-role access, grant the new role's groups.", cite: [s308("(a)(4)(ii)(C)")] },
  { key: "requestable", title: "Requestable access", html: `${REQUESTABLE.map(g).join(" and ")} may be granted outside the role with documented manager approval, for the minimum access the job needs.` },
  { key: "sod", title: "Separation of duties", html: "Never grant access that creates an SoD conflict below, regardless of approval. Prescribing and dispensing always need two different people." },
  { key: "priv", title: "Privileged roles", html: `${g("ROLE-EHR-Security-Admin")} and ${g("ROLE-Global-Admin")} are never assigned by ticket. Privileged access needs Change Advisory Board approval and is reviewed monthly by the Privacy Officer.` },
  { key: "breakglass", title: "Emergency (break-glass) access", html: `${g("ROLE-EHR-BreakGlass")} is used only when normal access would delay patient care. Every use is logged and reviewed by the Privacy Officer within one business day. HIPAA requires procedures \"for obtaining necessary electronic protected health information during an emergency.\"`, cite: [s312("(a)(2)(ii)")] },
  { key: "inactive", title: "Inactive accounts", html: "Disable user accounts with no sign-in for more than 90 days. Pre-hires are excluded. Service accounts are never disabled by the desk; escalate them to the account owner." },
  { key: "contractors", title: "Agency staff", html: "Agency and contract accounts must have an expiry date matching the assignment. Extensions need sponsor approval and are capped at 90 days." },
  { key: "shared", title: "Shared accounts", html: "Prohibited, including shared workstation logins at nursing stations. HIPAA requires each user to have \"a unique name and/or number for identifying and tracking user identity.\"", cite: [s312("(a)(2)(i)")] },
  { key: "review", title: "Access and activity review", html: "EHR access is reviewed quarterly by managers, and the Privacy Officer reviews EHR audit reports monthly. HIPAA: \"Implement procedures to regularly review records of information system activity, such as audit logs, access reports, and security incident tracking reports.\"", cite: [s308("(a)(1)(ii)(D)"), s312("(b)")] },
  { key: "compromised", title: "Compromised accounts", html: "Revoke sessions, reset the password, reset MFA, and escalate to Security and the Privacy Officer. A compromised clinical account may be a reportable breach." },
];
export const POLICY = Object.fromEntries(POLICIES.map(p => [p.key, p]));
