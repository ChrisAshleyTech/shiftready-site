// Engine behaviour: doing what each ticket's exact-steps hint says earns full raw marks, a clean
// Monday fires no consequences, a careless Monday fires all 13 and each is fixable, and the hint
// penalties / Solo-Assisted rules hold.
import { describe, it, expect, beforeEach } from "vitest";
import { S, setState } from "../src/engine/store.js";
import { T, TK } from "../src/engine/tickets.js";
import { startThursday, THU_T } from "../src/engine/thursday.js";
import * as st from "../src/engine/state.js";
import { HINTS, hintSteps } from "../src/engine/hints.js";
import { buildReport, encodeReport, decodeReport } from "../src/engine/report.js";
import { PLAYBOOK } from "./playbook.js";


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
