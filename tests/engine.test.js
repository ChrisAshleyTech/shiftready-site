// Engine behaviour: doing what each ticket's exact-steps hint says earns full raw marks, clean work
// causes no follow-ups, careless work causes all 13 and each is fixable, the live queue (replies
// that reopen tickets, follow-ups that land mid-shift) behaves, and the hint penalties /
// Solo-Assisted rules hold.
import { describe, it, expect, beforeEach } from "vitest";
import { S, setState } from "../src/engine/store.js";
import { T, TK } from "../src/engine/tickets.js";
import { releaseAll, FOLLOW, CONSEQ, queueTickets, queueDone, DELAY, migrate, buildFollow } from "../src/engine/followups.js";
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
  it("clean work causes no follow-ups, the standing tickets arrive mid-shift, and the queue clears at 100%", () => {
    T.forEach(t => work(t.id));
    expect(FOLLOW).toHaveLength(2);
    expect(S.report.every(r => !r.bad)).toBe(true);
    expect(queueDone()).toBe(false);
    FOLLOW.forEach(t => work(t.id));
    expect(queueDone()).toBe(true);
    expect(st.totals().pct).toBe(100);
    expect(queueTickets().every(t => !S.tickets[t.id].reopens)).toBe(true);
  });
  it("careless work causes all 13 follow-ups, and each is fixable by its hint", () => {
    st.act("addgrp", "lisa.morales", "APP-SAP-AP-Approve"); st.act("addgrp", "tyler.brooks", "ROLE-Global-Admin");
    st.act("pwreset", "patricia.reed"); st.act("pwreset", "james.carter"); st.act("disable", "svc-backup");
    st.act("enable", "ethan.moore"); st.act("addgrp", "ethan.moore", "APP-Finance-Reports");
    T.forEach(t => { st.tact("start", t.id); st.closeTicket(t.id, "resolve", { answer: TK[t.id].question ? "none" : undefined }); });
    releaseAll();
    expect(FOLLOW).toHaveLength(15);
    expect(S.report.filter(r => r.bad)).toHaveLength(13);
    FOLLOW.forEach(t => work(t.id));
  });
});

describe("the live queue", () => {
  const close = (id, kind = "resolve") => { st.tact("start", id); return st.closeTicket(id, kind, { answer: TK[id].question ? "none" : undefined }); };
  const others = ["REQ0018855", "REQ0018866", "REQ0018873", "INC0041220"]; // rejects that cause nothing when rejected

  it("a requester replies when the fix didn't work, and the ticket stays open until it's fixed", () => {
    close("INC0041209"); // never unlocked
    const first = S.tickets.INC0041209.score;
    expect(S.tickets.INC0041209.status).toBe("resolved");
    for (let i = 0; i < DELAY.reply; i++) close(others[i], "reject");
    const ts = S.tickets.INC0041209;
    expect(ts.status).toBe("reopened");
    expect(ts.checks).toBeUndefined();
    expect(ts.replies[0]).toMatchObject({ from: "Aisha Brown", text: "It still says my account is locked." });
    close("INC0041209"); // still not unlocked: it comes back again
    close(others[1], "reject");
    expect(S.tickets.INC0041209.status).toBe("reopened");
    expect(S.tickets.INC0041209.reopens).toBe(2);
    st.tact("start", "INC0041209"); st.act("unlock", "aisha.brown"); st.closeTicket("INC0041209", "resolve");
    close(others[2], "reject");
    expect(S.tickets.INC0041209.status).toBe("resolved");
    expect(S.tickets.INC0041209.score).toBe(first); // the first resolution's grade stands
    expect(S.tickets.INC0041209.last.every(c => c.pass || c.label.startsWith("Identity"))).toBe(true);
  });

  it("a follow-up lands a couple of tickets after its source is closed", () => {
    close("REQ0018850"); // leaver: nothing done
    for (let i = 0; i < DELAY.followUp - 1; i++) close(others[i], "reject");
    expect(FOLLOW.map(t => t.id)).not.toContain("INC0041308");
    close(others[DELAY.followUp - 1], "reject");
    expect(FOLLOW.map(t => t.id)).toContain("INC0041308");
    expect(TK.INC0041308.src).toBe("REQ0018850");
    expect(S.tickets.INC0041308).toMatchObject({ status: "new" });
    expect(S.tickets.INC0041308.opened).toMatch(/AM|PM/);
  });

  it("fixing the problem before the follow-up lands prevents it", () => {
    close("REQ0018850");
    st.act("disable", "robert.hayes"); st.act("revoke", "robert.hayes");
    others.slice(0, DELAY.followUp).forEach(id => close(id, "reject"));
    expect(FOLLOW.map(t => t.id)).not.toContain("INC0041308");
    expect(S.report.find(r => r.key === "robert")).toMatchObject({ bad: false });
  });

  it("a requester-facing follow-up reopens the source ticket; a security one is a related incident", () => {
    close("REQ0018852"); // mover: old Sales access kept
    others.slice(0, DELAY.followUp).forEach(id => close(id, "reject"));
    const t = TK.REQ0018921;
    expect(t.reopens).toBe("REQ0018852");
    expect(queueTickets().some(t => t.id === "INC0041308")).toBe(false);
    close("REQ0018850");
    releaseAll();
    expect(TK.INC0041308.reopens).toBeUndefined();
    expect(TK.INC0041308.src).toBe("REQ0018850");
  });

  it("a follow-up that isn't contained comes back from Security", () => {
    close("REQ0018850");
    releaseAll();
    close("INC0041308");
    T.filter(t => !S.tickets[t.id].checks).slice(0, DELAY.reply).forEach(t => close(t.id));
    expect(S.tickets.INC0041308.status).toBe("reopened");
    expect(S.tickets.INC0041308.replies[0].from).toBe("Security team");
  });

  it("the queue never stalls: when nothing is open, what's pending lands at once", () => {
    T.forEach(t => close(t.id));
    expect(S.q.pend.length === 0 || queueTickets().some(t => !S.tickets[t.id].checks)).toBe(true);
  });

  it("a save from the old two-shift format carries over", () => {
    T.forEach(t => work(t.id));
    const old = JSON.parse(JSON.stringify(S));
    delete old.q; old.shift = "thu"; old.thu = []; old.report = CONSEQ.map(c => ({ bad: false, text: c.prevented }));
    FOLLOW.forEach(t => { old.tickets[t.id] = { status: "new", esc: [] }; });
    setState(old); migrate(); buildFollow();
    expect(S.shift).toBeUndefined();
    expect(FOLLOW.map(t => t.id)).toEqual(["REQ0018910", "REQ0018912"]);
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
