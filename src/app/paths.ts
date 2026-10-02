// The four paths: what each covers, and which screens belong to it.
import { path, type PathId } from "./pathStore";
export { path, pathChosen, type PathId } from "./pathStore";

export type PathInfo = { id: PathId; name: string; role: string; blurb: string; steps: string[] };
export const PATHS: PathInfo[] = [
  { id: "iam", name: "IAM only", role: "IAM analyst",
    blurb: "Work a live service desk queue. If a fix doesn't work, the requester replies and the ticket comes back until it's resolved, and missed steps turn into new incidents.",
    steps: ["Work the queue", "Handle replies and follow-ups as they land", "Shift summary"] },
  { id: "iam-grc", name: "IAM + GRC", role: "IAM analyst, then auditor",
    blurb: "Work the queue, then audit your own shift. Each ticket shows the requirements behind it from the frameworks your company answers to, such as HIPAA at Harbor Health or CMMC at Meridian.",
    steps: ["Work the queue", "Handle replies and follow-ups as they land", "Audit your own shift (optional)", "Shift summary"] },
  { id: "grc", name: "GRC only", role: "Internal auditor",
    blurb: "Audit Jordan Reyes, an IAM analyst whose shift includes realistic mistakes. Walk through, sample, test, evaluate evidence, write the finding, rate the risk and review management's response.",
    steps: ["Walkthrough and sampling", "Control testing and evidence", "Finding, risk rating and management response"] },
  { id: "pam", name: "PAM", role: "Privileged access analyst",
    blurb: "Guard the admin keys. Grant just-in-time access instead of standing admin, run break-glass by the book, rotate vaulted credentials and review privileged sessions. Each ticket shows the framework requirements behind it.",
    steps: ["Work the privileged access queue", "Handle replies and follow-ups as they land", "Shift summary"] },
];
export const pathInfo = (p: PathId = path()) => PATHS.find(x => x.id === p)!;

// Screens not listed here are shared by every path.
const ONLY: Record<string, PathId[]> = {
  queue: ["iam", "iam-grc", "pam"], results: ["iam", "iam-grc", "pam"], week: ["iam", "iam-grc", "pam"], labs: ["iam", "iam-grc"],
  audit: ["iam-grc", "grc"], grc: ["iam-grc", "grc"],
};
export const inPath = (route: string, p: PathId = path()) => !ONLY[route] || ONLY[route].includes(p);
// Framework panels are part of both GRC paths and PAM.
export const showFrameworks = (p: PathId = path()) => p !== "iam";
// On GRC only, the learner audits Jordan's shift and can't change accounts.
export const readOnly = (p: PathId = path()) => p === "grc";
