// Framework references for tickets and audit tasks (IAM + GRC and GRC-only paths).
// Content rules:
//   - NIST SP 800-53 Rev. 5 and the HIPAA Security Rule (45 CFR 164) are US government works, so
//     their text is quoted verbatim. NIST text is from NIST's OSCAL catalog (usnistgov/oscal-content),
//     with parameters shown as in the publication. HIPAA text is from the eCFR, checked 2026-09-29.
//   - ISO/IEC 27001:2022, SOC 2 (AICPA Trust Services Criteria) and PCI DSS v4.0.1 are copyrighted,
//     so we show only the ID (and ISO's control name) with our own plain-English summary, and link to
//     the official source. PCI DSS IDs were checked against Microsoft's PCI DSS v4 mapping pages.
//   - NIST SP 800-171 Rev. 2 (CMMC Level 2), 12 CFR Part 748 Appendix A (NCUA's GLBA safeguards
//     guidelines) and SOX IT general controls get our own summaries too, with the requirement ID.
//     SOX has no control catalogue of its own, so its entries name the ITGC area auditors test.
// Each company shows only the frameworks it answers to (CompanyPack.fw), in its own order.
import { SET } from "@/engine/ticketSet.js";
import type { Fw } from "@/packs/types";

export type { Fw } from "@/packs/types";
export type Ref = { fw: Fw; id: string; name?: string; family: string; quote?: string; summary?: string };

export const FRAMEWORKS: Record<Fw, { name: string; source: string; url: string; quoted: boolean }> = {
  nist: { name: "NIST SP 800-53 Rev. 5", source: "csrc.nist.gov", url: "https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final", quoted: true },
  hipaa: { name: "HIPAA Security Rule", source: "ecfr.gov", url: "https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164/subpart-C", quoted: true },
  iso: { name: "ISO/IEC 27001:2022", source: "iso.org", url: "https://www.iso.org/standard/27001", quoted: false },
  soc2: { name: "SOC 2 (Trust Services Criteria)", source: "aicpa-cima.com", url: "https://www.aicpa-cima.com/resources/landing/system-and-organization-controls-soc-suite-of-services", quoted: false },
  pci: { name: "PCI DSS v4.0.1", source: "pcisecuritystandards.org", url: "https://www.pcisecuritystandards.org/document_library/", quoted: false },
  nist171: { name: "NIST SP 800-171 Rev. 2 (CMMC Level 2)", source: "csrc.nist.gov", url: "https://csrc.nist.gov/pubs/sp/800/171/r2/upd1/final", quoted: false },
  glba: { name: "GLBA safeguards (12 CFR Part 748, Appendix A)", source: "ecfr.gov", url: "https://www.ecfr.gov/current/title-12/chapter-VII/subchapter-A/part-748", quoted: false },
  sox: { name: "SOX IT general controls", source: "pcaobus.org", url: "https://pcaobus.org/oversight/standards/auditing-standards/details/AS2201", quoted: false },
};
// Every framework, in the order a panel would list them.
export const FW_ORDER: Fw[] = ["nist", "nist171", "hipaa", "glba", "sox", "iso", "soc2", "pci"];

const N = (id: string, family: string, quote: string): Ref => ({ fw: "nist", id, family, quote });
const H = (id: string, family: string, quote: string): Ref => ({ fw: "hipaa", id, family, quote });
const I = (id: string, name: string, family: string, summary: string): Ref => ({ fw: "iso", id, name, family, summary });
const O = (id: string, family: string, summary: string): Ref => ({ fw: "soc2", id, family, summary });
const P = (id: string, family: string, summary: string): Ref => ({ fw: "pci", id, family, summary });
const S7 = (id: string, family: string, summary: string): Ref => ({ fw: "nist171", id, family, summary });
const G = (id: string, family: string, summary: string): Ref => ({ fw: "glba", id, family, summary });
const X = (id: string, family: string, summary: string): Ref => ({ fw: "sox", id, family, summary });

const AC = "Access Control (AC)", IA = "Identification and Authentication (IA)", PS = "Personnel Security (PS)", IR = "Incident Response (IR)",
  AU = "Audit and Accountability (AU)", CA = "Assessment, Authorization, and Monitoring (CA)", RA = "Risk Assessment (RA)", CP = "Contingency Planning (CP)";
const ADMIN = "Administrative safeguards (§ 164.308)", TECH = "Technical safeguards (§ 164.312)";
const ORG = "Organizational controls (Annex A.5)", TECHN = "Technological controls (Annex A.8)", PLAN = "Planning (clause 6)", IMPROVE = "Improvement (clause 10)";
const CC6 = "Logical and physical access controls (CC6)", CC7 = "System operations (CC7)", CC4 = "Monitoring activities (CC4)", CC3 = "Risk assessment (CC3)", A1 = "Availability (A1)";
const F1 = "Access Control (3.1)", F3 = "Audit and Accountability (3.3)", F5 = "Identification and Authentication (3.5)", F6 = "Incident Response (3.6)",
  F8 = "Media Protection (3.8)", F9 = "Personnel Security (3.9)", F11 = "Risk Assessment (3.11)", F12 = "Security Assessment (3.12)";
const GC = "Manage and control risk (III.C)", GB = "Assess risk (III.B)", GD = "Oversee service providers (III.D)", GE = "Adjust the program (III.E)", GF = "Report to the board (III.F)";
const XA = "Access to programs and data", XO = "Computer operations", XM = "Monitoring and deficiencies";
const R7 = "Requirement 7: restrict access by business need to know", R8 = "Requirement 8: identify users and authenticate access", R10 = "Requirement 10: log and monitor all access", R12 = "Requirement 12: policies and programs";

// Each topic: what the requirements say, and why the ticket or task is an example of it.
export const TOPICS: Record<string, { label: string; why: string; refs: Ref[] }> = {
  verify: { label: "Caller verification", why: "Changing a password or MFA method for a caller hands over the keys to the account. Every framework expects you to prove who is asking first.", refs: [
    N("IA-5a", IA, "Manage system authenticators by: a. Verifying, as part of the initial authenticator distribution, the identity of the individual, group, role, service, or device receiving the authenticator;"),
    H("164.312(d)", TECH, "Standard: Person or entity authentication. Implement procedures to verify that a person or entity seeking access to electronic protected health information is the one claimed."),
    I("A.5.17", "Authentication information", ORG, "Issue, reset and manage passwords and other authentication information through a controlled process, including confirming who you are giving them to."),
    O("CC6.1", CC6, "Logical access is protected by security measures that identify and authenticate users before access is granted."),
    P("8.3.3", R8, "Confirm the user's identity before changing any of their authentication factors, such as a password reset or new MFA device."),
    S7("3.5.2", F5, "Confirm a user's identity before giving access, which includes before resetting their password or MFA."),
    G("III.C.1.a", GC, "Use access controls that authenticate people, and stop staff handing access to someone who poses as an authorized person."),
    X("Authentication", XA, "Confirm who is asking before resetting credentials to systems that feed the financial statements."),
  ] },
  jml: { label: "Joiners, movers and returners", why: "Access should come from the role, not from a peer or a guess. Movers are where privilege creep starts, because old access is easy to forget.", refs: [
    N("AC-2f", AC, "Create, enable, modify, disable, and remove accounts in accordance with [Assignment: organization-defined policy, procedures, prerequisites, and criteria];"),
    N("PS-5c", PS, "Modify access authorization as needed to correspond with any changes in operational need due to reassignment or transfer;"),
    H("164.308(a)(4)(ii)(C)", ADMIN, "Access establishment and modification (Addressable). Implement policies and procedures that, based upon the covered entity's or the business associate's access authorization policies, establish, document, review, and modify a user's right of access to a workstation, transaction, program, or process."),
    I("A.5.18", "Access rights", ORG, "Grant, review, change and remove access rights according to your access control policy, including when someone changes job."),
    O("CC6.2", CC6, "New users are registered and authorized before credentials are issued, and access is removed when it's no longer authorized."),
    O("CC6.3", CC6, "Access is granted, changed and removed based on roles, least privilege and separation of duties."),
    P("7.2.2", R7, "Assign access, including privileged access, based on the person's job and only what the job needs."),
    S7("3.1.1", F1, "Limit system access to authorized users, based on what their current job needs."),
    S7("3.9.2", F9, "Protect CUI systems during personnel actions such as transfers, by changing access to fit the new job."),
    G("III.C.1.a", GC, "Give access to member information systems only to authorized people, based on their job."),
    X("Access provisioning", XA, "New and changed access is approved and matches the person's job before it's granted."),
  ] },
  leaver: { label: "Leavers", why: "A terminated user's account is a door into the company. Disabling it, revoking sessions and removing access all have to happen, and on time.", refs: [
    N("PS-4a–b", PS, "Upon termination of individual employment: a. Disable system access within [Assignment: organization-defined time period]; b. Terminate or revoke any authenticators and credentials associated with the individual;"),
    H("164.308(a)(3)(ii)(C)", ADMIN, "Termination procedures (Addressable). Implement procedures for terminating access to electronic protected health information when the employment of, or other arrangement with, a workforce member ends or as required by determinations made as specified in paragraph (a)(3)(ii)(B) of this section."),
    I("A.5.18", "Access rights", ORG, "Remove a person's access rights when their employment or contract ends."),
    O("CC6.2", CC6, "Credentials and access are removed when a user is no longer authorized."),
    P("8.2.5", R8, "Revoke a terminated user's access immediately."),
    S7("3.9.2", F9, "Protect CUI systems during and after terminations: access ends when employment does."),
    G("III.C.1.a", GC, "Remove access to member information systems as soon as someone is no longer authorized."),
    X("Access removal", XA, "Terminated users lose access to financial systems promptly, and auditors test how promptly."),
  ] },
  leave: { label: "Leave of absence", why: "Leave means pause, not remove: disable sign-in, keep the role's access for the return, and record why.", refs: [
    N("AC-2f", AC, "Create, enable, modify, disable, and remove accounts in accordance with [Assignment: organization-defined policy, procedures, prerequisites, and criteria];"),
    H("164.308(a)(4)(ii)(C)", ADMIN, "Access establishment and modification (Addressable). Implement policies and procedures that, based upon the covered entity's or the business associate's access authorization policies, establish, document, review, and modify a user's right of access to a workstation, transaction, program, or process."),
    I("A.5.18", "Access rights", ORG, "Adjust access rights when someone's circumstances change, following your access policy."),
    O("CC6.2", CC6, "Access is changed or removed when a user's authorization changes."),
    P("8.2.4", R8, "Adding, removing or changing user IDs and their access needs proper approval and must match what was approved."),
    S7("3.1.1", F1, "Only authorized users who currently need access can sign in. A leave pauses that need."),
    G("III.C.1.a", GC, "Limit access to member information systems to authorized people who need it right now."),
    X("Access changes", XA, "Changes to a user's access, including pausing it, are authorized and recorded."),
  ] },
  request: { label: "Access requests", why: "An approval only authorizes access that policy allows. The analyst still checks the request is requestable and records the approval before granting.", refs: [
    N("AC-6", AC, "Employ the principle of least privilege, allowing only authorized accesses for users (or processes acting on behalf of users) that are necessary to accomplish assigned organizational tasks."),
    N("AC-2i", AC, "Authorize access to the system based on: 1. A valid access authorization; 2. Intended system usage; and 3. [Assignment: organization-defined attributes (as required)];"),
    H("164.308(a)(4)(ii)(B)", ADMIN, "Access authorization (Addressable). Implement policies and procedures for granting access to electronic protected health information, for example, through access to a workstation, transaction, program, process, or other mechanism."),
    I("A.5.15", "Access control", ORG, "Set access control rules based on business and security needs, and follow them when access is requested."),
    O("CC6.3", CC6, "Access is authorized and granted based on roles and least privilege."),
    P("7.2.3", R7, "Required privileges are approved by authorized people before they're granted."),
    S7("3.1.2", F1, "Limit each user to the transactions and functions they're authorized to use."),
    G("III.C.1.a", GC, "Grant access to member information only to authorized people, with the authorization on record."),
    X("Access approval", XA, "Access is granted only with documented approval from an authorized person, before the change."),
  ] },
  sod: { label: "Separation of duties", why: "One person able to enter and approve the same payment can commit fraud alone. SoD rules exist to make that impossible, whoever approves the request.", refs: [
    N("AC-5", AC, "a. Identify and document [Assignment: organization-defined duties of individuals]; and b. Define system access authorizations to support separation of duties."),
    I("A.5.3", "Segregation of duties", ORG, "Split conflicting duties and areas of responsibility between different people."),
    O("CC6.3", CC6, "Access decisions take separation of duties into account."),
    P("7.2.2", R7, "Assign access based on the job and least privilege, so no one holds more than their role needs."),
    S7("3.1.4", F1, "Separate duties so no one person can carry out malicious activity without collusion."),
    G("III.C.1.e", GC, "Use dual control and segregation of duties for staff with access to member information."),
    X("Segregation of duties", XA, "Incompatible duties in a financial process, like entering and approving, are split between different people."),
  ] },
  privileged: { label: "Privileged access", why: "Admin rights turn one mistake or one phished account into a company-wide incident. They're restricted to named roles, not granted for convenience.", refs: [
    N("AC-6(5)", AC, "Restrict privileged accounts on the system to [Assignment: organization-defined personnel or roles]."),
    H("164.308(a)(4)(ii)(B)", ADMIN, "Access authorization (Addressable). Implement policies and procedures for granting access to electronic protected health information, for example, through access to a workstation, transaction, program, process, or other mechanism."),
    I("A.8.2", "Privileged access rights", TECHN, "Restrict and manage the allocation and use of privileged access rights."),
    O("CC6.3", CC6, "Privileged access is authorized and limited based on roles and least privilege."),
    P("7.2.2", R7, "Privileged users get access based on their job and least privilege, like everyone else."),
    S7("3.1.5", F1, "Use least privilege, including for security functions and privileged accounts."),
    S7("3.1.6", F1, "Admins use non-privileged accounts or roles for everyday, non-security work."),
    G("III.C.1.a", GC, "Restrict powerful access to member information systems to the people who need it."),
    X("Privileged access", XA, "Admin and superuser access to financial systems is restricted to the right people and reviewed."),
  ] },
  shared: { label: "Shared accounts", why: "A shared login makes every action anonymous. Individual accountability is the point of identity management.", refs: [
    N("IA-2", IA, "Uniquely identify and authenticate organizational users and associate that unique identification with processes acting on behalf of those users."),
    H("164.312(a)(2)(i)", TECH, "Unique user identification (Required). Assign a unique name and/or number for identifying and tracking user identity."),
    I("A.5.16", "Identity management", ORG, "Manage the full life cycle of identities, and allow shared identities only when justified and approved."),
    O("CC6.1", CC6, "Users are uniquely identified and authenticated before they get access."),
    P("8.2.2", R8, "Use shared or generic accounts only in exceptional cases, with documented justification, management approval, and every action traceable to a person."),
    S7("3.3.2", F3, "Make sure each user's actions can be traced to them, so they can be held accountable."),
    S7("3.5.1", F5, "Identify every user, process and device individually."),
    G("III.C.1.a", GC, "Access controls only work if each person who reaches member information has their own identity."),
    X("Unique IDs", XA, "Each user has their own ID, so every action in a financial system can be traced to a person."),
  ] },
  inactive: { label: "Inactive accounts", why: "Dormant accounts are targets nobody is watching. A regular sweep closes them before an attacker finds them.", refs: [
    N("AC-2(3)", AC, "Disable accounts within [Assignment: organization-defined time period] when the accounts: (a) Have expired; (b) Are no longer associated with a user or individual; (c) Are in violation of organizational policy; or (d) Have been inactive for [Assignment: organization-defined time period]."),
    H("164.308(a)(4)(ii)(C)", ADMIN, "Access establishment and modification (Addressable). Implement policies and procedures that, based upon the covered entity's or the business associate's access authorization policies, establish, document, review, and modify a user's right of access to a workstation, transaction, program, or process."),
    I("A.5.18", "Access rights", ORG, "Review access rights regularly and remove what's no longer needed."),
    O("CC6.2", CC6, "Access that's no longer authorized is removed."),
    P("8.2.6", R8, "Remove or disable user accounts that have been inactive for 90 days."),
    S7("3.5.6", F5, "Disable identifiers after a defined period of inactivity."),
    G("III.C.1.a", GC, "Keep access limited to authorized people by closing accounts nobody is using."),
    X("Dormant accounts", XA, "Unused accounts on financial systems are found and disabled as part of access monitoring."),
  ] },
  service: { label: "Service accounts", why: "Service accounts run systems, not people. Disabling one breaks production, so they go to their owner, who decides.", refs: [
    N("AC-2b", AC, "Assign account managers;"),
    N("CP-9d", CP, "Protect the confidentiality, integrity, and availability of backup information."),
    H("164.308(a)(7)(ii)(A)", ADMIN, "Data backup plan (Required). Establish and implement procedures to create and maintain retrievable exact copies of electronic protected health information."),
    I("A.8.13", "Information backup", TECHN, "Keep backups and test them according to an agreed backup policy."),
    O("A1.2", A1, "Backup and recovery infrastructure is managed so systems stay available."),
    P("8.6.1", R8, "Manage system and application accounts tightly, with interactive use only by approved exception."),
    S7("3.8.9", F8, "Protect backups of CUI wherever they're stored, which needs the backup jobs to keep running."),
    G("III.C.1.h", GC, "Protect member information against loss from technological failures, which is what backup jobs are for."),
    X("Job processing", XO, "Batch jobs and backups that support financial reporting run reliably, and failures are fixed."),
  ] },
  contractor: { label: "Contractors", why: "Contractor access should end when the contract does. An expiry date plus sponsor approval keeps it tied to the paperwork.", refs: [
    N("PS-7d", PS, "Require external providers to notify [Assignment: organization-defined personnel or roles] of any personnel transfers or terminations of external personnel who possess organizational credentials and/or badges, or who have system privileges within [Assignment: organization-defined time period];"),
    N("AC-2(3)", AC, "Disable accounts within [Assignment: organization-defined time period] when the accounts: (a) Have expired; (b) Are no longer associated with a user or individual; (c) Are in violation of organizational policy; or (d) Have been inactive for [Assignment: organization-defined time period]."),
    H("164.308(a)(3)(ii)(C)", ADMIN, "Termination procedures (Addressable). Implement procedures for terminating access to electronic protected health information when the employment of, or other arrangement with, a workforce member ends or as required by determinations made as specified in paragraph (a)(3)(ii)(B) of this section."),
    I("A.5.18", "Access rights", ORG, "Grant and remove access for external people according to the agreement that covers them."),
    O("CC6.2", CC6, "Access is registered, authorized and removed in line with the user's authorization."),
    P("8.2.4", R8, "Changes to user IDs and access, including extensions, need the right approval."),
    S7("3.1.1", F1, "Only authorized users have access, which for a contractor means a current agreement."),
    G("III.D", GD, "Oversee service providers and contractors, including how their access is granted and ended."),
    X("Third-party access", XA, "Contractor access is approved by a sponsor and ends when the contract does."),
  ] },
  incident: { label: "Incident containment", why: "When an account is at risk, contain it first (revoke, reset, disable), then hand it to Security. Half-contained is not contained.", refs: [
    N("IR-4a", IR, "Implement an incident handling capability for incidents that is consistent with the incident response plan and includes preparation, detection and analysis, containment, eradication, and recovery;"),
    H("164.308(a)(6)(ii)", ADMIN, "Implementation specification: Response and reporting (Required). Identify and respond to suspected or known security incidents; mitigate, to the extent practicable, harmful effects of security incidents that are known to the covered entity or business associate; and document security incidents and their outcomes."),
    I("A.5.26", "Response to information security incidents", ORG, "Respond to incidents following documented procedures."),
    O("CC7.4", CC7, "Identified security incidents are responded to with a defined process to contain, fix and communicate."),
    P("12.10.1", R12, "Have an incident response plan ready to start immediately when an incident is suspected."),
    S7("3.6.1", F6, "Have an incident-handling capability that covers detection, analysis, containment, recovery and user response."),
    S7("3.6.2", F6, "Track, document and report incidents to the right people inside and outside the organization."),
    G("III.C.1.g", GC, "Have a response program for when unauthorized people get into member information systems, including reports to regulators and law enforcement."),
    X("Security incidents", XO, "Security events affecting financial systems are contained, investigated and assessed for impact on the financial statements."),
  ] },
  review: { label: "Access review actions", why: "An access review isn't finished when a manager clicks Revoke. It's finished when the access is gone.", refs: [
    N("AC-2j", AC, "Review accounts for compliance with account management requirements [Assignment: organization-defined frequency];"),
    H("164.308(a)(4)(ii)(C)", ADMIN, "Access establishment and modification (Addressable). Implement policies and procedures that, based upon the covered entity's or the business associate's access authorization policies, establish, document, review, and modify a user's right of access to a workstation, transaction, program, or process."),
    I("A.5.18", "Access rights", ORG, "Review access rights at planned intervals and act on the results."),
    O("CC6.2", CC6, "Access is removed when it's no longer authorized."),
    P("7.2.4", R7, "Review all user accounts and their access at least every six months, and fix anything inappropriate."),
    S7("3.12.3", F12, "Monitor security controls on an ongoing basis so they keep working, which includes acting on access reviews."),
    G("III.C.1.a", GC, "Keep access to member information systems limited to authorized people, which means carrying out what reviews find."),
    X("Access review", XA, "Periodic user access reviews are done by managers, and the removals they ask for are carried out."),
  ] },
  evidence: { label: "Audit evidence", why: "Auditors rely on records the system produced, not on what anyone remembers. The audit log is the evidence.", refs: [
    N("AU-6a", AU, "Review and analyze system audit records [Assignment: organization-defined frequency] for indications of [Assignment: organization-defined inappropriate or unusual activity] and the potential impact of the inappropriate or unusual activity;"),
    H("164.308(a)(1)(ii)(D)", ADMIN, "Information system activity review (Required). Implement procedures to regularly review records of information system activity, such as audit logs, access reports, and security incident tracking reports."),
    I("A.8.15", "Logging", TECHN, "Produce, protect and analyse logs of activity so events can be reconstructed."),
    O("CC4.1", CC4, "The organization evaluates whether its controls are present and working."),
    P("10.4.1", R10, "Review security event and critical system logs at least daily."),
    S7("3.3.1", F3, "Create and keep audit logs so unauthorized activity can be monitored, investigated and reported."),
    G("III.C.1.f", GC, "Monitor systems to detect actual and attempted attacks on member information systems."),
    X("Audit evidence", XM, "Control evidence comes from system records, such as logs and reports, which auditors test for completeness and accuracy."),
  ] },
  testing: { label: "Control testing", why: "Assessing a control means confirming it's designed well and then testing whether it actually operated, item by item.", refs: [
    N("CA-2d", CA, "Assess the controls in the system and its environment of operation [Assignment: organization-defined frequency] to determine the extent to which the controls are implemented correctly, operating as intended, and producing the desired outcome with respect to meeting established security and privacy requirements;"),
    H("164.308(a)(8)", ADMIN, "Standard: Evaluation. Perform a periodic technical and nontechnical evaluation, based initially upon the standards implemented under this rule and, subsequently, in response to environmental or operational changes affecting the security of electronic protected health information, that establishes the extent to which a covered entity's or business associate's security policies and procedures meet the requirements of this subpart."),
    I("A.5.35", "Independent review of information security", ORG, "Have your approach to information security reviewed independently at planned intervals."),
    O("CC4.1", CC4, "Ongoing or separate evaluations confirm that controls are present and functioning."),
    S7("3.12.1", F12, "Periodically assess security controls to find out whether they're effective."),
    G("III.C.3", GC, "Regularly test the key controls, systems and procedures, by staff independent of those who run them."),
    X("Control testing", XM, "Key controls are tested to show they're designed well and operated throughout the period."),
  ] },
  finding: { label: "Reporting findings", why: "A finding turns test results into something management can act on: what happened, against which rule, why, and what it risks.", refs: [
    N("CA-2e", CA, "Produce a control assessment report that document the results of the assessment;"),
    H("164.308(a)(8)", ADMIN, "Standard: Evaluation. Perform a periodic technical and nontechnical evaluation, based initially upon the standards implemented under this rule and, subsequently, in response to environmental or operational changes affecting the security of electronic protected health information, that establishes the extent to which a covered entity's or business associate's security policies and procedures meet the requirements of this subpart."),
    I("A.5.35", "Independent review of information security", ORG, "Report the results of independent reviews to the management who asked for them."),
    O("CC4.2", CC4, "Control deficiencies are evaluated and reported promptly to the people responsible for fixing them."),
    S7("3.12.2", F12, "Plan and carry out actions to correct the deficiencies an assessment finds."),
    G("III.F", GF, "Report to the board on the program, including test results and violations."),
    X("Deficiency evaluation", XM, "Control deficiencies are documented and rated: deficiency, significant deficiency or material weakness."),
  ] },
  risk: { label: "Risk rating", why: "Rating likelihood and impact the same way every time lets management compare risks and fund the worst first.", refs: [
    N("RA-3a", RA, "Conduct a risk assessment, including: 1. Identifying threats to and vulnerabilities in the system; 2. Determining the likelihood and magnitude of harm from unauthorized access, use, disclosure, disruption, modification, or destruction of the system, the information it processes, stores, or transmits, and any related information; and"),
    H("164.308(a)(1)(ii)(A)", ADMIN, "Risk analysis (Required). Conduct an accurate and thorough assessment of the potential risks and vulnerabilities to the confidentiality, integrity, and availability of electronic protected health information held by the covered entity or business associate."),
    I("6.1.2", "Information security risk assessment", PLAN, "Define and apply a repeatable way to identify risks and rate their likelihood and consequences."),
    O("CC3.2", CC3, "Risks are identified and analyzed to decide how they should be managed."),
    P("12.3.1", R12, "Where the standard lets you set a frequency, base it on a documented, targeted risk analysis."),
    S7("3.11.1", F11, "Periodically assess the risk to operations, assets and people from systems that handle CUI."),
    G("III.B", GB, "Identify foreseeable threats, how likely and damaging they are, and whether controls are enough."),
    X("Risk assessment", XM, "Management identifies and rates risks to reliable financial reporting, including IT risks."),
  ] },
  remediation: { label: "Management response", why: "A finding closes only when the fix addresses the cause, has an owner and a date, and passes re-testing.", refs: [
    N("CA-5a", CA, "Develop a plan of action and milestones for the system to document the planned remediation actions of the organization to correct weaknesses or deficiencies noted during the assessment of the controls and to reduce or eliminate known vulnerabilities in the system; and"),
    H("164.308(a)(1)(ii)(B)", ADMIN, "Risk management (Required). Implement security measures sufficient to reduce risks and vulnerabilities to a reasonable and appropriate level to comply with § 164.306(a)."),
    I("10.2", "Nonconformity and corrective action", IMPROVE, "Fix nonconformities, deal with their causes, and check that the corrective action worked."),
    O("CC4.2", CC4, "Deficiencies go to the people responsible for corrective action, including management."),
    S7("3.12.2", F12, "Develop and carry out plans of action that correct deficiencies and reduce vulnerabilities."),
    G("III.E", GE, "Adjust the program based on test results and changes in technology and threats."),
    X("Remediation", XM, "Each deficiency is fixed by an owner by a date, and the fix is retested."),
  ] },
  // PAM path topics.
  jit: { label: "Just-in-time elevation", why: "Admin rights that exist only while an approved change runs can't be phished tomorrow. Activating a role for a short, approved window is least privilege applied to time.", refs: [
    N("AC-6(5)", AC, "Restrict privileged accounts on the system to [Assignment: organization-defined personnel or roles]."),
    N("AC-2(6)", AC, "Implement [Assignment: organization-defined dynamic privilege management capabilities]."),
    H("164.308(a)(4)(ii)(B)", ADMIN, "Access authorization (Addressable). Implement policies and procedures for granting access to electronic protected health information, for example, through access to a workstation, transaction, program, process, or other mechanism."),
    S7("3.1.5", F1, "Use least privilege, including for privileged accounts, so admin rights are held only while they're needed."),
    G("III.C.1.a", GC, "Limit powerful access to member information systems to authorized people, when they need it."),
    X("Privileged access", XA, "Admin access to financial systems is approved, limited to the work and monitored."),
    I("A.8.2", "Privileged access rights", TECHN, "Allocate privileged access only when it's needed, for as long as it's needed, and review it."),
    O("CC6.3", CC6, "Access, including when and for how long privileged access is held, is based on roles and least privilege."),
    P("7.2.2", R7, "Assign privileged access based on the job and only what the job needs, approved before it's granted."),
  ] },
  breakglass: { label: "Break-glass access", why: "Emergency accounts bypass the normal controls by design. They're only safe if every use is deliberate, verified, reported, and closed out completely afterwards.", refs: [
    N("AC-2(2)", AC, "Automatically [Selection: remove; disable] temporary and emergency accounts after [Assignment: organization-defined time period for each type of account]."),
    H("164.312(a)(2)(ii)", TECH, "Emergency access procedure (Required). Establish (and implement as needed) procedures for obtaining necessary electronic protected health information during an emergency."),
    S7("3.1.7", F1, "Keep privileged functions to privileged users, and log every time they're used, emergencies included."),
    G("III.C.1.a", GC, "Emergency access to member information systems is still limited to authorized people, and accounted for."),
    X("Emergency access", XA, "Emergency (firefighter) access to financial systems is approved, logged and reviewed after every use."),
    I("A.5.29", "Information security during disruption", ORG, "Keep security working during a disruption, including control over emergency access."),
    O("CC6.1", CC6, "Emergency access is still logical access: restricted, authenticated and logged."),
    P("8.6.1", R8, "Accounts that can be used interactively only by exception are managed: use is approved, time-limited and traceable to a person."),
  ] },
  vault: { label: "Credential vaulting and rotation", why: "A password someone else has seen is no longer a secret. Rotating it makes the copy useless, without switching off what depends on the account.", refs: [
    N("IA-5f", IA, "Changing or refreshing authenticators [Assignment: organization-defined time period by authenticator type] or when [Assignment: organization-defined events] occur;"),
    N("IA-5g", IA, "Protecting authenticator content from unauthorized disclosure and modification;"),
    N("AC-2k", AC, "Establish and implement a process for changing shared or group account authenticators (if deployed) when individuals are removed from the group; and"),
    H("164.308(a)(5)(ii)(D)", ADMIN, "Password management (Addressable). Procedures for creating, changing, and safeguarding passwords."),
    S7("3.5.10", F5, "Store and send passwords only in cryptographically protected form, which is what a vault does."),
    G("III.C.1.a", GC, "Protect the credentials that give access to member information systems, and change them when exposed."),
    X("Credential management", XA, "Passwords for privileged and system accounts on financial systems are protected and changed when exposed."),
    I("A.5.17", "Authentication information", ORG, "Manage passwords and other secrets through a controlled process, and change them when they may have been exposed."),
    O("CC6.1", CC6, "Credentials are protected, and changed when they may be compromised."),
    P("8.6.3", R8, "Passwords for system and application accounts are protected against misuse and changed periodically and when compromise is suspected."),
  ] },
  session: { label: "Privileged session review", why: "Recording admin sessions only helps if someone compares what was done with why the session was opened. That's how misuse by a trusted admin gets caught.", refs: [
    N("AC-6(9)", AC, "Log the execution of privileged functions."),
    N("AU-6a", AU, "Review and analyze system audit records [Assignment: organization-defined frequency] for indications of [Assignment: organization-defined inappropriate or unusual activity] and the potential impact of the inappropriate or unusual activity;"),
    H("164.312(b)", TECH, "Standard: Audit controls. Implement hardware, software, and/or procedural mechanisms that record and examine activity in information systems that contain or use electronic protected health information."),
    S7("3.1.7", F1, "Capture the execution of privileged functions in audit logs."),
    G("III.C.1.f", GC, "Monitor systems to detect actual and attempted attacks on or intrusions into member information systems."),
    X("Monitoring", XM, "Privileged activity on financial systems is logged and reviewed by someone independent of the admin."),
    I("A.8.16", "Monitoring activities", TECHN, "Monitor systems for unusual behaviour and act on what you find."),
    O("CC7.2", CC7, "System components are monitored for anomalies that could indicate malicious acts, and anomalies are analyzed."),
    P("10.2.1.2", R10, "Audit logs capture every action taken by anyone with administrative access."),
  ] },
};

// Topics for each ticket (Pacific Crest).

// Topics for a ticket at the active company.
export const ticketTopics = (id: string): string[] => SET.topics[id] || [];


// Unique references for a set of topics, grouped by framework. `fws` limits them to the frameworks
// a company answers to.
export function refsFor(topics: string[], fws: Fw[] = FW_ORDER) {
  const seen = new Set<string>(), out = Object.fromEntries(FW_ORDER.map(f => [f, [] as Ref[]])) as Record<Fw, Ref[]>;
  topics.forEach(k => (TOPICS[k]?.refs || []).forEach(r => { const key = r.fw + r.id; if (fws.includes(r.fw) && !seen.has(key)) { seen.add(key); out[r.fw].push(r); } }));
  return out;
}
