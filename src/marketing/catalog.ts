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

export const LABS: Item[] = [
  { id: "entra", name: "Microsoft Entra ID lab", text: "Seed a tenant with the Pacific Crest directory, work the tickets in the Entra admin center, and grade a read-only export in the browser.", early: true, href: "/labs/" },
];

export const RESOURCES: Item[] = [
  { id: "grading", name: "How grading works", text: "Outcome and process checks, hint costs, and Solo and Assisted results.", href: "/resources/#grading" },
  { id: "runbook", name: "Runbook and access matrix", text: "The Pacific Crest policies every ticket is graded against.", href: "/app/#/policy" },
  { id: "sample-report", name: "Sample readiness report", text: "What a shared readiness report contains.", href: "/resources/#sample-report" },
  { id: "faq", name: "FAQ", text: "Plans, labs, content and data.", href: "/resources/#faq" },
  { id: "accessibility", name: "Accessibility", text: "WCAG 2.2 AA target, reduced motion and keyboard support.", href: "/resources/#accessibility" },
];
