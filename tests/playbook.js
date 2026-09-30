// Shared by the engine tests and the path tests.
import { S, U } from "../src/engine/store.js";
import { ROLES } from "../src/engine/company.js";
import { TK } from "../src/engine/tickets.js";
import * as st from "../src/engine/state.js";

const role = rk => ROLES[rk];
const setGroups = (uid, want) => { U(uid).groups.slice().forEach(g => { if (!want.includes(g)) st.act("rmgrp", uid, g); }); want.forEach(g => st.act("addgrp", uid, g)); };
// The exact-steps hints, as actions. Each returns the close kind, or [kind, answer].
export const PLAYBOOK = {
  REQ0018841: () => { st.act("enable", "maria.lopez"); setGroups("maria.lopez", role("Finance|AP Clerk")); return "resolve"; },
  INC0041207: id => { st.tact("verify", id); st.act("pwreset", "james.carter"); return "resolve"; },
  INC0041209: id => { st.tact("verify", id); st.act("unlock", "aisha.brown"); return "resolve"; },
  INC0041212: id => { st.tact("verify", id); st.act("mfareset", "kevin.nguyen"); st.act("revoke", "kevin.nguyen"); return "resolve"; },
  REQ0018850: () => { st.act("disable", "robert.hayes"); st.act("revoke", "robert.hayes"); setGroups("robert.hayes", []); return "resolve"; },
  REQ0018852: () => { st.act("job", "tanya.wright", "Operations|Dispatcher"); setGroups("tanya.wright", role("Operations|Dispatcher")); return "resolve"; },
  REQ0018855: () => "reject",
  REQ0018858: id => { st.tact("approval", id); st.act("addgrp", "omar.hassan", "APP-Salesforce-Reports"); return "resolve"; },
  INC0041220: id => { st.tact("escalate", id, "Security team"); return "reject"; },
  REQ0018861: id => { st.tact("approval", id); st.act("expiry", "dev.patel", "90"); return "resolve"; },
  TSK0007712: id => { ["greg.foster", "nina.shah", "paul.kim"].forEach(u => st.act("disable", u)); st.tact("escalate", id, "Account owner"); return "resolve"; },
  INC0041231: id => { st.act("disable", "brian.walsh"); st.act("revoke", "brian.walsh"); setGroups("brian.walsh", []); st.tact("escalate", id, "Security team"); return "resolve"; },
  REQ0018866: () => "reject",
  REQ0018870: () => { st.act("enable", "sofia.ramirez"); st.act("pwreset", "sofia.ramirez"); st.act("job", "sofia.ramirez", "HR|HR Generalist"); setGroups("sofia.ramirez", role("HR|HR Generalist")); return "resolve"; },
  REQ0018873: () => "reject",
  REQ0018876: () => { st.act("rmgrp", "jordan.lee", "APP-Finance-Reports"); return "resolve"; },
  REQ0018879: () => { st.act("disable", "rachel.adams"); return "resolve"; },
  REQ0018881: () => { st.act("enable", "ethan.moore"); setGroups("ethan.moore", role("Operations|Dispatcher")); return "resolve"; },
  REQ0018884: () => { const want = Object.values(S.users).filter(u => u.enabled && u.groups.includes("APP-SAP-AP-Entry") && u.groups.includes("APP-SAP-AP-Approve")).map(u => u.id); return ["resolve", want.join(", ") || "none"]; },
  INC0041240: id => { ["revoke", "pwreset", "mfareset"].forEach(a => st.act(a, "sam.okafor")); st.tact("escalate", id, "Security team"); return "resolve"; },
  REQ0018910: () => "reject",
  REQ0018912: () => { st.act("enable", "rachel.adams"); setGroups("rachel.adams", role("Sales|Account Executive")); return "resolve"; },
  INC0041302: id => { const tg = TK[id].users[0]; ["disable", "revoke", "mfareset"].forEach(a => st.act(a, tg)); st.tact("escalate", id, "Security team"); return "resolve"; },
  INC0041305: id => { st.act("enable", "svc-backup"); st.tact("escalate", id, "Account owner"); return "resolve"; },
  INC0041308: id => { st.act("disable", "robert.hayes"); st.act("revoke", "robert.hayes"); setGroups("robert.hayes", []); st.tact("escalate", id, "Security team"); return "resolve"; },
  INC0041311: id => { st.act("disable", "brian.walsh"); st.act("revoke", "brian.walsh"); setGroups("brian.walsh", []); st.tact("escalate", id, "Security team"); return "resolve"; },
  INC0041314: id => { st.act("rmgrp", "lisa.morales", "APP-SAP-AP-Approve"); st.tact("escalate", id, "Security team"); return "resolve"; },
  REQ0018915: () => { setGroups("ethan.moore", role("Operations|Dispatcher")); st.act("rmgrp", "bob.turner", "APP-SAP-AP-Entry"); st.act("rmgrp", "bob.turner", "APP-Finance-Reports"); return "resolve"; },
  INC0041318: id => { st.act("rmgrp", "tyler.brooks", "ROLE-Global-Admin"); st.act("revoke", "tyler.brooks"); st.tact("escalate", id, "Security team"); return "resolve"; },
  INC0041320: id => { ["revoke", "mfareset", "pwreset"].forEach(a => st.act(a, "patricia.reed")); st.tact("escalate", id, "Security team"); return "resolve"; },
  INC0041323: id => { st.tact("approval", id); st.act("enable", "dev.patel"); st.act("expiry", "dev.patel", "90"); return "resolve"; },
  INC0041326: id => { ["revoke", "pwreset", "mfareset"].forEach(a => st.act(a, "sam.okafor")); st.tact("escalate", id, "Security team"); return "resolve"; },
  INC0041329: id => { st.act("revoke", "james.carter"); st.act("pwreset", "james.carter"); st.tact("escalate", id, "Security team"); return "resolve"; },
  REQ0018918: () => { st.act("rmgrp", "jordan.lee", "APP-Finance-Reports"); return "resolve"; },
  REQ0018921: () => { setGroups("tanya.wright", role("Operations|Dispatcher")); return "resolve"; },
};
