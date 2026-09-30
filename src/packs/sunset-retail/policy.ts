// Sunset Retail Group runbook. Card data is in scope for PCI DSS v4.0.1; as a public company,
// Sunset's financial systems fall under SOX section 404. PCI DSS is copyrighted by the PCI
// Security Standards Council, so only requirement numbers appear here, with our own summaries
// in the runbook text, and a link to the Council's document library. SOX is a public law and
// may be quoted.
import { REQUESTABLE } from "./company";

const g = (x: string) => `<span class="mono">${x}</span>`;
const pci = (id: string) => ({ label: `PCI DSS v4.0.1 Req. ${id}`, href: "https://www.pcisecuritystandards.org/document_library/" });
const SOX = { label: "SOX section 404 (15 U.S.C. 7262)", href: "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title15-section7262&num=0&edition=prelim" };

export type Policy = { key: string; title: string; html: string; cite?: { label: string; href: string }[] };
export const POLICIES: Policy[] = [
  { key: "verify", title: "Identity verification", html: "Before any password, MFA or unlock action for a caller, confirm their employee ID <i>and</i> manager match the directory. If either doesn't match, don't proceed. Escalate suspected social engineering to Security. Store callers asking for POS overrides are verified the same way." },
  { key: "joiners", title: "Joiners", html: "Enable the pre-hire account and grant exactly the birthright groups for the role. Store staff get POS access only after register training.", cite: [pci("7.2.2"), pci("8.2.4")] },
  { key: "movers", title: "Movers", html: "Update job info, remove the old role's groups, grant the new role's groups. A move out of a store removes POS and cash-office access the same day.", cite: [pci("7.2.2")] },
  { key: "leavers", title: "Leavers", html: "Disable, revoke sessions, and remove all group memberships immediately on termination, including POS and cash-office access. Store managers' departures are processed before their last shift ends.", cite: [pci("8.2.5")] },
  { key: "loa", title: "Leave of absence", html: "Disable the account. Keep group memberships for the return." },
  { key: "rehires", title: "Rehires", html: "Enable, reset the password, remove prior-role access, grant the new role's groups." },
  { key: "requestable", title: "Requestable access", html: `${REQUESTABLE.map(g).join(" and ")} may be granted outside the role with documented manager approval.` },
  { key: "sod", title: "Separation of duties", html: "Never grant access that creates an SoD conflict below, regardless of approval. Refunds, cash counts, receiving and inventory write-offs always need two different people. Management is responsible for \"establishing and maintaining an adequate internal control structure and procedures for financial reporting.\"", cite: [SOX] },
  { key: "priv", title: "Privileged roles", html: `${g("ROLE-CDE-Admin")}, ${g("ROLE-Security-Log-Admin")} and ${g("ROLE-Global-Admin")} are never assigned by ticket. Access to the cardholder data environment needs MFA and CISO approval.`, cite: [pci("7.2.1"), pci("8.4.2")] },
  { key: "review", title: "Access reviews", html: "Managers review user accounts and access every six months, and cardholder-data-environment access every quarter. SOX-relevant systems are reviewed quarterly and the evidence goes to Internal Audit.", cite: [pci("7.2.4"), SOX] },
  { key: "inactive", title: "Inactive accounts", html: "Disable user accounts with no sign-in for more than 90 days. Pre-hires are excluded. Service accounts are never disabled by the desk; escalate them to the account owner.", cite: [pci("8.2.6")] },
  { key: "lockout", title: "Sign-in lockout", html: "Accounts lock after 6 failed sign-ins and stay locked for at least 30 minutes, or until the service desk verifies the user.", cite: [pci("8.3.4")] },
  { key: "contractors", title: "Seasonal and contract staff", html: "Seasonal and contract accounts must have an expiry date matching the assignment. Extensions need sponsor approval and are capped at 90 days." },
  { key: "shared", title: "Shared accounts", html: "Prohibited, including shared register logins. Every associate signs in to the POS with their own ID, so every refund and void traces to one person.", cite: [pci("8.2.1"), pci("8.2.2")] },
  { key: "compromised", title: "Compromised accounts", html: "Revoke sessions, reset the password, reset MFA, and escalate to Security. Suspected exposure of card data starts the incident response plan, which includes notifying the card brands through the acquirer." },
];
export const POLICY = Object.fromEntries(POLICIES.map(p => [p.key, p]));
