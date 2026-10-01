// Framework references for tickets and audit tasks (IAM + GRC and GRC-only paths).
// Content rules:
//   - NIST SP 800-53 Rev. 5 and the HIPAA Security Rule (45 CFR 164) are US government works, so
//     their text is quoted verbatim. NIST text is from NIST's OSCAL catalog (usnistgov/oscal-content),
//     with parameters shown as in the publication. HIPAA text is from the eCFR, checked 2026-09-29.
//   - ISO/IEC 27001:2022, SOC 2 (AICPA Trust Services Criteria) and PCI DSS v4.0.1 are copyrighted,
//     so we show only the ID (and ISO's control name) with our own plain-English summary, and link to
//     the official source. PCI DSS IDs were checked against Microsoft's PCI DSS v4 mapping pages.
import { SET } from "@/engine/ticketSet.js";

export type Fw = "nist" | "hipaa" | "iso" | "soc2" | "pci";
export type Ref = { fw: Fw; id: string; name?: string; family: string; quote?: string; summary?: string };

export const FRAMEWORKS: Record<Fw, { name: string; source: string; url: string; quoted: boolean }> = {
  nist: { name: "NIST SP 800-53 Rev. 5", source: "csrc.nist.gov", url: "https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final", quoted: true },
  hipaa: { name: "HIPAA Security Rule", source: "ecfr.gov", url: "https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164/subpart-C", quoted: true },
  iso: { name: "ISO/IEC 27001:2022", source: "iso.org", url: "https://www.iso.org/standard/27001", quoted: false },
  soc2: { name: "SOC 2 (Trust Services Criteria)", source: "aicpa-cima.com", url: "https://www.aicpa-cima.com/resources/landing/system-and-organization-controls-soc-suite-of-services", quoted: false },
  pci: { name: "PCI DSS v4.0.1", source: "pcisecuritystandards.org", url: "https://www.pcisecuritystandards.org/document_library/", quoted: false },
};

const N = (id: string, family: string, quote: string): Ref => ({ fw: "nist", id, family, quote });
const H = (id: string, family: string, quote: string): Ref => ({ fw: "hipaa", id, family, quote });
const I = (id: string, name: string, family: string, summary: string): Ref => ({ fw: "iso", id, name, family, summary });
const O = (id: string, family: string, summary: string): Ref => ({ fw: "soc2", id, family, summary });
const P = (id: string, family: string, summary: string): Ref => ({ fw: "pci", id, family, summary });

const AC = "Access Control (AC)", IA = "Identification and Authentication (IA)", PS = "Personnel Security (PS)", IR = "Incident Response (IR)",
  AU = "Audit and Accountability (AU)", CA = "Assessment, Authorization, and Monitoring (CA)", RA = "Risk Assessment (RA)", CP = "Contingency Planning (CP)";
const ADMIN = "Administrative safeguards (§ 164.308)", TECH = "Technical safeguards (§ 164.312)";
const ORG = "Organizational controls (Annex A.5)", TECHN = "Technological controls (Annex A.8)", PLAN = "Planning (clause 6)", IMPROVE = "Improvement (clause 10)";
const CC6 = "Logical and physical access controls (CC6)", CC7 = "System operations (CC7)", CC4 = "Monitoring activities (CC4)", CC3 = "Risk assessment (CC3)", A1 = "Availability (A1)";
const R7 = "Requirement 7: restrict access by business need to know", R8 = "Requirement 8: identify users and authenticate access", R10 = "Requirement 10: log and monitor all access", R12 = "Requirement 12: policies and programs";

// Each topic: what the requirements say, and why the ticket or task is an example of it.
export const TOPICS: Record<string, { label: string; why: string; refs: Ref[] }> = {
  verify: { label: "Caller verification", why: "Changing a password or MFA method for a caller hands over the keys to the account. Every framework expects you to prove who is asking first.", refs: [
    N("IA-5a", IA, "Manage system authenticators by: a. Verifying, as part of the initial authenticator distribution, the identity of the individual, group, role, service, or device receiving the authenticator;"),
    H("164.312(d)", TECH, "Standard: Person or entity authentication. Implement procedures to verify that a person or entity seeking access to electronic protected health information is the one claimed."),
    I("A.5.17", "Authentication information", ORG, "Issue, reset and manage passwords and other authentication information through a controlled process, including confirming who you are giving them to."),
    O("CC6.1", CC6, "Logical access is protected by security measures that identify and authenticate users before access is granted."),
    P("8.3.3", R8, "Confirm the user's identity before changing any of their authentication factors, such as a password reset or new MFA device."),
  ] },
  jml: { label: "Joiners, movers and returners", why: "Access should come from the role, not from a peer or a guess. Movers are where privilege creep starts, because old access is easy to forget.", refs: [
    N("AC-2f", AC, "Create, enable, modify, disable, and remove accounts in accordance with [Assignment: organization-defined policy, procedures, prerequisites, and criteria];"),
    N("PS-5c", PS, "Modify access authorization as needed to correspond with any changes in operational need due to reassignment or transfer;"),
    H("164.308(a)(4)(ii)(C)", ADMIN, "Access establishment and modification (Addressable). Implement policies and procedures that, based upon the covered entity's or the business associate's access authorization policies, establish, document, review, and modify a user's right of access to a workstation, transaction, program, or process."),
    I("A.5.18", "Access rights", ORG, "Grant, review, change and remove access rights according to your access control policy, including when someone changes job."),
    O("CC6.2", CC6, "New users are registered and authorized before credentials are issued, and access is removed when it's no longer authorized."),
    O("CC6.3", CC6, "Access is granted, changed and removed based on roles, least privilege and separation of duties."),
    P("7.2.2", R7, "Assign access, including privileged access, based on the person's job and only what the job needs."),
  ] },
  leaver: { label: "Leavers", why: "A terminated user's account is a door into the company. Disabling it, revoking sessions and removing access all have to happen, and on time.", refs: [
    N("PS-4a–b", PS, "Upon termination of individual employment: a. Disable system access within [Assignment: organization-defined time period]; b. Terminate or revoke any authenticators and credentials associated with the individual;"),
    H("164.308(a)(3)(ii)(C)", ADMIN, "Termination procedures (Addressable). Implement procedures for terminating access to electronic protected health information when the employment of, or other arrangement with, a workforce member ends or as required by determinations made as specified in paragraph (a)(3)(ii)(B) of this section."),
    I("A.5.18", "Access rights", ORG, "Remove a person's access rights when their employment or contract ends."),
    O("CC6.2", CC6, "Credentials and access are removed when a user is no longer authorized."),
    P("8.2.5", R8, "Revoke a terminated user's access immediately."),
  ] },
  leave: { label: "Leave of absence", why: "Leave means pause, not remove: disable sign-in, keep the role's access for the return, and record why.", refs: [
    N("AC-2f", AC, "Create, enable, modify, disable, and remove accounts in accordance with [Assignment: organization-defined policy, procedures, prerequisites, and criteria];"),
    H("164.308(a)(4)(ii)(C)", ADMIN, "Access establishment and modification (Addressable). Implement policies and procedures that, based upon the covered entity's or the business associate's access authorization policies, establish, document, review, and modify a user's right of access to a workstation, transaction, program, or process."),
    I("A.5.18", "Access rights", ORG, "Adjust access rights when someone's circumstances change, following your access policy."),
    O("CC6.2", CC6, "Access is changed or removed when a user's authorization changes."),
    P("8.2.4", R8, "Adding, removing or changing user IDs and their access needs proper approval and must match what was approved."),
  ] },
  request: { label: "Access requests", why: "An approval only authorizes access that policy allows. The analyst still checks the request is requestable and records the approval before granting.", refs: [
    N("AC-6", AC, "Employ the principle of least privilege, allowing only authorized accesses for users (or processes acting on behalf of users) that are necessary to accomplish assigned organizational tasks."),
    N("AC-2i", AC, "Authorize access to the system based on: 1. A valid access authorization; 2. Intended system usage; and 3. [Assignment: organization-defined attributes (as required)];"),
    H("164.308(a)(4)(ii)(B)", ADMIN, "Access authorization (Addressable). Implement policies and procedures for granting access to electronic protected health information, for example, through access to a workstation, transaction, program, process, or other mechanism."),
    I("A.5.15", "Access control", ORG, "Set access control rules based on business and security needs, and follow them when access is requested."),
    O("CC6.3", CC6, "Access is authorized and granted based on roles and least privilege."),
    P("7.2.3", R7, "Required privileges are approved by authorized people before they're granted."),
  ] },
  sod: { label: "Separation of duties", why: "One person able to enter and approve the same payment can commit fraud alone. SoD rules exist to make that impossible, whoever approves the request.", refs: [
    N("AC-5", AC, "a. Identify and document [Assignment: organization-defined duties of individuals]; and b. Define system access authorizations to support separation of duties."),
    I("A.5.3", "Segregation of duties", ORG, "Split conflicting duties and areas of responsibility between different people."),
    O("CC6.3", CC6, "Access decisions take separation of duties into account."),
    P("7.2.2", R7, "Assign access based on the job and least privilege, so no one holds more than their role needs."),
  ] },
  privileged: { label: "Privileged access", why: "Admin rights turn one mistake or one phished account into a company-wide incident. They're restricted to named roles, not granted for convenience.", refs: [
    N("AC-6(5)", AC, "Restrict privileged accounts on the system to [Assignment: organization-defined personnel or roles]."),
    H("164.308(a)(4)(ii)(B)", ADMIN, "Access authorization (Addressable). Implement policies and procedures for granting access to electronic protected health information, for example, through access to a workstation, transaction, program, process, or other mechanism."),
    I("A.8.2", "Privileged access rights", TECHN, "Restrict and manage the allocation and use of privileged access rights."),
    O("CC6.3", CC6, "Privileged access is authorized and limited based on roles and least privilege."),
    P("7.2.2", R7, "Privileged users get access based on their job and least privilege, like everyone else."),
  ] },
  shared: { label: "Shared accounts", why: "A shared login makes every action anonymous. Individual accountability is the point of identity management.", refs: [
    N("IA-2", IA, "Uniquely identify and authenticate organizational users and associate that unique identification with processes acting on behalf of those users."),
    H("164.312(a)(2)(i)", TECH, "Unique user identification (Required). Assign a unique name and/or number for identifying and tracking user identity."),
    I("A.5.16", "Identity management", ORG, "Manage the full life cycle of identities, and allow shared identities only when justified and approved."),
    O("CC6.1", CC6, "Users are uniquely identified and authenticated before they get access."),
    P("8.2.2", R8, "Use shared or generic accounts only in exceptional cases, with documented justification, management approval, and every action traceable to a person."),
  ] },
  inactive: { label: "Inactive accounts", why: "Dormant accounts are targets nobody is watching. A regular sweep closes them before an attacker finds them.", refs: [
    N("AC-2(3)", AC, "Disable accounts within [Assignment: organization-defined time period] when the accounts: (a) Have expired; (b) Are no longer associated with a user or individual; (c) Are in violation of organizational policy; or (d) Have been inactive for [Assignment: organization-defined time period]."),
    H("164.308(a)(4)(ii)(C)", ADMIN, "Access establishment and modification (Addressable). Implement policies and procedures that, based upon the covered entity's or the business associate's access authorization policies, establish, document, review, and modify a user's right of access to a workstation, transaction, program, or process."),
    I("A.5.18", "Access rights", ORG, "Review access rights regularly and remove what's no longer needed."),
    O("CC6.2", CC6, "Access that's no longer authorized is removed."),
    P("8.2.6", R8, "Remove or disable user accounts that have been inactive for 90 days."),
  ] },
  service: { label: "Service accounts", why: "Service accounts run systems, not people. Disabling one breaks production, so they go to their owner, who decides.", refs: [
    N("AC-2b", AC, "Assign account managers;"),
    N("CP-9d", CP, "Protect the confidentiality, integrity, and availability of backup information."),
    H("164.308(a)(7)(ii)(A)", ADMIN, "Data backup plan (Required). Establish and implement procedures to create and maintain retrievable exact copies of electronic protected health information."),
    I("A.8.13", "Information backup", TECHN, "Keep backups and test them according to an agreed backup policy."),
    O("A1.2", A1, "Backup and recovery infrastructure is managed so systems stay available."),
    P("8.6.1", R8, "Manage system and application accounts tightly, with interactive use only by approved exception."),
  ] },
  contractor: { label: "Contractors", why: "Contractor access should end when the contract does. An expiry date plus sponsor approval keeps it tied to the paperwork.", refs: [
    N("PS-7d", PS, "Require external providers to notify [Assignment: organization-defined personnel or roles] of any personnel transfers or terminations of external personnel who possess organizational credentials and/or badges, or who have system privileges within [Assignment: organization-defined time period];"),
    N("AC-2(3)", AC, "Disable accounts within [Assignment: organization-defined time period] when the accounts: (a) Have expired; (b) Are no longer associated with a user or individual; (c) Are in violation of organizational policy; or (d) Have been inactive for [Assignment: organization-defined time period]."),
    H("164.308(a)(3)(ii)(C)", ADMIN, "Termination procedures (Addressable). Implement procedures for terminating access to electronic protected health information when the employment of, or other arrangement with, a workforce member ends or as required by determinations made as specified in paragraph (a)(3)(ii)(B) of this section."),
    I("A.5.18", "Access rights", ORG, "Grant and remove access for external people according to the agreement that covers them."),
    O("CC6.2", CC6, "Access is registered, authorized and removed in line with the user's authorization."),
    P("8.2.4", R8, "Changes to user IDs and access, including extensions, need the right approval."),
  ] },
  incident: { label: "Incident containment", why: "When an account is at risk, contain it first (revoke, reset, disable), then hand it to Security. Half-contained is not contained.", refs: [
    N("IR-4a", IR, "Implement an incident handling capability for incidents that is consistent with the incident response plan and includes preparation, detection and analysis, containment, eradication, and recovery;"),
    H("164.308(a)(6)(ii)", ADMIN, "Implementation specification: Response and reporting (Required). Identify and respond to suspected or known security incidents; mitigate, to the extent practicable, harmful effects of security incidents that are known to the covered entity or business associate; and document security incidents and their outcomes."),
    I("A.5.26", "Response to information security incidents", ORG, "Respond to incidents following documented procedures."),
    O("CC7.4", CC7, "Identified security incidents are responded to with a defined process to contain, fix and communicate."),
    P("12.10.1", R12, "Have an incident response plan ready to start immediately when an incident is suspected."),
  ] },
  review: { label: "Access review actions", why: "An access review isn't finished when a manager clicks Revoke. It's finished when the access is gone.", refs: [
    N("AC-2j", AC, "Review accounts for compliance with account management requirements [Assignment: organization-defined frequency];"),
    H("164.308(a)(4)(ii)(C)", ADMIN, "Access establishment and modification (Addressable). Implement policies and procedures that, based upon the covered entity's or the business associate's access authorization policies, establish, document, review, and modify a user's right of access to a workstation, transaction, program, or process."),
    I("A.5.18", "Access rights", ORG, "Review access rights at planned intervals and act on the results."),
    O("CC6.2", CC6, "Access is removed when it's no longer authorized."),
    P("7.2.4", R7, "Review all user accounts and their access at least every six months, and fix anything inappropriate."),
  ] },
  evidence: { label: "Audit evidence", why: "Auditors rely on records the system produced, not on what anyone remembers. The audit log is the evidence.", refs: [
    N("AU-6a", AU, "Review and analyze system audit records [Assignment: organization-defined frequency] for indications of [Assignment: organization-defined inappropriate or unusual activity] and the potential impact of the inappropriate or unusual activity;"),
    H("164.308(a)(1)(ii)(D)", ADMIN, "Information system activity review (Required). Implement procedures to regularly review records of information system activity, such as audit logs, access reports, and security incident tracking reports."),
    I("A.8.15", "Logging", TECHN, "Produce, protect and analyse logs of activity so events can be reconstructed."),
    O("CC4.1", CC4, "The organization evaluates whether its controls are present and working."),
    P("10.4.1", R10, "Review security event and critical system logs at least daily."),
  ] },
  testing: { label: "Control testing", why: "Assessing a control means confirming it's designed well and then testing whether it actually operated, item by item.", refs: [
    N("CA-2d", CA, "Assess the controls in the system and its environment of operation [Assignment: organization-defined frequency] to determine the extent to which the controls are implemented correctly, operating as intended, and producing the desired outcome with respect to meeting established security and privacy requirements;"),
    H("164.308(a)(8)", ADMIN, "Standard: Evaluation. Perform a periodic technical and nontechnical evaluation, based initially upon the standards implemented under this rule and, subsequently, in response to environmental or operational changes affecting the security of electronic protected health information, that establishes the extent to which a covered entity's or business associate's security policies and procedures meet the requirements of this subpart."),
    I("A.5.35", "Independent review of information security", ORG, "Have your approach to information security reviewed independently at planned intervals."),
    O("CC4.1", CC4, "Ongoing or separate evaluations confirm that controls are present and functioning."),
  ] },
  finding: { label: "Reporting findings", why: "A finding turns test results into something management can act on: what happened, against which rule, why, and what it risks.", refs: [
    N("CA-2e", CA, "Produce a control assessment report that document the results of the assessment;"),
    H("164.308(a)(8)", ADMIN, "Standard: Evaluation. Perform a periodic technical and nontechnical evaluation, based initially upon the standards implemented under this rule and, subsequently, in response to environmental or operational changes affecting the security of electronic protected health information, that establishes the extent to which a covered entity's or business associate's security policies and procedures meet the requirements of this subpart."),
    I("A.5.35", "Independent review of information security", ORG, "Report the results of independent reviews to the management who asked for them."),
    O("CC4.2", CC4, "Control deficiencies are evaluated and reported promptly to the people responsible for fixing them."),
  ] },
  risk: { label: "Risk rating", why: "Rating likelihood and impact the same way every time lets management compare risks and fund the worst first.", refs: [
    N("RA-3a", RA, "Conduct a risk assessment, including: 1. Identifying threats to and vulnerabilities in the system; 2. Determining the likelihood and magnitude of harm from unauthorized access, use, disclosure, disruption, modification, or destruction of the system, the information it processes, stores, or transmits, and any related information; and"),
    H("164.308(a)(1)(ii)(A)", ADMIN, "Risk analysis (Required). Conduct an accurate and thorough assessment of the potential risks and vulnerabilities to the confidentiality, integrity, and availability of electronic protected health information held by the covered entity or business associate."),
    I("6.1.2", "Information security risk assessment", PLAN, "Define and apply a repeatable way to identify risks and rate their likelihood and consequences."),
    O("CC3.2", CC3, "Risks are identified and analyzed to decide how they should be managed."),
    P("12.3.1", R12, "Where the standard lets you set a frequency, base it on a documented, targeted risk analysis."),
  ] },
  remediation: { label: "Management response", why: "A finding closes only when the fix addresses the cause, has an owner and a date, and passes re-testing.", refs: [
    N("CA-5a", CA, "Develop a plan of action and milestones for the system to document the planned remediation actions of the organization to correct weaknesses or deficiencies noted during the assessment of the controls and to reduce or eliminate known vulnerabilities in the system; and"),
    H("164.308(a)(1)(ii)(B)", ADMIN, "Risk management (Required). Implement security measures sufficient to reduce risks and vulnerabilities to a reasonable and appropriate level to comply with § 164.306(a)."),
    I("10.2", "Nonconformity and corrective action", IMPROVE, "Fix nonconformities, deal with their causes, and check that the corrective action worked."),
    O("CC4.2", CC4, "Deficiencies go to the people responsible for corrective action, including management."),
  ] },
};

// Topics for each ticket (Pacific Crest).

// Topics for a ticket at the active company.
export const ticketTopics = (id: string): string[] => SET.topics[id] || [];


// Unique references for a set of topics, grouped by framework in a fixed order.
export function refsFor(topics: string[]) {
  const seen = new Set<string>(), out: Record<Fw, Ref[]> = { nist: [], hipaa: [], iso: [], soc2: [], pci: [] };
  topics.forEach(k => (TOPICS[k]?.refs || []).forEach(r => { const key = r.fw + r.id; if (!seen.has(key)) { seen.add(key); out[r.fw].push(r); } }));
  return out;
}
