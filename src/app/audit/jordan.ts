// Jordan Reyes, a simulated IAM analyst at Pacific Crest. On the GRC-only path the learner audits
// Jordan's Monday and Thursday. The week is played through the real engine, so the audit log,
// the directory, the ticket grades and Thursday's consequences are all genuine evidence.
// Jordan works most tickets by the runbook and makes six realistic mistakes (see MISTAKES).
import { S, U } from "@/engine/store.js";
import { ROLES } from "@/engine/company.js";
import { T, TK } from "@/engine/tickets.js";
import { act, tact, closeTicket } from "@/engine/state.js";
import { startThursday, THU_T } from "@/engine/thursday.js";

export const ANALYST = { name: "Jordan Reyes", first: "Jordan", title: "IAM Analyst" };

type Play = (id: string) => string | [string, string];
const role = (rk: string) => ROLES[rk] as string[];
const setGroups = (uid: string, want: string[]) => {
  U(uid).groups.slice().forEach((g: string) => { if (!want.includes(g)) act("rmgrp", uid, g); });
  want.forEach(g => act("addgrp", uid, g));
};

// What Jordan does on each ticket, with the close note Jordan wrote. Mistakes are marked.
const PLAY: Record<string, [Play, string]> = {
  REQ0018841: [() => { act("enable", "maria.lopez"); setGroups("maria.lopez", role("Finance|AP Clerk")); return "resolve"; }, "Enabled and provisioned from the AP Clerk role."],
  // Mistake: reset the password first, marked the caller verified afterwards.
  INC0041207: [id => { act("pwreset", "james.carter"); tact("verify", id); return "resolve"; }, "Caller verified. Temp password issued, client call at 9."],
  INC0041209: [id => { tact("verify", id); act("unlock", "aisha.brown"); return "resolve"; }, "Verified emp ID and manager. Unlocked only."],
  // Mistake: cleared MFA before verifying the caller.
  INC0041212: [id => { act("mfareset", "kevin.nguyen"); tact("verify", id); act("revoke", "kevin.nguyen"); return "resolve"; }, "MFA reset for new phone, sessions revoked. Caller verified."],
  // Mistake: revoked sessions and removed access, but never disabled the account.
  REQ0018850: [() => { act("revoke", "robert.hayes"); setGroups("robert.hayes", []); return "resolve"; }, "Offboarded per leaver policy."],
  // Mistake: added the Dispatcher role but left the old Sales access in place.
  REQ0018852: [() => { act("job", "tanya.wright", "Operations|Dispatcher"); role("Operations|Dispatcher").forEach(g => act("addgrp", "tanya.wright", g)); return "resolve"; }, "Job info and Dispatcher access done."],
  REQ0018855: [() => "reject", "Rejected: AP Approve conflicts with her AP Entry (SoD)."],
  REQ0018858: [id => { tact("approval", id); act("addgrp", "omar.hassan", "APP-Salesforce-Reports"); return "resolve"; }, "Manager approved. Granted Salesforce Reports only."],
  INC0041220: [id => { tact("escalate", id, "Security team"); return "reject"; }, "Employee ID didn't match. No changes, sent to Security."],
  REQ0018861: [id => { tact("approval", id); act("expiry", "dev.patel", "90"); return "resolve"; }, "Sponsor approved, extended 90 days."],
  TSK0007712: [id => { ["greg.foster", "nina.shah", "paul.kim"].forEach(u => act("disable", u)); tact("escalate", id, "Account owner"); return "resolve"; }, "Disabled 3 accounts over 90 days. svc-backup sent to its owner."],
  INC0041231: [id => { act("disable", "brian.walsh"); act("revoke", "brian.walsh"); setGroups("brian.walsh", []); tact("escalate", id, "Security team"); return "resolve"; }, "Disabled, revoked, access removed. Security notified of the sign-in."],
  REQ0018866: [() => "reject", "Rejected: Global Admin isn't requestable. Pointed Tyler to the print admin role process."],
  REQ0018870: [() => { act("enable", "sofia.ramirez"); act("pwreset", "sofia.ramirez"); act("job", "sofia.ramirez", "HR|HR Generalist"); setGroups("sofia.ramirez", role("HR|HR Generalist")); return "resolve"; }, "Rehire: enabled, new password, HR Generalist role."],
  REQ0018873: [() => "reject", "Rejected: shared accounts aren't allowed."],
  REQ0018876: [() => { act("rmgrp", "jordan.lee", "APP-Finance-Reports"); return "resolve"; }, "Removed per the Q3 review."],
  REQ0018879: [() => { act("disable", "rachel.adams"); return "resolve"; }, "Disabled for leave, groups kept."],
  REQ0018881: [() => { act("enable", "ethan.moore"); setGroups("ethan.moore", role("Operations|Dispatcher")); return "resolve"; }, "Provisioned from the Dispatcher role, not from Bob's access."],
  REQ0018884: [() => ["resolve", Object.values(S.users).filter((u: any) => u.enabled && u.groups.includes("APP-SAP-AP-Entry") && u.groups.includes("APP-SAP-AP-Approve")).map((u: any) => u.id).join(", ") || "none"], "List pulled from the directory."],
  INC0041240: [id => { ["revoke", "pwreset", "mfareset"].forEach(a => act(a, "sam.okafor")); tact("escalate", id, "Security team"); return "resolve"; }, "Contained and escalated."],
  // Thursday. Mistake: granted admin rights that aren't requestable because the manager approved.
  REQ0018910: [id => { tact("approval", id); act("addgrp", "aisha.brown", "APP-WMS-Admin"); return "resolve"; }, "Manager approved for the cycle count."],
  REQ0018912: [() => { act("enable", "rachel.adams"); setGroups("rachel.adams", role("Sales|Account Executive")); return "resolve"; }, "Welcome back. Enabled, groups confirmed."],
  INC0041308: [id => { act("disable", "robert.hayes"); act("revoke", "robert.hayes"); setGroups("robert.hayes", []); tact("escalate", id, "Security team"); return "resolve"; }, "Disabled now. Security has the CargoWise activity."],
  INC0041329: [id => { act("revoke", "james.carter"); act("pwreset", "james.carter"); tact("escalate", id, "Security team"); return "resolve"; }, "Contained. Security engaged."],
  REQ0018921: [() => { setGroups("tanya.wright", role("Operations|Dispatcher")); return "resolve"; }, "Removed leftover Sales access."],
};

// The mistakes, for tests and the answer key. Each is a ticket id and what went wrong.
export const MISTAKES = {
  INC0041207: "Password reset before the caller was verified",
  INC0041212: "MFA cleared before the caller was verified",
  REQ0018850: "Leaver's account left enabled",
  REQ0018852: "Mover kept the old role's access",
  REQ0018910: "Non-requestable admin access granted on approval",
  unticketed: "Password reset for Marcus Bell with no ticket",
} as const;

function work(id: string) {
  const [play, note] = PLAY[id];
  tact("start", id);
  let r = play(id); if (!Array.isArray(r)) r = [r, ""];
  closeTicket(id, r[0], { note, answer: TK[id].question ? r[1] : undefined });
}

// Plays Jordan's week into the current (fresh) state: Monday, then Thursday.
export function playJordanWeek() {
  T.forEach((t: any) => {
    work(t.id);
    // Mid-morning, Marcus Bell asks at the desk for a password reset. Jordan does it without a ticket.
    if (t.id === "REQ0018858") act("pwreset", "marcus.bell");
  });
  startThursday();
  THU_T.forEach((t: any) => work(t.id));
  S.jordan = 1;
}
