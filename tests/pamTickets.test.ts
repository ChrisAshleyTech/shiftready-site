// The PAM path at every company: the playbook earns full marks, clean work causes no follow-ups,
// careless work causes all nine, the directory moves admin roles into the vault, and every ticket
// has hints, known framework topics and a runbook clause that exists.
import { describe, it, expect, beforeEach } from "vitest";
import { S, setState, U } from "../src/engine/store.js";
import { setCompanyData, PAM, ROLES } from "../src/engine/company.js";
import { setPolicyData, POLICY } from "../src/engine/policy.js";
import { T, TK } from "../src/engine/tickets.js";
import { releaseAll, FOLLOW, CONSEQ, STANDING, queueDone } from "../src/engine/followups.js";
import { HINTS, hintSteps, SKILLS, PAM_SKILLS } from "../src/engine/hints.js";
import * as st from "../src/engine/state.js";
import { SET, setTicketData } from "../src/engine/ticketSet.js";
import { TOPICS } from "../src/app/frameworks";
import { COMPANIES } from "../src/packs";

const loaded = await Promise.all(COMPANIES.map(async c => ({ c, ...(await c.loadPam()), iam: await c.load() })));

function use(x: (typeof loaded)[number]) {
  setCompanyData(x.company); setPolicyData(x.policy); setTicketData(x.tickets);
  st.setCompanyState("test-pam-" + x.c.id, true); localStorage.clear(); setState(st.fresh());
}
function work(id: string) {
  st.tact("start", id);
  let r = SET.playbook[id](id); if (!Array.isArray(r)) r = [r, ""];
  expect(st.closeTicket(id, r[0], { note: "per runbook", answer: TK[id].question ? r[1] : undefined })).toBeNull();
  const ts = S.tickets[id];
  expect(ts.score, `${id}: ${ts.checks.filter((c: any) => !c.pass).map((c: any) => c.label + " " + c.detail).join("; ")}`).toBe(ts.max);
}

describe("PAM ticket ids", () => {
  it("are unique across companies and paths", () => {
    const all = loaded.flatMap(x => [...Object.keys(x.tickets.playbook), ...Object.keys(x.iam.tickets!.playbook)]);
    expect(new Set(all).size).toBe(all.length);
  });
});

for (const x of loaded) describe(`${x.c.name}: PAM path`, () => {
  beforeEach(() => use(x));

  it("moves admin roles into the vault: off the matrix, held only by break-glass and the planted cases", () => {
    expect(PAM!.vaulted.length).toBeGreaterThan(1);
    for (const gs of Object.values(ROLES) as string[][]) expect(gs.filter(g => PAM!.vaulted.includes(g))).toEqual([]);
    expect(PAM!.breakGlass.length).toBeGreaterThan(0);
    for (const b of PAM!.breakGlass) expect(U(b).enabled).toBe(false);
    for (const [rk, gs] of Object.entries(PAM!.eligible)) { expect(ROLES[rk], rk).toBeTruthy(); for (const g of gs) expect(PAM!.vaulted).toContain(g); }
  });

  it("has 12 assigned tickets, PAM skills, complete hints and a playbook for all 23", () => {
    expect(T).toHaveLength(12);
    expect(STANDING).toHaveLength(2);
    expect(CONSEQ).toHaveLength(9);
    expect(SKILLS).toBe(PAM_SKILLS);
    expect(Object.keys(SET.playbook)).toHaveLength(23);
    for (const id of Object.keys(SET.playbook)) {
      const h = HINTS[id];
      expect(h && h.skill && h.nudge && h.clause, id).toBeTruthy();
      expect(PAM_SKILLS.some((s: any) => s.key === h.skill), id).toBe(true);
      for (const k of h.clause.keys) expect(POLICY[k], `${id}: ${k}`).toBeTruthy();
      expect(SET.topics[id]?.length, id).toBeGreaterThan(0);
      for (const k of SET.topics[id]) expect(TOPICS[k], `${id}: ${k}`).toBeTruthy();
    }
    for (const t of [...T, ...STANDING]) for (const u of t.users) expect(U(u), `${t.id}: ${u}`).toBeTruthy();
  });

  it("clean work causes no follow-ups or replies, and the whole queue scores 100%", () => {
    T.forEach((t: any) => { expect(hintSteps(t.id).length).toBeGreaterThan(0); work(t.id); });
    for (let i = 0; i < 10 && !queueDone(); i++) FOLLOW.filter((t: any) => !S.tickets[t.id].checks).forEach((t: any) => work(t.id));
    releaseAll();
    expect(S.report.filter((r: any) => r.bad).map((r: any) => r.text)).toEqual([]);
    expect(FOLLOW.map((t: any) => t.id).sort()).toEqual(STANDING.map((t: any) => t.id).sort());
    expect(queueDone()).toBe(true);
    expect(Object.values(S.tickets).filter((ts: any) => ts.reopens)).toEqual([]);
  });

  it("careless work causes all nine follow-ups, and fixing them by the runbook scores 100%", () => {
    const bad = (id: string) => {
      const t = TK[id], s = SET.story;
      st.tact("start", id);
      // The usual mistakes: grant admin rights permanently, disable instead of rotating, and stop halfway.
      if (id === s.mon.jit.id) st.act("addgrp", s.mon.jit.uid, s.mon.jit.group);
      if (id === s.mon.notEligible.id) st.act("addgrp", s.mon.notEligible.uid, s.mon.notEligible.group);
      if (id === s.mon.noChange.id) st.act("jit", s.mon.noChange.uid, `${s.mon.noChange.group}|48`);
      if (id === s.mon.rotate.id) st.act("disable", s.mon.rotate.svc);
      if (id === s.mon.adminLeaver.id) st.act("disable", s.mon.adminLeaver.uid);
      if (id === s.mon.compromised.id) st.act("revoke", s.mon.compromised.uid);
      if (id === s.mon.breakGlass.id) st.act("enable", s.mon.breakGlass.bg);
      if (id === s.mon.vendor.id) { st.act("enable", s.mon.vendor.uid); st.act("addgrp", s.mon.vendor.uid, s.mon.vendor.group); }
      if (id === s.thu.bgClose.id) st.act("disable", s.mon.breakGlass.bg);
      if (id === s.thu.vendorEnd.id) st.act("revoke", s.mon.vendor.uid);
      st.closeTicket(id, t.close, { answer: t.question ? "none" : undefined });
    };
    T.forEach((t: any) => bad(t.id));
    for (let i = 0; i < 5; i++) FOLLOW.filter((t: any) => !S.tickets[t.id].checks && !t.key).forEach((t: any) => bad(t.id));
    releaseAll();
    expect(S.report.filter((r: any) => r.bad).map((r: any) => r.key).sort()).toEqual(CONSEQ.map((c: any) => c.key).sort());
    FOLLOW.filter((t: any) => t.key).forEach((t: any) => work(t.id));
  });
});
