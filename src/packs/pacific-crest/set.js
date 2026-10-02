// Pacific Crest's ticket set: Monday and Thursday tickets, hints, the GRC audit desk, and what the
// rest of the app needs to run them (a perfect playbook, Jordan Reyes' week, the week audit's
// populations and framework topics). Other companies build theirs with lib/ticketKit.js.
import { S, U } from "../../engine/store.js";
import { act, tact } from "../../engine/state.js";
import { ROLES } from "./company.js";
import { T } from "./tickets.js";
import { TK } from "../../engine/tickets.js";
import { CONSEQ, BASE_THU } from "./thursday.js";
import { HINTS, CONSEQ_LINKS } from "./hints.js";
import { G } from "./grc.js";

const role = rk => ROLES[rk];
const setGroups = (uid, want) => { U(uid).groups.slice().forEach(g => { if (!want.includes(g)) act("rmgrp", uid, g); }); want.forEach(g => act("addgrp", uid, g)); };
// The exact-steps hints, as actions. Each returns the close kind, or [kind, answer].
const playbook = {
  REQ0018841: () => { act("enable", "maria.lopez"); setGroups("maria.lopez", role("Finance|AP Clerk")); return "resolve"; },
  INC0041207: id => { tact("verify", id); act("pwreset", "james.carter"); return "resolve"; },
  INC0041209: id => { tact("verify", id); act("unlock", "aisha.brown"); return "resolve"; },
  INC0041212: id => { tact("verify", id); act("mfareset", "kevin.nguyen"); act("revoke", "kevin.nguyen"); return "resolve"; },
  REQ0018850: () => { act("disable", "robert.hayes"); act("revoke", "robert.hayes"); setGroups("robert.hayes", []); return "resolve"; },
  REQ0018852: () => { act("job", "tanya.wright", "Operations|Dispatcher"); setGroups("tanya.wright", role("Operations|Dispatcher")); return "resolve"; },
  REQ0018855: () => "reject",
  REQ0018858: id => { tact("approval", id); act("addgrp", "omar.hassan", "APP-Salesforce-Reports"); return "resolve"; },
  INC0041220: id => { tact("escalate", id, "Security team"); return "reject"; },
  REQ0018861: id => { tact("approval", id); act("expiry", "dev.patel", "90"); return "resolve"; },
  TSK0007712: id => { ["greg.foster", "nina.shah", "paul.kim"].forEach(u => act("disable", u)); tact("escalate", id, "Account owner"); return "resolve"; },
  INC0041231: id => { act("disable", "brian.walsh"); act("revoke", "brian.walsh"); setGroups("brian.walsh", []); tact("escalate", id, "Security team"); return "resolve"; },
  REQ0018866: () => "reject",
  REQ0018870: () => { act("enable", "sofia.ramirez"); act("pwreset", "sofia.ramirez"); act("job", "sofia.ramirez", "HR|HR Generalist"); setGroups("sofia.ramirez", role("HR|HR Generalist")); return "resolve"; },
  REQ0018873: () => "reject",
  REQ0018876: () => { act("rmgrp", "jordan.lee", "APP-Finance-Reports"); return "resolve"; },
  REQ0018879: () => { act("disable", "rachel.adams"); return "resolve"; },
  REQ0018881: () => { act("enable", "ethan.moore"); setGroups("ethan.moore", role("Operations|Dispatcher")); return "resolve"; },
  REQ0018884: () => { const want = Object.values(S.users).filter(u => u.enabled && u.groups.includes("APP-SAP-AP-Entry") && u.groups.includes("APP-SAP-AP-Approve")).map(u => u.id); return ["resolve", want.join(", ") || "none"]; },
  INC0041240: id => { ["revoke", "pwreset", "mfareset"].forEach(a => act(a, "sam.okafor")); tact("escalate", id, "Security team"); return "resolve"; },
  REQ0018910: () => "reject",
  REQ0018912: () => { act("enable", "rachel.adams"); setGroups("rachel.adams", role("Sales|Account Executive")); return "resolve"; },
  INC0041302: id => { const tg = TK[id].users[0]; ["disable", "revoke", "mfareset"].forEach(a => act(a, tg)); tact("escalate", id, "Security team"); return "resolve"; },
  INC0041305: id => { act("enable", "svc-backup"); tact("escalate", id, "Account owner"); return "resolve"; },
  INC0041308: id => { act("disable", "robert.hayes"); act("revoke", "robert.hayes"); setGroups("robert.hayes", []); tact("escalate", id, "Security team"); return "resolve"; },
  INC0041311: id => { act("disable", "brian.walsh"); act("revoke", "brian.walsh"); setGroups("brian.walsh", []); tact("escalate", id, "Security team"); return "resolve"; },
  INC0041314: id => { act("rmgrp", "lisa.morales", "APP-SAP-AP-Approve"); tact("escalate", id, "Security team"); return "resolve"; },
  REQ0018915: () => { setGroups("ethan.moore", role("Operations|Dispatcher")); act("rmgrp", "bob.turner", "APP-SAP-AP-Entry"); act("rmgrp", "bob.turner", "APP-Finance-Reports"); return "resolve"; },
  INC0041318: id => { act("rmgrp", "tyler.brooks", "ROLE-Global-Admin"); act("revoke", "tyler.brooks"); tact("escalate", id, "Security team"); return "resolve"; },
  INC0041320: id => { ["revoke", "mfareset", "pwreset"].forEach(a => act(a, "patricia.reed")); tact("escalate", id, "Security team"); return "resolve"; },
  INC0041323: id => { tact("approval", id); act("enable", "dev.patel"); act("expiry", "dev.patel", "90"); return "resolve"; },
  INC0041326: id => { ["revoke", "pwreset", "mfareset"].forEach(a => act(a, "sam.okafor")); tact("escalate", id, "Security team"); return "resolve"; },
  INC0041329: id => { act("revoke", "james.carter"); act("pwreset", "james.carter"); tact("escalate", id, "Security team"); return "resolve"; },
  REQ0018918: () => { act("rmgrp", "jordan.lee", "APP-Finance-Reports"); return "resolve"; },
  REQ0018921: () => { setGroups("tanya.wright", role("Operations|Dispatcher")); return "resolve"; },
};

// Jordan Reyes' close note on each ticket, and the six planted mistakes. Every other ticket is
// worked by the playbook.
const notes = {
  REQ0018841: "Enabled and provisioned from the AP Clerk role.",
  INC0041207: "Caller verified. Temp password issued, client call at 9.",
  INC0041209: "Verified emp ID and manager. Unlocked only.",
  INC0041212: "MFA reset for new phone, sessions revoked. Caller verified.",
  REQ0018850: "Offboarded per leaver policy.",
  REQ0018852: "Job info and Dispatcher access done.",
  REQ0018855: "Rejected: AP Approve conflicts with her AP Entry (SoD).",
  REQ0018858: "Manager approved. Granted Salesforce Reports only.",
  INC0041220: "Employee ID didn't match. No changes, sent to Security.",
  REQ0018861: "Sponsor approved, extended 90 days.",
  TSK0007712: "Disabled 3 accounts over 90 days. svc-backup sent to its owner.",
  INC0041231: "Disabled, revoked, access removed. Security notified of the sign-in.",
  REQ0018866: "Rejected: Global Admin isn't requestable. Pointed Tyler to the print admin role process.",
  REQ0018870: "Rehire: enabled, new password, HR Generalist role.",
  REQ0018873: "Rejected: shared accounts aren't allowed.",
  REQ0018876: "Removed per the Q3 review.",
  REQ0018879: "Disabled for leave, groups kept.",
  REQ0018881: "Provisioned from the Dispatcher role, not from Bob's access.",
  REQ0018884: "List pulled from the directory.",
  INC0041240: "Contained and escalated.",
  REQ0018910: "Manager approved for the cycle count.",
  REQ0018912: "Welcome back. Enabled, groups confirmed.",
  INC0041308: "Disabled now. Security has the CargoWise activity.",
  INC0041329: "Contained. Security engaged.",
  REQ0018921: "Removed leftover Sales access.",
};
const jordan = {
  notes,
  plays: {
    // Reset the password first, marked the caller verified afterwards.
    INC0041207: id => { act("pwreset", "james.carter"); tact("verify", id); return "resolve"; },
    // Cleared MFA before verifying the caller.
    INC0041212: id => { act("mfareset", "kevin.nguyen"); tact("verify", id); act("revoke", "kevin.nguyen"); return "resolve"; },
    // Revoked sessions and removed access, but never disabled the account.
    REQ0018850: () => { act("revoke", "robert.hayes"); setGroups("robert.hayes", []); return "resolve"; },
    // Added the Dispatcher role but left the old Sales access in place.
    REQ0018852: () => { act("job", "tanya.wright", "Operations|Dispatcher"); role("Operations|Dispatcher").forEach(g => act("addgrp", "tanya.wright", g)); return "resolve"; },
    // Thursday: granted admin rights that aren't requestable because the manager approved.
    REQ0018910: id => { tact("approval", id); act("addgrp", "aisha.brown", "APP-WMS-Admin"); return "resolve"; },
  },
  // Mid-morning, Marcus Bell asks at the desk for a password reset. Jordan does it without a ticket.
  unticketed: { after: "REQ0018858", act: ["pwreset", "marcus.bell"] },
  MISTAKES: {
    INC0041207: "Password reset before the caller was verified",
    INC0041212: "MFA cleared before the caller was verified",
    REQ0018850: "Leaver's account left enabled",
    REQ0018852: "Mover kept the old role's access",
    REQ0018910: "Non-requestable admin access granted on approval",
    unticketed: "Password reset for Marcus Bell with no ticket",
  },
};

// The week audit's populations, sampling choices and the incidents each finding can cite.
const audit = {
  manager: { name: "Victor Alvarez", title: "IT Manager" },
  callers: ["INC0041207", "INC0041209", "INC0041212", "INC0041220"],
  jml: [["REQ0018841", "maria.lopez", "Finance|AP Clerk"], ["REQ0018852", "tanya.wright", "Operations|Dispatcher"],
    ["REQ0018870", "sofia.ramirez", "HR|HR Generalist"], ["REQ0018881", "ethan.moore", "Operations|Dispatcher"],
    ["REQ0018912", "rachel.adams", "Sales|Account Executive"]],
  leavers: [["REQ0018850", "robert.hayes"], ["INC0041231", "brian.walsh"]],
  requests: [["REQ0018855", "lisa.morales", "APP-SAP-AP-Approve"], ["REQ0018858", "omar.hassan", "APP-Salesforce-Reports"],
    ["REQ0018866", "tyler.brooks", "ROLE-Global-Admin"], ["REQ0018873", "marcus.bell", null], ["REQ0018910", "aisha.brown", "APP-WMS-Admin"]],
  // Options for the sampling questions: [ticket, belongs in the population].
  sampling: {
    "APD-03": [["INC0041207", true], ["REQ0018850", false], ["INC0041209", true], ["INC0041240", false], ["INC0041212", true], ["REQ0018841", false], ["INC0041220", true]],
    "APD-02": [["REQ0018850", true], ["REQ0018879", false], ["REQ0018852", false], ["INC0041231", true]],
  },
  effects: {
    "APD-03": [["james", "An unverified reset let an attacker into James Carter's mailbox for three days (INC0041329)."], ["cfo", "An attacker impersonating the CFO got a $250,000 wire approved (INC0041320)."]],
    "APD-02": [["robert", "Robert Hayes opened 41 shipment records from home the night after his termination (INC0041308)."], ["brian", "A former employee exported 12,000 Salesforce contacts (INC0041311)."]],
    "ACC-01": [["lisa", "Lisa Morales approved her own $48,200 invoice (INC0041314)."], ["tyler", "A standing Global Admin account was used to forward the CFO's mail externally (INC0041318)."]],
    "APD-01": [["tanya", "Tanya Wright exported her old territory's Sales leads after moving to Operations (REQ0018921)."], ["ethan", "A new Dispatcher opened payroll reports with access copied from a peer (REQ0018915)."]],
  },
};

// Framework topics for each ticket.
const topics = {
  REQ0018841: ["jml"], INC0041207: ["verify"], INC0041209: ["verify"], INC0041212: ["verify", "incident"],
  REQ0018850: ["leaver"], REQ0018852: ["jml"], REQ0018855: ["sod", "request"], REQ0018858: ["request"],
  INC0041220: ["verify", "incident"], REQ0018861: ["contractor"], TSK0007712: ["inactive", "service"],
  INC0041231: ["leaver", "incident"], REQ0018866: ["privileged"], REQ0018870: ["jml"], REQ0018873: ["shared"],
  REQ0018876: ["review"], REQ0018879: ["leave"], REQ0018881: ["jml"], REQ0018884: ["sod", "evidence"],
  INC0041240: ["incident"],
  REQ0018910: ["privileged", "request"], REQ0018912: ["jml"], INC0041302: ["inactive", "incident"],
  INC0041305: ["service"], INC0041308: ["leaver", "incident"], INC0041311: ["leaver", "incident"],
  INC0041314: ["sod", "incident"], REQ0018915: ["jml"], INC0041318: ["privileged", "incident"],
  INC0041320: ["verify", "incident"], INC0041323: ["contractor"], INC0041326: ["incident"],
  INC0041329: ["verify", "incident"], REQ0018918: ["review"], REQ0018921: ["jml"],
};

// The GRC audit desk's framing.
const grc = {
  ctx: "Q3 SOX ITGC fieldwork",
  intro: "You're the IT auditor for Pacific Crest's Q3 SOX cycle. Test the access controls, judge what you find, and write it up.",
  levels: { title: "Deficiency levels (SOX)", items: [
    ["Control deficiency", "a control's design or operation doesn't prevent or detect misstatements on a timely basis."],
    ["Significant deficiency", "less severe than a material weakness, but important enough to merit the attention of those overseeing financial reporting."],
    ["Material weakness", "a reasonable possibility that a material misstatement won't be prevented or detected on a timely basis."]],
    note: "Weigh the likelihood and size of a possible misstatement, the systems involved, and whether compensating controls operate." },
};

export const set = { id: "pacific-crest", T, CONSEQ, BASE_THU, HINTS, CONSEQ_LINKS, G, playbook, jordan, audit, topics, grc };
