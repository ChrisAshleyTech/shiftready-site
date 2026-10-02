// Pacific Crest requester replies: who writes back when a fix didn't take (see engine/replies.js).
import { TK } from "../../engine/tickets.js";
import { ROLES } from "./company.js";
import * as R from "../../engine/replies.js";

const salesOnly = ROLES["Sales|Account Executive"].filter(g => !ROLES["Operations|Dispatcher"].includes(g));
const target = id => TK[id].users[0];

export const REPLIES = {
  // Assigned tickets
  REQ0018841: R.starter("maria.lopez", ROLES["Finance|AP Clerk"]),
  INC0041207: R.pwReset("james.carter", "James Carter"),
  INC0041209: R.unlock("aisha.brown", "Aisha Brown"),
  INC0041212: R.mfa("kevin.nguyen", "Kevin Nguyen"),
  REQ0018858: R.granted("omar.hassan", "APP-Salesforce-Reports", "Omar Hassan"),
  REQ0018870: R.starter("sofia.ramirez", ROLES["HR|HR Generalist"]),
  REQ0018884: R.answer(ts => TK.REQ0018884.grade(ts)[0].pass, "External auditor (via Dana Whitfield)"),
  // Standing tickets
  REQ0018912: R.starter("rachel.adams", ROLES["Sales|Account Executive"]),
  // Follow-ups
  INC0041302: ts => R.contained(target("INC0041302"), ["disabled", "revoked", "mfaReset"])(ts),
  INC0041305: R.restored("svc-backup", "Backup monitoring", "The SAP backup job"),
  INC0041308: R.contained("robert.hayes", ["disabled", "revoked", "noGroups"]),
  INC0041311: R.contained("brian.walsh", ["disabled", "revoked"]),
  INC0041314: R.contained("lisa.morales", [["lisa.morales", "APP-SAP-AP-Approve"]]),
  REQ0018915: () => R.removed("ethan.moore", ["APP-SAP-AP-Entry", "APP-Finance-Reports"], "Dana Whitfield (Controller)", "Finance access a Dispatcher shouldn't have")()
    || R.removed("bob.turner", ["APP-SAP-AP-Entry", "APP-Finance-Reports"], "Dana Whitfield (Controller)", "the leftover Finance access Ethan was copied from")(),
  INC0041318: R.contained("tyler.brooks", [["tyler.brooks", "ROLE-Global-Admin"], "revoked"]),
  INC0041320: R.contained("patricia.reed", ["revoked", "mfaReset"]),
  INC0041323: R.extended("dev.patel", "Carla Jensen (sponsor)"),
  INC0041326: R.contained("sam.okafor", ["revoked", "pwReset", "mfaReset"]),
  INC0041329: R.contained("james.carter", ["revoked", "pwReset"]),
  REQ0018918: R.removed("jordan.lee", ["APP-Finance-Reports"], "Internal Audit", "APP-Finance-Reports, which the Q3 reviewer marked for revocation"),
  REQ0018921: R.removed("tanya.wright", salesOnly, "Linda Park (Sales Manager)", "her old Sales access"),
};
