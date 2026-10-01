// Parity: the original single-file simulator (legacy/sim-original.html) and the engine in
// src/engine are driven with identical seeded random action sequences; full state is compared
// after every action, at the handoff to the follow-ups, in the totals and in GRC grading. The
// original had two fixed shifts, so the live queue is switched off here (setLiveQueue(false)) and
// the follow-ups are released in one go, the way the original started its second shift.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { S, setState } from "../src/engine/store.js";
import { ROLES, ALL_GROUPS } from "../src/engine/company.js";
import { T, TK } from "../src/engine/tickets.js";
import { releaseAll, setLiveQueue, FOLLOW } from "../src/engine/followups.js";
import { G, gGrade, gQs } from "../src/engine/grc.js";
import * as st from "../src/engine/state.js";

let old;
beforeAll(() => {
  document.body.innerHTML = `<div id="fx"></div><div id="app"></div><div id="bar"></div><div id="toast"></div>`;
  window.scrollTo = () => {};
  // The original re-renders its whole UI after every action; parsing that HTML dominates the
  // runtime and has no effect on state, so its render targets discard markup.
  for (const id of ["app", "bar"]) Object.defineProperty(document.getElementById(id), "innerHTML", { set(){}, get(){ return ""; } });
  const src = readFileSync(resolve(process.cwd(), "legacy/sim-original.html"), "utf8");
  let js = src.slice(src.indexOf("<script>") + 8, src.lastIndexOf("</script>")).replace(/\r\n/g, "\n");
  const tail = "render();\n})();";
  const i = js.lastIndexOf(tail);
  if (i < 0) throw new Error("Could not find the simulator's entry point");
  js = js.slice(0, i) + `window.__old={act,tact,closeTicket,startThursday,gGrade,gQs,totals,T,
    curTickets:()=>curTickets(), getS:()=>S, reset:()=>{S=fresh();ui=freshUI();}};})();`;
  localStorage.clear();
  new Function(js)();
  old = window.__old;
  setLiveQueue(false);
});
afterAll(() => setLiveQueue(true));

function rng(seed){ return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const ANSWERS = ["", "none", "derek.chan", "derek.chan, lisa.morales", "Derek Chan", "jordan.lee, derek.chan"];
const EXPIRIES = ["0", "2", "30", "90", "91", "120", "abc", ""];
const ESC = ["Security team", "Account owner", "Requester's manager"];
const ACTS = ["enable", "disable", "unlock", "pwreset", "mfareset", "revoke", "addgrp", "rmgrp", "job", "expiry"];

function scenario(seed, opsPerShift){
  const r = rng(seed), pick = a => a[Math.floor(r() * a.length)];
  old.reset(); setState(st.fresh());
  const named = Object.keys(S.users).slice(0, 34).concat(Object.keys(S.users).slice(-5));
  // After the handoff the original reset its clock for a new day and the live queue doesn't; the
  // queue also records when tickets arrived. Neither changes grading.
  let handedOff = false;
  const norm = s => { s = JSON.parse(JSON.stringify(s)); delete s.shift; delete s.q;
    Object.values(s.tickets).forEach(t => { delete t.opened; if (t.approval) t.approval = 1; }); // approval wording was rewritten too
    if (s.report) s.report = s.report.map(r => r.bad); // the wording was rewritten; outcomes must match
    if (handedOff) { delete s.clock; s.log.forEach(e => { delete e.t; }); }
    return JSON.stringify(Object.fromEntries(Object.entries(s).sort(([a], [b]) => a < b ? -1 : 1))); };
  const compare = where => {
    const a = norm(old.getS()), b = norm(S);
    if (a !== b) { let k = 0; while (a[k] === b[k]) k++; throw new Error(`seed ${seed}, ${where}: state differs near …${a.slice(Math.max(0, k - 80), k + 80)}…`); }
  };
  const fx = document.getElementById("fx");
  const close = (tid, kind, answer, note) => {
    fx.innerHTML = `<textarea id="note-${tid}"></textarea>` + (TK[tid].question ? `<input id="ans-${tid}">` : "");
    fx.querySelector("textarea").value = note;
    if (TK[tid].question) fx.querySelector("input").value = answer;
    old.closeTicket(tid, kind);
    st.closeTicket(tid, kind, { note, answer: TK[tid].question ? answer : undefined });
    fx.innerHTML = "";
  };
  const run = (list, n) => {
    const ids = list.map(t => t.id);
    for (let i = 0; i < n; i++) {
      const x = r(), tid = pick(ids), ts = S.tickets[tid];
      if (x < 0.12) { old.tact("start", tid); st.tact("start", tid); }
      else if (x < 0.2) { const a = pick(["verify", "approval", "resume"]); old.tact(a, tid); st.tact(a, tid); }
      else if (x < 0.26) { const e = pick(ESC); old.tact("escalate", tid, e); st.tact("escalate", tid, e); }
      else if (x < 0.88) {
        const uid = r() < 0.7 && TK[tid].users.length ? pick(TK[tid].users) : pick(named);
        const a = pick(ACTS);
        const arg = a === "addgrp" ? pick(ALL_GROUPS) : a === "rmgrp" ? pick(S.users[uid].groups.concat("GRP-None")) :
          a === "job" ? pick(Object.keys(ROLES)) : a === "expiry" ? pick(EXPIRIES) : undefined;
        old.act(a, uid, arg); st.act(a, uid, arg);
      } else if (!ts.checks) close(tid, pick(["resolve", "reject"]), pick(ANSWERS), pick(["", "Done per policy"]));
      compare("op " + i);
    }
    ids.forEach(tid => { if (!S.tickets[tid].checks) close(tid, pick(["resolve", "reject"]), pick(ANSWERS.slice(1)), "closing"); });
    compare("closing all");
  };
  run(T, opsPerShift);
  const ot = old.totals(T), nt = st.totals(T);
  expect([nt.raw, nt.mx, nt.done]).toEqual([ot.sc, ot.mx, ot.done]);
  // The original also cleared the active ticket when its second shift started.
  old.startThursday(); releaseAll(); S.active = null; handedOff = true;
  compare("handoff");
  expect(FOLLOW.map(t => t.id)).toEqual(old.curTickets().map(t => t.id));
  run(FOLLOW, Math.round(opsPerShift * 0.6));
  const oT = old.totals(old.curTickets()), nT = st.totals(FOLLOW);
  expect([nT.raw, nT.mx]).toEqual([oT.sc, oT.mx]);
  G.forEach(g => {
    const go = {}, gn = {};
    const qs = g.kind === "table" ? g.rows : gQs(g, gn); if (g.dynamic) old.gQs(g, go);
    const a = {}; qs.forEach((q, i) => { a[i] = g.kind === "table" ? Math.floor(r() * g.opts.length) : q.num ? Math.floor(r() * 4) : q.multi ? q.opts.map((_, j) => j).filter(() => r() < 0.5) : Math.floor(r() * q.opts.length); });
    expect(JSON.stringify(gGrade(g, gn, a)), `GRC ${g.id}`).toBe(JSON.stringify(old.gGrade(g, go, a)));
  });
  return FOLLOW.length - 2;
}

describe("engine parity with the original simulator", () => {
  it("matches across 40 seeded scenarios", { timeout: 600000 }, () => {
    let fired = 0;
    for (let i = 0; i < 40; i++) fired += scenario(1000 + i * 7919, 260);
    expect(fired).toBeGreaterThan(200); // consequences were actually exercised
  });
});
