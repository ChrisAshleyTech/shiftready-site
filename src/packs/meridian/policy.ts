// Meridian Aerospace runbook. Clauses cite NIST SP 800-171 Rev. 2, whose requirements are the
// CMMC Level 2 requirements (32 CFR 170.14). Quoted NIST text is a US government work; wording
// checked against the NIST publication, and the CMMC rule against eCFR (Sep 25, 2026).
import { REQUESTABLE } from "./company";

const g = (x: string) => `<span class="mono">${x}</span>`;
const n171 = (id: string) => ({ label: `NIST SP 800-171 Rev. 2, ${id}`, href: "https://csrc.nist.gov/pubs/sp/800/171/r2/upd1/final" });
const CMMC = { label: "32 CFR 170.14 (CMMC Level 2)", href: "https://www.ecfr.gov/current/title-32/section-170.14" };

export type Policy = { key: string; title: string; html: string; cite?: { label: string; href: string }[] };
export const POLICIES: Policy[] = [
  { key: "verify", title: "Identity verification", html: "Before any password, MFA or unlock action for a caller, confirm their employee ID <i>and</i> manager match the directory. If either doesn't match, don't proceed. Escalate suspected social engineering to the Security Analyst on call." },
  { key: "joiners", title: "Joiners", html: `Enable the pre-hire account and grant exactly the birthright groups for the role. ${g("GRP-CUI-Users")} requires completed CUI training on file. NIST: \"Screen individuals prior to authorizing access to organizational systems containing CUI.\"`, cite: [n171("3.9.1"), n171("3.1.1")] },
  { key: "movers", title: "Movers", html: "Update job info, remove the old role's groups, grant the new role's groups, on the effective date.", cite: [n171("3.9.2")] },
  { key: "leavers", title: "Leavers", html: "Disable, revoke sessions, and remove all group memberships on the last day. Terminations of administrators are done before the person is told. NIST: \"Ensure that organizational systems containing CUI are protected during and after personnel actions such as terminations and transfers.\"", cite: [n171("3.9.2")] },
  { key: "loa", title: "Leave of absence", html: "Disable the account. Keep group memberships for the return." },
  { key: "rehires", title: "Rehires", html: "Enable, reset the password, remove prior-role access, grant the new role's groups. CUI access waits for screening and training to be confirmed again.", cite: [n171("3.9.1")] },
  { key: "requestable", title: "Requestable access", html: `${g(REQUESTABLE[0])} may be granted with documented manager approval. ${g("GRP-ITAR-Technical-Data")} may be granted only after the Facility Security Officer confirms U.S.-person status in writing, as ITAR (22 CFR Parts 120 to 130) restricts access to export-controlled technical data.` },
  { key: "sod", title: "Separation of duties", html: "Never grant access that creates an SoD conflict below, regardless of approval. NIST: \"Separate the duties of individuals to reduce the risk of malevolent activity without collusion.\"", cite: [n171("3.1.4"), CMMC] },
  { key: "priv", title: "Privileged roles", html: `${g("ROLE-Domain-Admin")}, ${g("ROLE-Security-Log-Admin")} and ${g("ROLE-Global-Admin")} are never assigned by ticket. Administrators use separate non-privileged accounts for email and everyday work. NIST: \"Employ the principle of least privilege, including for specific security functions and privileged accounts.\"`, cite: [n171("3.1.5"), n171("3.1.6"), n171("3.1.7")] },
  { key: "mfa", title: "Multifactor authentication", html: "MFA is required for every network sign-in and for all privileged access. NIST: \"Use multifactor authentication for local and network access to privileged accounts and for network access to non-privileged accounts.\"", cite: [n171("3.5.3")] },
  { key: "lockout", title: "Sign-in lockout", html: "Accounts lock after 5 failed sign-ins. Unlock only after identity verification.", cite: [n171("3.1.8")] },
  { key: "inactive", title: "Inactive accounts", html: "Disable user accounts with no sign-in for more than 90 days. Pre-hires are excluded. Service accounts are never disabled by the desk; escalate them to the account owner. NIST: \"Disable identifiers after a defined period of inactivity.\"", cite: [n171("3.5.6")] },
  { key: "contractors", title: "Contractors", html: "Accounts must have an expiry date. Extensions require sponsor approval and are capped at 90 days. Contractors get CUI access only under a contract that flows down the CUI requirements." },
  { key: "shared", title: "Shared accounts", html: "Prohibited, including shared logins at machine terminals on the shop floor. Every person gets a unique ID." },
  { key: "compromised", title: "Compromised accounts", html: "Revoke sessions, reset the password, reset MFA, and escalate to Security. A cyber incident affecting covered defense information must be reported to the DoD within 72 hours under DFARS 252.204-7012.", cite: [{ label: "DFARS 252.204-7012", href: "https://www.acquisition.gov/dfars/252.204-7012-safeguarding-covered-defense-information-and-cyber-incident-reporting." }] },
];
export const POLICY = Object.fromEntries(POLICIES.map(p => [p.key, p]));
