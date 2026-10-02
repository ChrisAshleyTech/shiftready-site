// What the marketing site lists: only items that exist ("early" = in active development).
export type Item = { id: string; name: string; text: string; early?: boolean; href: string };

export const TRACKS: Item[] = [
  { id: "iam-ops", name: "IAM Ops", text: "Service-desk identity operations: lifecycle, credentials, access requests and incidents across two shifts.", href: "/tracks/#iam-ops" },
  { id: "grc", name: "GRC Audit", text: "Test provisioning, termination and review controls, rate deficiencies, review a SOC 2 report and write findings.", href: "/tracks/#grc" },
  { id: "pam", name: "PAM", text: "Just-in-time elevation, break-glass accounts, credential rotation and privileged session review.", early: true, href: "/tracks/#pam" },
];

export type Industry = { id: string; name: string; industry: string; frameworks: string; early?: boolean };
export const INDUSTRIES: Industry[] = [
  { id: "pacific-crest", name: "Pacific Crest Logistics", industry: "Logistics", frameworks: "SOX ITGC, NIST 800-53" },
  { id: "harbor-health", name: "Harbor Health Network", industry: "Healthcare", frameworks: "HIPAA Security Rule", early: true },
  { id: "meridian", name: "Meridian Aerospace", industry: "Aerospace and defense", frameworks: "CMMC Level 2, NIST SP 800-171", early: true },
  { id: "coastline", name: "Coastline Credit Union", industry: "Banking", frameworks: "GLBA Safeguards Rule, NCUA Part 748, FFIEC", early: true },
  { id: "brightpath", name: "Brightpath SaaS", industry: "Software", frameworks: "SOC 2", early: true },
  { id: "sunset-retail", name: "Sunset Retail Group", industry: "Retail", frameworks: "PCI DSS v4.0, SOX ITGC", early: true },
];

// Platform labs. The public pages show this overview only; scripts, step-by-step instructions and
// grading are in the app's lab guide, behind tester access (api/_lib/labAccess.js).
export type LabInfo = {
  id: "entra" | "okta" | "aws" | "ad"; name: string; short: string; overview: string; practice: string[]; time: string; needs: string;
  status: "early" | "soon"; shot?: { src: string; alt: string };
};
export const LAB_INFO: LabInfo[] = [
  { id: "entra", name: "Microsoft Entra ID lab", short: "Microsoft Entra ID", status: "early",
    overview: "Seed a Microsoft Entra tenant with the Pacific Crest directory, work six Monday tickets in the Entra admin center, and grade a read-only export.",
    practice: ["Joiner, mover, leaver and rehire changes in a real directory", "Disabling accounts and revoking sessions for a leaver", "Provisioning from the access matrix, not by copying a coworker", "PowerShell with Microsoft Graph, run safely against a lab tenant"],
    time: "About 90 minutes, including tenant setup", needs: "A free Microsoft Entra tenant (Azure free account or Microsoft 365 developer tenant)",
    shot: { src: "/img/labs/entra-results.jpg", alt: "Lab score for the Entra ID lab: each ticket with its graded checks and a takeaway." } },
  { id: "okta", name: "Okta lab", short: "Okta", status: "early",
    overview: "Seed a free Okta Integrator org with the same directory, work the tickets in the Okta Admin Console, and grade a check run with a read-only admin token.",
    practice: ["Okta user lifecycle: staged, active, suspended and deactivated", "Clearing sessions and removing group access for a leaver", "Group-based access that matches the role, nothing more", "Least-privilege API tokens: a read-only admin for checks"],
    time: "About 75 minutes, including org setup", needs: "A free Okta Integrator org",
    shot: { src: "/img/labs/okta-results.jpg", alt: "Lab score for the Okta lab: each ticket with its graded checks and a takeaway." } },
  { id: "aws", name: "AWS IAM lab", short: "AWS", status: "early",
    overview: "Seed a free-tier AWS account with a CloudFormation stack, work the tickets in the IAM console, and grade a read-only check run in CloudShell.",
    practice: ["IAM users, groups and tags as a system of record", "Removing console access and deactivating access keys for a leaver", "Infrastructure as code: seeding and removing a lab with CloudFormation", "Read-only checks from CloudShell, with no access keys created"],
    time: "About 60 minutes, including account setup", needs: "A free-tier AWS account",
    shot: { src: "/img/labs/aws-results.jpg", alt: "Lab score for the AWS IAM lab: each ticket with its graded checks and a takeaway." } },
  { id: "ad", name: "Active Directory lab", short: "Active Directory", status: "soon",
    overview: "The same scenarios in on-premises Active Directory: users, groups and organizational units on a lab domain controller.",
    practice: ["Account lifecycle in Active Directory Users and Computers", "Security groups and organizational units", "PowerShell with the ActiveDirectory module"],
    time: "To be announced", needs: "A lab domain controller" },
];

export const LABS: Item[] = LAB_INFO.filter(l => l.status === "early").map(l => ({ id: l.id, name: l.name, text: l.overview, early: true, href: `/labs/#${l.id}` }));

export const RESOURCES: Item[] = [
  { id: "grading", name: "How grading works", text: "Outcome and process checks, hint costs, and Solo and Assisted results.", href: "/resources/#grading" },
  { id: "runbook", name: "Runbook and access matrix", text: "The Pacific Crest policies every ticket is graded against.", href: "/app/#/policy" },
  { id: "sample-report", name: "Sample readiness report", text: "What a shared readiness report contains.", href: "/resources/#sample-report" },
  { id: "faq", name: "FAQ", text: "Plans, labs, content and data.", href: "/resources/#faq" },
  { id: "accessibility", name: "Accessibility", text: "WCAG 2.2 AA target, reduced motion and keyboard support.", href: "/resources/#accessibility" },
];
