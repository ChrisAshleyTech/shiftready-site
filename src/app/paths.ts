// The three paths: what each covers, and which screens belong to it.
import { path, type PathId } from "./pathStore";
export { path, pathChosen, type PathId } from "./pathStore";

export type PathInfo = { id: PathId; name: string; role: string; blurb: string; steps: string[] };
export const PATHS: PathInfo[] = [
  { id: "iam", name: "IAM only", role: "IAM analyst",
    blurb: "Work the service desk. Monday's decisions come back on Thursday, then you get a summary of your week.",
    steps: ["Monday shift", "Thursday consequences shift", "Week summary"] },
  { id: "iam-grc", name: "IAM + GRC", role: "IAM analyst, then auditor",
    blurb: "Work Monday and Thursday, then audit your own week on Friday. Each ticket shows the NIST, HIPAA, ISO 27001, SOC 2 and PCI DSS requirements behind it.",
    steps: ["Monday shift", "Thursday consequences shift", "Friday audit of your own week (optional)", "Week summary"] },
  { id: "grc", name: "GRC only", role: "Internal auditor",
    blurb: "Audit Jordan Reyes, an IAM analyst whose Monday-to-Thursday week includes realistic mistakes. Walk through, sample, test, evaluate evidence, write the finding, rate the risk and review management's response.",
    steps: ["Walkthrough and sampling", "Control testing and evidence", "Finding, risk rating and management response"] },
];
export const pathInfo = (p: PathId = path()) => PATHS.find(x => x.id === p)!;

// Screens not listed here are shared by every path.
const ONLY: Record<string, PathId[]> = {
  queue: ["iam", "iam-grc"], results: ["iam", "iam-grc"], week: ["iam", "iam-grc"], labs: ["iam", "iam-grc"],
  audit: ["iam-grc", "grc"], grc: ["iam-grc", "grc"],
};
export const inPath = (route: string, p: PathId = path()) => !ONLY[route] || ONLY[route].includes(p);
// Framework panels are part of both GRC paths.
export const showFrameworks = (p: PathId = path()) => p !== "iam";
// On GRC only, the learner audits Jordan's week and can't change accounts.
export const readOnly = (p: PathId = path()) => p === "grc";
