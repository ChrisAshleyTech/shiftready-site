// Coastline Credit Union runbook. A federally insured credit union meets GLBA's safeguarding
// duty (15 U.S.C. 6801(b)) through NCUA's rule, 12 CFR Part 748 and its Appendix A, not the
// FTC Safeguards Rule. Examiners use the FFIEC IT Examination Handbook. SOX doesn't apply to
// credit unions. Quoted regulation text is a US government work.
import { REQUESTABLE } from "./company";

const g = (x: string) => `<span class="mono">${x}</span>`;
const APPX_A = { label: "12 CFR Part 748, Appendix A", href: "https://www.ecfr.gov/current/title-12/part-748" };
const P748_1 = { label: "12 CFR 748.1(c)", href: "https://www.ecfr.gov/current/title-12/section-748.1" };
const GLBA = { label: "15 U.S.C. 6801(b)", href: "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title15-section6801&num=0&edition=prelim" };
const FFIEC = { label: "FFIEC IT Examination Handbook", href: "https://ithandbook.ffiec.gov/" };

export type Policy = { key: string; title: string; html: string; cite?: { label: string; href: string }[] };
export const POLICIES: Policy[] = [
  { key: "verify", title: "Identity verification", html: "Before any password, MFA or unlock action for a staff caller, confirm their employee ID <i>and</i> manager match the directory. If either doesn't match, don't proceed. Escalate suspected social engineering to the Information Security Officer. Member account changes are never made from an internal IT ticket." },
  { key: "joiners", title: "Joiners", html: "Enable the pre-hire account and grant exactly the birthright groups for the role. Teller and wire access start only after training sign-off. Never copy another user's access.", cite: [APPX_A] },
  { key: "movers", title: "Movers", html: "Update job info, remove the old role's groups, grant the new role's groups, on the effective date." },
  { key: "leavers", title: "Leavers", html: "Disable, revoke sessions, and remove all group memberships on the last day. Involuntary terminations of branch or payments staff are done before the person is told.", cite: [APPX_A] },
  { key: "loa", title: "Leave of absence", html: "Disable the account. Keep group memberships for the return. Staff on leave must not process member transactions." },
  { key: "rehires", title: "Rehires", html: "Enable, reset the password, remove prior-role access, grant the new role's groups." },
  { key: "requestable", title: "Requestable access", html: `${REQUESTABLE.map(g).join(" and ")} may be granted outside the role with documented manager approval.` },
  { key: "sod", title: "Separation of duties", html: "Never grant access that creates an SoD conflict below, regardless of approval. Wires, loans and card issuance always need two different people.", cite: [APPX_A, FFIEC] },
  { key: "dual", title: "Dual control for wires", html: `A wire is released only after a second person with ${g("APP-Wire-Approve")} verifies it. The initiator can never approve their own wire, and callback verification is required for member-requested wires over $10,000.` },
  { key: "priv", title: "Privileged roles", html: `${g("ROLE-Core-Security-Admin")} and ${g("ROLE-Global-Admin")} are never assigned by ticket. Privileged changes to the core system need approval from the Information Security Officer.` },
  { key: "inactive", title: "Inactive accounts", html: "Disable user accounts with no sign-in for more than 90 days. Pre-hires are excluded. Service accounts are never disabled by the desk; escalate them to the account owner." },
  { key: "contractors", title: "Contractors", html: "Accounts must have an expiry date. Extensions require sponsor approval and are capped at 90 days. Contractors never get member-data or payments access." },
  { key: "shared", title: "Shared accounts", html: "Prohibited, including shared teller-drawer logins. Every person gets a unique ID, so every transaction traces to one employee." },
  { key: "program", title: "Information security program", html: "Access controls are part of the credit union's written information security program, which the board approves. GLBA requires safeguards \"to insure the security and confidentiality of customer records and information.\"", cite: [GLBA, APPX_A] },
  { key: "compromised", title: "Compromised accounts", html: "Revoke sessions, reset the password, reset MFA, and escalate to Security. A reportable cyber incident must be reported to NCUA within 72 hours.", cite: [P748_1] },
];
export const POLICY = Object.fromEntries(POLICIES.map(p => [p.key, p]));
