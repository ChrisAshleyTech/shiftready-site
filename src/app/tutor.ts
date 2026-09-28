// Guided tutor, ported from v1 views/tutor.js. Rule-based, not a language model: it asks guiding
// questions, recaps what you've done from the audit log, explains terms and looks up people and
// roles. It never gives the answer; that's what hints are for, and hints cost points.
// Answers are HTML built from our own data, with every dynamic value escaped by h().
import { S, U } from "@/engine/store.js";
import { ROLES } from "@/engine/company.js";
import { TK } from "@/engine/tickets.js";
import { HINTS } from "@/engine/hints.js";
import { h, ui, lastTxt } from "./sim";

const QUESTIONS: Record<string, string[]> = {
  caller:["Who is asking, and how did they reach you?","Which two details does policy say you must match, and where is the source of truth for them?","What's the smallest change that fixes the actual problem?"],
  joiner:["Which row of the access matrix matches this person's department and title?","Is anything being asked for beyond that row? If so, who asked for it, and is it allowed?","What state is the account in right now?"],
  mover:["What did the old role grant that the new role doesn't?","What does updating job info change, and what doesn't it change?"],
  leaver:["Which three things does offboarding touch?","Does the HR feed or the sign-in history make this more than cleanup?"],
  loa:["What's the difference between leave and termination for the account?","What will this person need on the day they come back?"],
  rehire:["What did the account carry over from last time: access, credentials, job info?","Which of those should be fresh for a new start?"],
  request:["Is the requested group on the requestable list, or part of the person's role?","What has to be on the ticket before you grant it, and in what order?"],
  sod:["What does this person already hold?","Would the combination let one person complete a risky process alone?","Can a manager's approval override that rule?"],
  priv:["How does policy say privileged access is granted?","If this account were phished tomorrow, what could the attacker do?"],
  sweep:["What's the exact threshold? Is it 'more than' or 'at least'?","Which accounts are excluded from the sweep, and why?","Is every stale account a person?"],
  contractor:["Who is the sponsor, and have they agreed on this ticket?","What's the longest an extension can run?"],
  shared:["If a whole shift shares one login, how does anyone tell who did what?","What would fix the slow logins without sharing an account?"],
  review:["What exactly did the reviewer mark?","What did they certify, and should any of that change?"],
  audit:["What conditions define a match in the auditor's request?","What's the most reliable place to get the answer?"],
  compromise:["What could the attacker still be holding right now: a session, a password, an MFA method?","Which Directory action takes away each of those?","Who investigates once the account is contained?"],
  service:["What broke, and what's the fastest safe way to restore it?","Who owns this account and gets to decide its future?"],
};
const RISK: Record<string, string> = {
  caller:"Resetting credentials for the wrong person hands them the account. Help-desk social engineering is one of the most common ways attackers get in.",
  joiner:"Extra access on day one tends to stay for years. Auditors test new-hire access against the role.",
  mover:"Movers who keep old access accumulate it. That's privilege creep, and it's how one person ends up able to do too much.",
  leaver:"Every hour a leaver's account stays usable is exposure: data theft, sabotage, or an attacker using a forgotten account.",
  loa:"Removing access for a temporary absence means rebuilding it later, usually wrongly. Leaving it enabled leaves an unmonitored account open.",
  rehire:"Old access and old passwords come back with the account unless someone cleans them out.",
  request:"Access granted without a recorded approval is an audit exception, even if it was harmless.",
  sod:"Separation of duties stops one person from committing fraud and hiding it. Approvals don't change the math.",
  priv:"Standing admin rights turn a single phished account into a company-wide breach.",
  sweep:"Dormant accounts are a favorite target: nobody notices when they're used. But disabling the wrong kind of account can break production.",
  contractor:"Contractor accounts without end dates outlive their contracts. Missing an extension has a business cost too.",
  shared:"Shared accounts destroy accountability. Nobody can prove who did what.",
  review:"An access review only counts if its decisions are carried out and evidenced.",
  audit:"Wrong or incomplete audit evidence becomes a finding of its own.",
  compromise:"A half-contained account is still compromised. Attackers keep sessions and tokens and come back.",
  service:"Service accounts run production. Changes to them fail silently until something important breaks.",
};
const TERMS: Record<string, [string, string]> = {
  verify:["Identity verification","Confirming a caller is who they claim to be by matching details against the system of record (the directory), not against what the caller says. Here: employee ID and manager."],
  birthright:["Birthright access","The groups every person in a role gets automatically, listed in the access matrix. Anything beyond them needs its own justification."],
  leastpriv:["Least privilege","Give people only the access their job needs, for only as long as they need it."],
  sod:["Separation of duties (SoD)","Splitting a sensitive process so no single person can complete it alone, like entering and approving the same invoice."],
  requestable:["Requestable access","Groups that can be granted outside a role with a documented manager approval. Only the groups listed in policy qualify."],
  approval:["Documented approval","An approval recorded on the ticket before the change is made. A change before the approval counts as unapproved."],
  pim:["PIM / just-in-time access","Privileged roles are activated for a short time when needed, with approval, instead of being held permanently."],
  sessions:["Revoking sessions","Signs the account out everywhere and invalidates refresh tokens. Disabling or resetting a password alone doesn't end sessions that are already open."],
  mfa:["MFA reset","Clears registered MFA methods so the user must register again. Use it when a device is lost or an attacker may have added their own method."],
  fatigue:["MFA fatigue","An attacker with a password sends push prompts until the user approves one to make them stop. Number matching helps prevent it."],
  jml:["Joiner, mover, leaver (JML)","The identity lifecycle: provisioning new people, changing access when they move, and removing it when they leave."],
  loa:["Leave of absence","A temporary absence. Accounts are disabled but keep their access, so the return is one step."],
  stale:["Inactive (stale) accounts","Accounts with no sign-in past a threshold (here, more than 90 days). Attackers target them because nobody notices when they're used."],
  service:["Service account","A non-human account that runs a job or integration. It has an owner, and the desk doesn't disable it."],
  shared:["Shared account","One login used by several people. It breaks accountability, and policy prohibits it."],
  escalate:["Escalation","Handing a ticket to the team that owns the next step: Security for suspected attacks, an account's owner for service accounts."],
  social:["Social engineering","Manipulating people rather than systems, for example a caller who invents urgency to skip verification."],
};
export const KIND_TERMS: Record<string, string[]> = {
  caller:["verify","social","mfa","sessions"], joiner:["birthright","leastpriv","jml"], mover:["birthright","jml","leastpriv"], leaver:["jml","sessions","escalate"],
  loa:["loa","jml"], rehire:["jml","birthright"], request:["requestable","approval","leastpriv"], sod:["sod","approval","requestable"], priv:["pim","leastpriv"],
  sweep:["stale","service","escalate"], contractor:["approval","jml"], shared:["shared","leastpriv"], review:["leastpriv","birthright"], audit:["sod"],
  compromise:["sessions","mfa","fatigue","escalate"], service:["service","escalate"],
};
export const termLabel = (k: string) => TERMS[k][0];
export const kindOf = (tid: string) => (HINTS[tid] || {}).kind || "request";

const p = (s: string) => `<p>${s}</p>`;
const ul = (a: string[]) => `<ul>${a.map(x => `<li>${x}</li>`).join("")}</ul>`;
const acctLink = (id: string) => `<a href="#/directory/${encodeURIComponent(id)}">${h(U(id).name)}</a>`;

function recap(tid: string) {
  const t = TK[tid], ts = S.tickets[tid];
  const mine = S.log.filter((e: any) => e.ticket === tid && !["start", "close"].includes(e.a));
  const loose = S.log.filter((e: any) => !e.ticket && t.users.includes(e.target));
  if (ts.status === "new") return p("You haven't started this ticket. Starting it makes it the active ticket, so the changes you make are recorded against it.");
  let out = mine.length ? p(`Here's what the audit log shows under <span class="font-mono">${tid}</span>:`) + ul(mine.map((e: any) => `<span class="font-mono">${e.t}</span> ${e.target ? h(e.target) + ": " : ""}${h(e.d)}`)) : p("No changes are logged against this ticket yet.");
  const facts: string[] = [];
  if (t.caller) facts.push(S.log.some((e: any) => e.ticket === tid && e.a === "verify") ? "Caller identity is marked verified on this ticket." : "Caller identity is <b>not</b> marked verified on this ticket.");
  if (ts.approval) facts.push("An approval was requested.");
  if (ts.esc.length) facts.push("Escalated to: " + ts.esc.map(h).join(", ") + ".");
  if (loose.length) facts.push(`<b>${loose.length} change${loose.length > 1 ? "s" : ""}</b> to this ticket's accounts ${loose.length > 1 ? "were" : "was"} made with no active ticket. An auditor would flag ${loose.length > 1 ? "them" : "it"}.`);
  if (facts.length) out += ul(facts);
  return out + (ts.checks ? "" : p("Is anything the ticket asked for still missing? Compare it with what's above."));
}

function whyLost(tid: string) {
  const t = TK[tid], ts = S.tickets[tid];
  const miss = ts.checks.filter((c: any) => !c.pass);
  if (!miss.length) return p("You didn't lose any points on the checks." + (ts.hints ? " The only deduction is the hint penalty." : " Clean ticket."));
  return p("These checks didn't pass:") + ul(miss.map((c: any) => `${h(c.label)}${c.detail ? ` <span class="text-muted-foreground">(${h(c.detail)})</span>` : ""}`)) + p(`<b>Why it matters:</b> ${h(t.lesson)}`) + p("The hints on this ticket are free to read now that it's closed.");
}

function whoIs(id: string) {
  const u = U(id);
  return p(`${acctLink(id)}: ${h(u.title)}, ${h(u.dept)}. ${u.type !== "Employee" ? h(u.type) + " account. " : ""}Manager: ${h(u.mgr)}.`) +
    ul([`Status: ${u.enabled ? "enabled" : u.preHire ? "pre-hire, disabled" : "disabled"}${u.locked ? ", locked" : ""}`, `Last sign-in: ${lastTxt(u.last)}`, `${u.groups.length} group memberships`]);
}

function answer(tid: string, q: string) {
  const t = TK[tid], ts = S.tickets[tid], kind = kindOf(tid);
  const s = q.toLowerCase();
  if (q === "@start") return p("Some questions to work through:") + ul(QUESTIONS[kind].map(h)) + p('Check the <a href="#/policy">runbook</a> and the <a href="#/hr">HR feed</a> as you go.');
  if (q === "@recap" || /\b(so far|did i|have i|my work|progress|done)\b/.test(s)) return recap(tid);
  if (q === "@why") return ts.checks ? whyLost(tid) : p("Close the ticket first, and I'll go through each check with you.");
  if (q === "@risk" || /\b(risk|why does it matter|what could go wrong|impact)\b/.test(s)) return p(RISK[kind]);
  if (q === "@who") return t.users.length ? t.users.map(whoIs).join("") + (t.caller ? p("Compare the caller's details with the record yourself before you act.") : "") : p("This ticket isn't about one account. The Directory's filters and sort will help.");
  if (q === "@terms") return p("Pick a term below to have it explained.");
  if (q.startsWith("@term:")) { const [label, text] = TERMS[q.slice(6)]; return p(`<b>${h(label)}.</b> ${h(text)}`); }
  if (/\b(answer|solution|solve|tell me what|what should i do|what do i do|just tell|steps)\b/.test(s))
    return p("I won't hand you the answer. Working it out is the point. If you're stuck, the <b>Hints</b> on the ticket go from a nudge to exact steps, and each tier costs part of the ticket's score.") + p("Try this instead: " + h(QUESTIONS[kind][0]));
  const roleKey = Object.keys(ROLES).find(k => s.includes(k.split("|")[1].toLowerCase()));
  if (roleKey && /\b(role|matrix|group|access|get|birthright)\b/.test(s)) return p(`The access matrix gives <b>${h(roleKey.replace("|", " / "))}</b>: <span class="font-mono">${(ROLES as any)[roleKey].join(", ")}</span>.`);
  const person = Object.values(S.users).find((u: any) => s.includes(u.id) || (u.name.length > 3 && s.includes(u.name.toLowerCase())) || (u.type === "Employee" && s.split(/\W+/).includes(u.name.split(" ")[1]?.toLowerCase()) && t.users.includes(u.id))) as any;
  if (person) return whoIs(person.id);
  const termMap: [RegExp, string][] = [[/verif|identity|caller/,"verify"],[/\bsod\b|separation|conflict/,"sod"],[/birthright|matrix/,"birthright"],[/least priv/,"leastpriv"],[/requestable/,"requestable"],[/approv/,"approval"],[/\bpim\b|just.in.time|global admin|privileg/,"pim"],[/session|revoke|token/,"sessions"],[/fatigue|push/,"fatigue"],[/\bmfa\b|authenticator/,"mfa"],[/leave|\bloa\b/,"loa"],[/stale|inactive|dormant|90 days/,"stale"],[/service account|svc/,"service"],[/shared/,"shared"],[/escalat/,"escalate"],[/social|phish|urgent/,"social"],[/joiner|mover|leaver|\bjml\b|offboard|onboard/,"jml"]];
  const hit = termMap.find(([re]) => re.test(s));
  if (hit) { const [label, text] = TERMS[hit[1]]; return p(`<b>${h(label)}.</b> ${h(text)}`); }
  return p("I'm a guided tutor, so I only understand a few kinds of question: terms (\"what is SoD?\"), people (\"who is Bob Turner?\"), roles (\"what does a Dispatcher get?\"), and \"what have I done so far?\"");
}

export function ask(tid: string, q: string, label?: string) {
  const log = ui.tutor[tid] || (ui.tutor[tid] = []);
  log.push({ who: "me", html: h(label || q) }, { who: "bot", html: answer(tid, q) });
}
