// Engine behaviour: doing what each ticket's exact-steps hint says earns full raw marks, a clean
// Monday fires no consequences, a careless Monday fires all 13 and each is fixable, and the hint
// penalties / Solo-Assisted rules hold.
import { describe, it, expect, beforeEach } from "vitest";
import { S, setState, U } from "../src/engine/store.js";
import { ROLES } from "../src/engine/company.js";
import { T, TK } from "../src/engine/tickets.js";
import { startThursday, THU_T } from "../src/engine/thursday.js";
import * as st from "../src/engine/state.js";
import { HINTS, hintSteps } from "../src/engine/hints.js";
import { buildReport, encodeReport, decodeReport } from "../src/engine/report.js";

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

function work(id){
  st.tact("start", id);
  expect(hintSteps(id).length, `${id} steps`).toBeGreaterThan(0);
  let r = PLAYBOOK[id](id); if (!Array.isArray(r)) r = [r];
  expect(st.closeTicket(id, r[0], { note: "per runbook", answer: TK[id].question ? r[1] : undefined })).toBeNull();
  const ts = S.tickets[id];
  expect(ts.score, `${id}: ${ts.checks.filter(c => !c.pass).map(c => c.label).join("; ")}`).toBe(ts.max);
}

beforeEach(() => { localStorage.clear(); setState(st.fresh()); });

describe("hints and playbooks", () => {
  it("every ticket has complete hint data and a playbook", () => {
    for (const id of Object.keys(PLAYBOOK)) expect(HINTS[id] && HINTS[id].skill && HINTS[id].nudge && HINTS[id].clause, id).toBeTruthy();
    expect(Object.keys(PLAYBOOK)).toHaveLength(35);
  });
  it("a perfect Monday fires no consequences, and a perfect Thursday scores 100%", () => {
    T.forEach(t => work(t.id));
    startThursday();
    expect(THU_T).toHaveLength(2);
    expect(S.report.every(r => !r.bad)).toBe(true);
    THU_T.forEach(t => work(t.id));
    expect(st.totals(THU_T).pct).toBe(100);
  });
  it("a careless Monday fires all 13 consequences, and each is fixable by its hint", () => {
    st.act("addgrp", "lisa.morales", "APP-SAP-AP-Approve"); st.act("addgrp", "tyler.brooks", "ROLE-Global-Admin");
    st.act("pwreset", "patricia.reed"); st.act("pwreset", "james.carter"); st.act("disable", "svc-backup");
    st.act("enable", "ethan.moore"); st.act("addgrp", "ethan.moore", "APP-Finance-Reports");
    T.forEach(t => { st.tact("start", t.id); st.closeTicket(t.id, "resolve", { answer: TK[t.id].question ? "none" : undefined }); });
    startThursday();
    expect(THU_T).toHaveLength(15);
    THU_T.forEach(t => work(t.id));
  });
});

describe("hint penalties and Solo/Assisted", () => {
  it("charges the highest tier opened, not the sum", () => {
    const id = "INC0041207";
    st.revealHint(id); expect(st.hintCost(S.tickets[id])).toBe(0.10);
    st.revealHint(id); expect(st.hintCost(S.tickets[id])).toBe(0.25);
    expect(st.isAssisted(S.tickets[id])).toBe(false);
    st.revealHint(id); expect(st.hintCost(S.tickets[id])).toBe(0.50);
    expect(st.isAssisted(S.tickets[id])).toBe(true);
    work(id);
    expect(st.finalScore(S.tickets[id])).toBe(S.tickets[id].max / 2);
    expect(st.revealHint(id)).toBe(false); // closed: free to read, score unchanged
    const id2 = "INC0041209"; st.revealHint(id2); work(id2);
    expect(st.finalScore(S.tickets[id2])).toBe(st.round1(S.tickets[id2].max * 0.9));
    expect(st.totals(T)).toMatchObject({ assisted: 1, solo: 1, done: 2 });
  });
});

describe("readiness report", () => {
  it("round-trips through the share link", () => {
    work("INC0041207");
    const d = buildReport("Zoë Nakamura-Ortiz");
    const back = decodeReport(encodeReport(d));
    expect(back).toEqual(d);
    expect(back.tickets).toHaveLength(20);
  });
});
