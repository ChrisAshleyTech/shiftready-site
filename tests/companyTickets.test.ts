// Every company with tickets: the playbook earns full marks, a clean Monday fires nothing, a
// careless Monday fires all 13 consequences, Jordan Reyes' week shows exactly the planted
// mistakes, the week audit and GRC desk answer keys score 100%, and every ticket maps to topics.
import { describe, it, expect, beforeEach } from "vitest";
import { S, setState, U } from "../src/engine/store.js";
import { setCompanyData } from "../src/engine/company.js";
import { setPolicyData, POLICY } from "../src/engine/policy.js";
import { T, TK } from "../src/engine/tickets.js";
import { startThursday, THU_T, CONSEQ } from "../src/engine/thursday.js";
import { HINTS, hintSteps } from "../src/engine/hints.js";
import { G, gGrade, gQs } from "../src/engine/grc.js";
import * as st from "../src/engine/state.js";
import { SET, setTicketData } from "../src/engine/ticketSet.js";
import { playJordanWeek, mistakes } from "../src/app/audit/jordan";
import { buildWeekAudit, gradeTask, type Task, type Answers } from "../src/app/audit/weekAudit";
import { TOPICS, ticketTopics } from "../src/app/frameworks";
import { COMPANIES } from "../src/packs";
import { set as pcSet } from "../src/packs/pacific-crest/set.js";

const loaded = await Promise.all(COMPANIES.filter(c => c.id !== "pacific-crest" && c.hasTickets).map(async c => ({ c, ...(await c.load()) })));
const perfect = (t: Task): Answers => Object.fromEntries((t.kind === "table" ? t.rows! : t.qs!).map((q: any, i) => [i, q.correct]));

function use(x: (typeof loaded)[number]) {
  setCompanyData(x.company); setPolicyData(x.policy); setTicketData(x.tickets!);
  st.setCompanyState("test-" + x.c.id, true); localStorage.clear(); setState(st.fresh());
}
function work(id: string) {
  st.tact("start", id);
  let r = SET.playbook[id](id); if (!Array.isArray(r)) r = [r, ""];
  expect(st.closeTicket(id, r[0], { note: "per runbook", answer: TK[id].question ? r[1] : undefined })).toBeNull();
  const ts = S.tickets[id];
  expect(ts.score, `${id}: ${ts.checks.filter((c: any) => !c.pass).map((c: any) => c.label + " " + c.detail).join("; ")}`).toBe(ts.max);
}

describe("ticket ids", () => {
  it("are unique across companies", () => {
    const all = [pcSet, ...loaded.map(x => x.tickets!)].flatMap(s => Object.keys(s.playbook));
    expect(new Set(all).size).toBe(all.length);
  });
});

for (const x of loaded) describe(x.c.name, () => {
  beforeEach(() => use(x));

  it("has 20 Monday tickets, complete hints and a playbook for all 35", () => {
    expect(T).toHaveLength(20);
    expect(Object.keys(SET.playbook)).toHaveLength(35);
    for (const id of Object.keys(SET.playbook)) {
      const h = HINTS[id];
      expect(h && h.skill && h.nudge && h.clause, id).toBeTruthy();
      for (const k of h.clause.keys) expect(POLICY[k], `${id}: ${k}`).toBeTruthy();
    }
    for (const t of T) for (const u of t.users) expect(U(u), `${t.id}: ${u}`).toBeTruthy();
  });

  it("a perfect Monday fires no consequences, and a perfect Thursday scores 100%", () => {
    T.forEach((t: any) => { expect(hintSteps(t.id).length).toBeGreaterThan(0); work(t.id); });
    startThursday();
    expect(S.report.filter((r: any) => r.bad).map((r: any) => r.text)).toEqual([]);
    expect(THU_T).toHaveLength(2);
    THU_T.forEach((t: any) => work(t.id));
    expect(st.totals(THU_T).pct).toBe(100);
  });

  it("a careless Monday fires all 13 consequences, and each is fixable by its playbook", () => {
    const { mon: M } = (SET as any).story;
    st.act("addgrp", M.sodReq.uid, M.sodReq.group); st.act("addgrp", M.priv.uid, M.priv.group);
    st.act("pwreset", M.exec.uid); st.act("pwreset", M.callerPw.uid); st.act("disable", M.sweep.svc);
    M.copy.extras.forEach((g: string) => st.act("addgrp", M.copy.uid, g));
    startThursday();
    expect(S.thu.map((f: any) => f.key)).toEqual(CONSEQ.map((c: any) => c.key));
    expect(THU_T).toHaveLength(15);
    THU_T.forEach((t: any) => { expect(hintSteps(t.id).length).toBeGreaterThan(0); expect(ticketTopics(t.id).length, t.id).toBeGreaterThan(0); work(t.id); });
  });

  it("every ticket maps to known framework topics", () => {
    for (const [id, ks] of Object.entries(SET.topics)) for (const k of ks) expect(TOPICS[k], `${id}: ${k}`).toBeTruthy();
  });

  it("Jordan's week has exactly the planted mistakes, and they come back on Thursday", () => {
    playJordanWeek();
    const all = [...T, ...THU_T];
    const imperfect = all.filter((t: any) => S.tickets[t.id].score < S.tickets[t.id].max).map((t: any) => t.id).sort();
    expect(imperfect).toEqual(Object.keys(mistakes()).filter(k => k !== "unticketed").sort());
    expect(S.thu.map((f: any) => f.key).sort()).toEqual(["callerPw", "leaver", "mover"]);
    expect(S.log.filter((e: any) => !e.ticket)).toHaveLength(1);
  });

  it("the audit of Jordan's week finds the planted exceptions, and its answer key scores 100%", () => {
    playJordanWeek();
    const wa = buildWeekAudit("jordan"), w3 = wa.tasks.find(t => t.id === "W3")!;
    const exceptions = w3.rows!.filter(r => r.correct !== 0).map(r => r.name.split(" · ")[0]).sort();
    expect(exceptions).toEqual(Object.keys(mistakes()).filter(k => k !== "unticketed").sort());
    expect(wa.tasks.find(t => t.id === "W4")!.qs![0].correct).toBe(1);
    const w5 = wa.tasks.find(t => t.id === "W5")!;
    expect(w5.ctrl).toBe("APD-03");
    expect(w5.qs![3].opts![1]).toContain(SET.story.conseq.callerPw.id);
    wa.tasks.forEach(t => expect(gradeTask(t, perfect(t)).every(c => c.pass), t.id).toBe(true));
  });

  it("the GRC desk has ten tasks, and each answer key scores 100%", () => {
    expect(G).toHaveLength(10);
    T.forEach((t: any) => work(t.id));
    for (const g of G) {
      const gs: any = {};
      const qs = g.kind === "table" ? g.rows : gQs(g, gs);
      const a = Object.fromEntries(qs.map((q: any, i: number) => [i, q.correct]));
      const checks = gGrade(g, gs, a);
      expect(checks.every((c: any) => c.pass), g.id).toBe(true);
    }
  });
});
