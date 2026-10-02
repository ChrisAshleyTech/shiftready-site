// Audit of one analyst's shift: walkthrough, sample selection, control testing,
// evidence evaluation, a finding, risk ratings and the management response.
// The same seven tasks serve two paths:
//   - IAM + GRC: the optional audit of the learner's own shift.
//   - GRC only: the audit of Jordan Reyes' shift (see jordan.ts).
// Every answer key is computed from the audited shift's audit log and ticket records when the
// audit starts, then frozen, so later changes can't move the evidence.
import { S, U, C } from "@/engine/store.js";
import { ROLES, buildUsers } from "@/engine/company.js";
import { TK } from "@/engine/tickets.js";
import { save } from "@/engine/state.js";
import { SET } from "@/engine/ticketSet.js";
import { ANALYST } from "./jordan";

export type Who = "self" | "jordan";
export type Row = { name: string; sub: string; kv: [string, string][]; opts: string[]; correct: number; why: string };
export type Q = { q: string; short: string; opts?: string[]; correct: number | number[]; multi?: boolean; num?: boolean; pts?: number };
export type Task = {
  id: string; step: string; title: string; ctrl: string; intro: string; kind: "table" | "quiz";
  rows?: Row[]; qs?: Q[]; evidence?: [string, string][]; lesson: string; topics: string[];
};
export type Answers = Record<number, number | number[]>;
export type Check = ReturnType<typeof C>;
export type TaskState = { draft?: Answers; ans?: Answers; checks?: Check[]; score?: number; max?: number };
export type WeekAudit = { who: Who; tasks: Task[]; st: Record<string, TaskState>; skipped?: boolean };

// ---------- The controls in scope ----------
export const WEEK_CONTROLS: [string, string, string][] = [
  ["APD-03", "Caller verification", "Caller identity is checked against the directory (employee ID and manager) and recorded on the ticket before any credential change. Every account change references a ticket."],
  ["APD-01", "Role-based provisioning", "Joiners, movers and returners get exactly their role's birthright groups from the access matrix. Movers lose the old role's access."],
  ["APD-02", "Leaver offboarding", "On termination the account is disabled, sessions are revoked and all access is removed the same day."],
  ["ACC-01", "Access requests", "Only requestable access is granted through a request, and only after approval is recorded on the ticket. SoD conflicts, admin roles and shared accounts are never granted on approval alone."],
];

// ---------- Evidence helpers ----------
type Entry = { n: number; t: string; ticket: string | null; a: string; target: string | null; d: string };
const LOG = () => S.log as Entry[];
const onTicket = (tid: string) => LOG().filter(e => e.ticket === tid);
const closeIdx = (tid: string) => LOG().findIndex(e => e.ticket === tid && e.a === "close");
const trail = (tid: string) => onTicket(tid).map(e => `${e.t} ${e.d}`).join(" → ");
const closedAs = (tid: string) => { const st = S.tickets[tid]?.status; return st === "resolved" ? "Resolved" : st === "rejected" ? "Rejected" : "Not closed"; };
const title = (tid: string) => TK[tid]?.title ?? tid;
const idx = (e: Entry) => LOG().indexOf(e);

// A user's account as it stood when a ticket closed, rebuilt from the starting directory plus
// every logged change up to that point.
function stateAt(uid: string, upto: number, base: any) {
  const u0 = base[uid];
  const s = { enabled: !!u0.enabled, revoked: !!u0.revoked, groups: u0.groups.slice() as string[] };
  LOG().slice(0, upto + 1).forEach(e => {
    if (e.target !== uid) return;
    if (e.a === "addgrp") { const g = e.d.replace(/^Added to /, ""); if (!s.groups.includes(g)) s.groups.push(g); }
    if (e.a === "rmgrp") { const g = e.d.replace(/^Removed from /, ""); s.groups = s.groups.filter(x => x !== g); }
    if (e.a === "enable") s.enabled = true;
    if (e.a === "disable") s.enabled = false;
    if (e.a === "revoke") s.revoked = true;
  });
  return s;
}
const list = (gs: string[]) => gs.length ? gs.slice().sort().join(", ") : "None";

// ---------- Populations (from the active company's ticket set) ----------
const AUD = () => SET.audit!;
export const population = () => ({ "APD-03": AUD().callers.length, "APD-01": AUD().jml.length, "APD-02": AUD().leavers.length, "ACC-01": AUD().requests.length });

const APD03_OPTS = ["Pass", "Exception: credential changed before the caller was verified", "Exception: credential changed for a caller who failed verification"];
const APD01_OPTS = ["Pass", "Exception: access beyond the role", "Exception: role access missing", "Exception: access beyond the role and role access missing"];
const APD02_OPTS = ["Pass", "Exception: account left enabled", "Exception: disabled, but sessions or access left in place"];
const ACC01_OPTS = ["Pass", "Exception: granted access that policy doesn't allow", "Exception: granted before approval was recorded", "Exception: approved access never granted"];

function apd03(tid: string): Row {
  const t = TK[tid], uid = t.users[0], u = U(uid), cred = onTicket(tid).filter(e => ["pwreset", "mfareset", "unlock"].includes(e.a));
  const v = onTicket(tid).find(e => e.a === "verify");
  let correct = 0, why = "";
  if (!cred.length) why = "No credential was changed on this ticket.";
  else if (t.close === "reject") { correct = 2; why = `The caller's details don't match the directory, yet the ${cred[0].d.toLowerCase()} happened at ${cred[0].t}.`; }
  else if (!v || idx(v) > idx(cred[0])) { correct = 1; why = v ? `Changed at ${cred[0].t}, verified at ${v.t}.` : `Changed at ${cred[0].t} with no verification recorded.`; }
  else why = `Verified at ${v.t}, before the change at ${cred[0].t}.`;
  return { name: `${tid} · ${t.title}`, sub: "APD-03", opts: APD03_OPTS, correct, why, kv: [
    ["Caller gave", `Employee ID ${t.caller.empId} · manager ${t.caller.mgr}`],
    ["Directory record", `${u.name}: employee ID ${u.empId} · manager ${u.mgr}`],
    ["Logged on the ticket", trail(tid)],
  ] };
}
function apd01([tid, uid, rk]: [string, string, string], base: any): Row {
  const s = stateAt(uid, closeIdx(tid), base), want: string[] = ROLES[rk];
  const extra = s.groups.filter(g => !want.includes(g)), missing = want.filter(g => !s.groups.includes(g));
  const correct = extra.length && missing.length ? 3 : extra.length ? 1 : missing.length ? 2 : 0;
  const why = [extra.length ? "Extra: " + extra.join(", ") : "", missing.length ? "Missing: " + missing.join(", ") : ""].filter(Boolean).join(" · ") || "Groups match the role exactly.";
  return { name: `${tid} · ${title(tid)}`, sub: "APD-01", opts: APD01_OPTS, correct, why, kv: [
    ["Role", rk.replace("|", " / ")],
    ["Birthright groups (access matrix)", list(want)],
    ["Groups when the ticket closed", list(s.groups)],
  ] };
}
function apd02([tid, uid]: [string, string], base: any): Row {
  const s = stateAt(uid, closeIdx(tid), base);
  const correct = s.enabled ? 1 : !s.revoked || s.groups.length ? 2 : 0;
  const why = correct === 1 ? "The account was still enabled at close." : correct === 2 ? [!s.revoked ? "sessions not revoked" : "", s.groups.length ? "still in " + s.groups.length + " groups" : ""].filter(Boolean).join(", ").replace(/^./, c => c.toUpperCase()) + "." : "Disabled, revoked and all access removed.";
  return { name: `${tid} · ${title(tid)}`, sub: "APD-02", opts: APD02_OPTS, correct, why, kv: [
    ["Account at close", s.enabled ? "Enabled" : "Disabled"],
    ["Sessions at close", s.revoked ? "Revoked" : "Not revoked"],
    ["Groups at close", list(s.groups)],
  ] };
}
function acc01([tid, , grp]: [string, string, string | null]): Row {
  const t = TK[tid], adds = onTicket(tid).filter(e => e.a === "addgrp");
  const ap = onTicket(tid).find(e => e.a === "approval");
  let correct = 0, why = "";
  if (t.close === "reject") { correct = adds.length ? 1 : 0; why = adds.length ? `${adds.map(e => e.d.replace(/^Added to /, "")).join(", ")} isn't grantable through a request, whoever approves.` : "Nothing was granted."; }
  else {
    const grant = adds.find(e => e.d === "Added to " + grp);
    if (!grant) { correct = 3; why = "The approved access wasn't granted."; }
    else if (adds.some(e => e !== grant)) { correct = 1; why = "More than the requested group was granted."; }
    else if (!ap || idx(ap) > idx(grant)) { correct = 2; why = `Granted at ${grant.t}${ap ? `, approval recorded at ${ap.t}` : ", no approval recorded"}.`; }
    else why = `Approval recorded at ${ap.t}, granted at ${grant.t}.`;
  }
  return { name: `${tid} · ${t.title}`, sub: "ACC-01", opts: ACC01_OPTS, correct, why, kv: [
    ["Requested", grp ?? "A shared login"],
    ["Approval on file", t.approval ?? "None"],
    ["Logged on the ticket", trail(tid) || "No changes"],
  ] };
}

// ---------- Finding content, by control ----------
const fired = (k: string) => (S.thu || []).some((x: any) => x.key === k);
const FINDING: Record<string, { pop: string; criteria: string; cause: string; generic: string; rec: string; resp: string }> = {
  "APD-03": { pop: "caller-initiated credential",
    criteria: "The runbook requires caller identity to be checked against the directory and recorded on the ticket before any credential change (control APD-03).",
    cause: "Verification is a manual step the directory doesn't enforce, so a credential can be changed before verification is recorded.",
    generic: "Anyone impersonating an employee on the phone could take over that employee's account.",
    rec: "Block credential changes in the directory until verification is recorded on the ticket, and review a weekly report of resets against verification entries.",
    resp: "We've reminded the desk to verify callers first. We consider this closed." },
  "APD-02": { pop: "leaver",
    criteria: "The leaver policy requires the account to be disabled, sessions revoked and all access removed on the termination date (control APD-02).",
    cause: "Offboarding is worked by hand from a checklist, and nothing checks that every step was completed before the ticket closes.",
    generic: "Former employees could keep reaching company systems and data after they leave.",
    rec: "Disable and revoke automatically from the HR termination event, and reconcile HR terminations to enabled accounts every day.",
    resp: "The analyst has been coached on the leaver checklist. No further action is planned." },
  "ACC-01": { pop: "access request",
    criteria: "The access policy allows only requestable access through requests, after recorded approval. SoD conflicts, admin roles and shared accounts are never granted on approval alone (control ACC-01).",
    cause: "The desk treats a manager's approval as enough. The request tool doesn't check whether access is requestable or conflicts with SoD rules.",
    generic: "Users can end up with admin rights or conflicting access that nobody reviews until it's misused.",
    rec: "Enforce the requestable list and SoD rules in the request workflow so they can't be overridden by approval, and review every admin grant weekly.",
    resp: "Managers approved these requests, so the desk acted correctly. We don't agree with the finding." },
  "APD-01": { pop: "joiner, mover and returner",
    criteria: "The access matrix sets each role's birthright groups. Joiners, movers and returners get exactly those groups, and movers lose the old role's access (control APD-01).",
    cause: "Moves are processed by adding the new role's groups. Nothing prompts the analyst to remove the old role's access.",
    generic: "Access builds up beyond what each job needs (privilege creep).",
    rec: "Process moves by replacing the role, not adding to it, and compare every joiner and mover ticket's result with the access matrix before it closes.",
    resp: "We'll fix it in the next quarterly access review." },
};
const IMPACT: Record<string, [string, number]> = { "APD-03": ["Severe", 5], "APD-02": ["Major", 4], "ACC-01": ["Major", 4], "APD-01": ["Moderate", 3] };
function likelihood(x: number, n: number): [string, number] {
  if (!x) return ["Rare", 1];
  const r = x / n;
  return r <= 0.25 ? ["Possible", 3] : r <= 0.5 ? ["Likely", 4] : ["Almost certain", 5];
}
const band = (score: number) => (score >= 15 ? 0 : score >= 8 ? 1 : 2);

// ---------- Building the audit ----------
export function buildWeekAudit(who: Who): WeekAudit {
  const self = who === "self";
  const A = self ? "you" : ANALYST.first, As = self ? "your" : `${ANALYST.first}'s`;
  const base = buildUsers();
  const aud = AUD(), mgr = `${aud.manager.name} (${aud.manager.title})`;
  const tested: Record<string, Row[]> = {
    "APD-03": aud.callers.map(apd03), "APD-01": aud.jml.map(r => apd01(r, base)),
    "APD-02": aud.leavers.map(r => apd02(r, base)), "ACC-01": aud.requests.map(acc01),
  };
  // A sampling question's options, and the indexes that belong in the population.
  const pick = (c: "APD-03" | "APD-02") => ({ opts: aud.sampling[c].map(([id]) => `${id} · ${title(id)}`),
    correct: aud.sampling[c].flatMap(([, inPop], i) => (inPop ? [i] : [])) });
  const p03 = pick("APD-03"), p02 = pick("APD-02");
  const exc = (c: string) => tested[c].filter(r => r.correct !== 0);
  const unticketed = LOG().filter(e => !e.ticket).length;
  const top = ["APD-03", "APD-02", "ACC-01", "APD-01"].reduce((best, c) => (exc(c).length > exc(best).length ? c : best), "APD-03");
  const topN = exc(top).length, totalExc = Object.keys(tested).reduce((a, c) => a + exc(c).length, 0);

  const walkthrough: Task = {
    id: "W1", step: "Walkthrough", title: "Walk through a caller reset", ctrl: "APD-03", kind: "quiz", topics: ["testing", "verify"],
    intro: `<p>Before testing, follow one transaction end to end. ${mgr} walks you through how the desk handles a caller who needs a password reset:</p><ol><li>The call is logged as a ticket and the analyst selects <b>Start work</b>.</li><li>The analyst compares the caller's employee ID and manager with the directory record.</li><li>If both match, the analyst selects <b>Mark identity verified</b>, which writes an entry to the audit log.</li><li>The analyst resets the credential in the directory. The change is logged against the ticket.</li><li>The analyst resolves the ticket with a note.</li></ol><p>The controls in scope are listed under <b>Controls</b>.</p>`,
    qs: [
      { q: "Which step is the key control for caller-initiated credential changes?", short: "Key control", correct: 1, pts: 2,
        opts: ["Logging the call as a ticket", "Comparing the caller's details with the directory and recording the verification before the change", "Resolving the ticket with a note", "Telling the caller their temporary password"] },
      { q: "What evidence shows the control operated on a given ticket?", short: "Evidence of operation", correct: 1, pts: 2,
        opts: ["The analyst's resolution note saying \"verified\"", "A \"Caller identity marked verified\" entry in the audit log on that ticket, timed before the credential change", "The ticket's Resolved status", "The caller didn't complain"] },
      { q: "How do you describe APD-03?", short: "Control attributes", correct: 0, pts: 2,
        opts: ["Per event, manual, preventive", "Quarterly, automated, detective", "Annual, manual, detective"] },
      { q: "What is a walkthrough for?", short: "Purpose of a walkthrough", correct: 1, pts: 2,
        opts: ["To test every transaction in the period", "To confirm you understand the process and that the control is designed and in place, before you test whether it operated", "To replace testing when the population is small"] },
    ],
    lesson: "A walkthrough shows how the control is designed and what evidence it leaves. You then know exactly what to look for when you test.",
  };

  const sampling: Task = {
    id: "W2", step: "Sample selection", title: "Define the populations and pick the sample", ctrl: "All", kind: "quiz", topics: ["testing", "evidence"],
    intro: `<p>The audit period is ${As} shift, follow-ups included. Before you test anything, decide which tickets belong in each control's population and how many to test.</p>`,
    qs: [
      { q: "Which tickets belong in the APD-03 population (caller-initiated credential changes)? Select all that apply.", short: "APD-03 population", multi: true, correct: p03.correct, opts: p03.opts },
      { q: "Which tickets belong in the APD-02 leaver population? Select all that apply.", short: "APD-02 population", multi: true, correct: p02.correct, opts: p02.opts },
      { q: `The APD-01 population has ${aud.jml.length} joiner, mover and returner tickets. How many do you test?`, short: "Sample size", correct: 0, pts: 2,
        opts: [`All ${aud.jml.length}. The population is small, so test every item.`, "1. The walkthrough covers the rest.", "2. A 40% sample is standard.", "None. HR integration tickets are automated."] },
      { q: "Where should the list of tickets in the period come from?", short: "Population source", correct: 0, pts: 2,
        opts: ["A system export of tickets for the period, with the query and run date, reconciled to the audit log", `A list ${self ? "you write" : `${ANALYST.first} writes`} of the tickets worked`, "Whatever tickets you can remember"] },
    ],
    lesson: "Test the right population before you test the items. Pull it from the system, reconcile it, and for small populations test everything.",
  };

  const rows = [...tested["APD-03"], ...tested["APD-01"], ...tested["APD-02"], ...tested["ACC-01"]];
  const testing: Task = {
    id: "W3", step: "Control testing", title: "Test every ticket in the sample", ctrl: "APD-01 to ACC-01", kind: "table", topics: ["verify", "jml", "leaver", "request"], rows,
    intro: `<p>Test each ticket against its control using the evidence shown: the audit log entries on the ticket and the account as it stood when the ticket closed. Compare groups with the access matrix (Policy &amp; matrix). Mark each one Pass or the exception you found.</p>`,
    lesson: "Test what the evidence shows, not what the ticket note claims. Timing matters: a verification recorded after the change doesn't count.",
  };

  const evidence: Task = {
    id: "W4", step: "Evidence evaluation", title: "Judge the evidence", ctrl: "APD-03", kind: "quiz", topics: ["evidence"],
    evidence: [["Audit log", `${LOG().length} entries, system-generated, with times and ticket references`], ["Ticket notes", `Written by ${self ? "you" : ANALYST.first} at close`]],
    intro: `<p>Evidence has to be reliable before you rely on it. Use the audit log (Audit log page) to answer the first question.</p>`,
    qs: [
      { q: "How many account changes in the audit log have no ticket reference?", short: "Changes without a ticket", num: true, correct: unticketed, pts: 3 },
      { q: "A ticket note says \"Caller verified\", but the audit log shows the password reset two minutes before the verification entry. What do you conclude?", short: "Note versus log", correct: 1, pts: 2,
        opts: ["Verified: the note says so", "Not verified before the change: the log is the evidence, and the note is only an assertion", "Inconclusive until the analyst remembers the call"] },
      { q: "An account change has no ticket. What makes it acceptable?", short: "Unticketed change", correct: 1, pts: 2,
        opts: ["A ticket raised afterwards to match it", "Nothing after the fact. Record it as an exception, then ask whether another approved record covers it, such as an emergency change.", "The analyst's explanation"] },
      { q: "Which of these are reliable audit evidence? Select all that apply.", short: "Reliable evidence", multi: true, correct: [0, 1, 2],
        opts: ["The system audit log, with timestamps and ticket references", "An approval reply recorded on the ticket before the change", "Group memberships you pulled from the directory yourself", `${self ? "Your" : `${ANALYST.first}'s`} recollection of the call`, "An undated screenshot sent by the analyst"] },
    ],
    lesson: "System-generated, time-stamped evidence you obtain yourself beats anything the auditee tells you. A change without a ticket is an exception, and no ticket raised afterwards fixes that.",
  };

  const f = FINDING[top];
  const n = tested[top].length;
  const ids = exc(top).map(r => r.name.split(" · ")[0]).join(", ");
  const effect = (aud.effects[top] ?? []).find(([k]) => fired(k))?.[1] ?? f.generic;
  const finding: Task = totalExc ? {
    id: "W5", step: "Finding", title: `Write the ${top} finding`, ctrl: top, kind: "quiz", topics: ["finding"],
    intro: `<p>${top} had the most exceptions: ${topN} of ${n} tickets tested. Build the finding. Pick the strongest statement for each element.</p>`,
    qs: [
      { q: "Condition", short: "Condition", correct: 1, pts: 2,
        opts: ["Some tickets weren't handled correctly.", `${topN} of ${n} ${f.pop} tickets tested were exceptions (${ids}).`, `${self ? "I" : ANALYST.first} didn't follow the runbook.`, `${n} of ${n} ${f.pop} tickets tested were exceptions.`] },
      { q: "Criteria", short: "Criteria", correct: 0, pts: 2, opts: [f.criteria, "Best practice says this should be done carefully.", "NIST requires it."] },
      { q: "Cause", short: "Cause", correct: 2, pts: 2, opts: [`${self ? "I was" : `${ANALYST.first} was`} careless.`, "Unknown.", f.cause] },
      { q: "Effect", short: "Effect", correct: 1, pts: 2, opts: ["The company will fail its next audit.", effect, "No impact, because the tickets were closed."] },
      { q: "Recommendation", short: "Recommendation", correct: 0, pts: 2, opts: [f.rec, `Retrain ${self ? "me" : ANALYST.first}.`, "Add a second analyst to every ticket."] },
    ],
    lesson: "A finding that holds up is specific (numbers and ticket IDs), cites the actual requirement, names a cause that can be fixed, states the real impact without exaggerating, and recommends a fix for the cause, not the person.",
  } : {
    id: "W5", step: "Finding", title: "Report a clean result", ctrl: "All", kind: "quiz", topics: ["finding"],
    intro: "<p>Every ticket tested passed. A clean result still needs to be reported properly.</p>",
    qs: [
      { q: "What do you report?", short: "Clean result", correct: 0, pts: 3,
        opts: ["The controls operated effectively for the tickets tested, with the scope, period and sample stated", "Nothing: without exceptions there's no report", "That the controls will keep working"] },
      { q: "Does a clean shift mean the controls are designed well?", short: "Design versus operation", correct: 1, pts: 3,
        opts: ["Yes", "Not by itself. Operating well on one shift doesn't fix design gaps, such as the directory allowing resets before verification."] },
    ],
    lesson: "A clean result is a real conclusion. State what you tested, for which period, and what it does and doesn't prove.",
  };

  const risk: Task = {
    id: "W6", step: "Risk ratings", title: "Rate the risk for each control", ctrl: "RISK", kind: "table", topics: ["risk"],
    intro: `<p>Rate each control's risk. Score = likelihood × impact. <b>High</b> 15–25, <b>Medium</b> 8–14, <b>Low</b> 1–7.</p><p>Likelihood comes from the exception rate you found: none = Rare (1), up to 25% = Possible (3), up to 50% = Likely (4), over 50% = Almost certain (5). Impact is set by what the control protects: Minimal 1 · Minor 2 · Moderate 3 · Major 4 · Severe 5.</p>`,
    rows: Object.keys(IMPACT).map(c => {
      const x = exc(c).length, nn = tested[c].length, [ll, lv] = likelihood(x, nn), [il, iv] = IMPACT[c], sc = lv * iv;
      return { name: `${c} ${WEEK_CONTROLS.find(w => w[0] === c)![1]}`, sub: `${x} of ${nn} exceptions`, opts: ["High", "Medium", "Low"], correct: band(sc),
        why: `${ll} (${lv}) × ${il} (${iv}) = ${sc}.`, kv: [["Exceptions", `${x} of ${nn}`], ["Likelihood", ll], ["Impact", il]] };
    }),
    lesson: "Apply the matrix the same way every time. The ranking decides what management fixes first, so consistency matters more than instinct.",
  };

  const response: Task = {
    id: "W7", step: "Management response", title: "Evaluate the management response", ctrl: totalExc ? top : "All", kind: "quiz", topics: ["remediation"],
    evidence: [[`Response from ${mgr}`, `"${totalExc ? f.resp : "Thanks. We'll keep doing what we're doing."}"`]],
    intro: "<p>You shared the draft finding with management. Evaluate their response before the report goes out.</p>",
    qs: [
      { q: "Is the response adequate?", short: "Adequacy", correct: 1, pts: 2,
        opts: ["Yes: management has responded", "No: it doesn't fix the cause, and has no owner, date or evidence of completion"] },
      { q: "What must a management action plan include? Select all that apply.", short: "Action plan", multi: true, correct: [0, 1, 2, 3],
        opts: ["An action that fixes the cause", "A named owner", "A target date", "How completion will be evidenced for re-testing", "Disciplinary action against the analyst", "A statement disputing the finding"] },
      { q: "When is the finding closed?", short: "Closing the finding", correct: 1, pts: 2,
        opts: ["When management says it's fixed", "After you re-test and the control operates as designed", "Automatically at the next annual audit"] },
      self
        ? { q: "The exceptions are in your own work. How do you report them?", short: "Auditing your own work", correct: 0, pts: 2,
            opts: ["Exactly like anyone else's, and disclose that you audited your own shift", "Fix the log entries first", "Leave your tickets out of the sample"] }
        : { q: `${ANALYST.first} asks you to leave their name out and fix the log entries quietly. What do you do?`, short: "Pressure from the auditee", correct: 0, pts: 2,
            opts: ["Report the facts about the control, not the person, and never change evidence", "Fix the entries, since the damage is done", "Drop the finding to keep the relationship"] },
    ],
    lesson: "A response is only adequate if it fixes the cause with an owner and a date. The finding closes when re-testing proves the fix, not when someone says so.",
  };

  const wa: WeekAudit = { who, tasks: [walkthrough, sampling, testing, evidence, finding, risk, response], st: {} };
  S.wa = wa; save();
  return wa;
}

// ---------- Grading ----------
export function gradeTask(t: Task, a: Answers): Check[] {
  const checks: Check[] = [];
  if (t.kind === "table") t.rows!.forEach((r, i) => {
    const v = a[i] as number | undefined, ok = v === r.correct;
    checks.push(C(ok, `${r.name}: ${v == null ? "not marked" : r.opts[v]}`, 1, ok ? r.why : `Correct: ${r.opts[r.correct]}. ${r.why}`));
  });
  else t.qs!.forEach((q, i) => {
    if (q.num) { const ok = a[i] === q.correct; checks.push(C(ok, `${q.short}: you answered ${a[i] ?? "nothing"}`, q.pts ?? 2, ok ? "" : `Correct: ${q.correct}`)); }
    else if (q.multi) {
      const sel = (a[i] as number[]) || [], want = q.correct as number[];
      q.opts!.forEach((o, j) => { const should = want.includes(j), did = sel.includes(j); checks.push(C(should === did, (did ? "Selected: " : "Left out: ") + o, 1, should === did ? "" : should ? "This should be selected." : "This should not be selected.")); });
    } else { const ok = a[i] === q.correct; checks.push(C(ok, q.short, q.pts ?? 2, ok ? "" : "Correct: " + q.opts![q.correct as number])); }
  });
  return checks;
}
const items = (t: Task) => (t.kind === "table" ? t.rows! : t.qs!);
// Grades a task. Returns an error message when a required item is unanswered.
export function submitTask(id: string, a: Answers): string | null {
  const wa: WeekAudit = S.wa, t = wa.tasks.find(x => x.id === id)!;
  if (items(t).some((q: any, i) => !q.multi && a[i] == null)) return "Answer every item before submitting";
  const checks = gradeTask(t, a);
  wa.st[id] = { ans: a, checks, score: checks.filter(c => c.pass).reduce((s, c) => s + c.pts, 0), max: checks.reduce((s, c) => s + c.pts, 0) };
  save(); return null;
}
export function retryTask(id: string) { if (S.wa) { S.wa.st[id] = {}; save(); } }
export function saveDraft(id: string, a: Answers) { const st = (S.wa.st[id] ||= {}); st.draft = a; save(); }

export const weekAudit = (): WeekAudit | null => (S.wa && S.wa.tasks ? S.wa : null);
export function waTotals() {
  const wa = weekAudit();
  let sc = 0, mx = 0, done = 0;
  wa?.tasks.forEach(t => { const st = wa.st[t.id]; if (st?.checks) { sc += st.score!; mx += st.max!; done++; } });
  return { sc, mx, done, n: wa ? wa.tasks.length : 7, pct: mx ? Math.round(sc / mx * 100) : null };
}
// The self-audit is optional on IAM + GRC.
export function skipSelfAudit() { S.wa = { ...(S.wa || {}), skipped: true }; save(); }
export function unskipSelfAudit() { if (S.wa) { delete S.wa.skipped; if (!S.wa.tasks) S.wa = null; save(); } }
