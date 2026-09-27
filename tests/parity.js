// Parity test: the original single-file simulator (legacy/sim-original.html) and the new
// engine modules are driven with identical seeded random action sequences; full state
// is compared after every action, at the Thursday handoff and in the final grades.
import { S, setState } from "../assets/js/engine/store.js";
import { ROLES, ALL_GROUPS } from "../assets/js/engine/company.js";
import { T, TK } from "../assets/js/engine/tickets.js";
import { startThursday, curTickets } from "../assets/js/engine/thursday.js";
import { G, gGrade, gQs } from "../assets/js/engine/grc.js";
import * as st from "../assets/js/engine/state.js";

const out = document.getElementById("out");
const log = m => { out.textContent += m + "\n"; };

async function loadOld(){
  const src = await (await fetch(new URL("../legacy/sim-original.html", import.meta.url))).text();
  let js = src.slice(src.indexOf("<script>") + 8, src.lastIndexOf("</script>"));
  const tail = "render();\n})();";
  const i = js.lastIndexOf(tail);
  if (i < 0) throw new Error("Could not find the simulator's entry point");
  js = js.slice(0, i) + `window.__old={act,tact,closeTicket,startThursday,gGrade,gQs,totals,T,
    curTickets:()=>curTickets(), getS:()=>S, reset:()=>{S=fresh();ui=freshUI();}};})();`;
  try { localStorage.clear(); } catch (e) {}
  new Function(js)();
  return window.__old;
}

function rng(seed){ return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const ANSWERS = ["", "none", "derek.chan", "derek.chan, lisa.morales", "Derek Chan", "jordan.lee, derek.chan"];
const EXPIRIES = ["0", "2", "30", "90", "91", "120", "abc", ""];
const ESC = ["Security team", "Account owner", "Requester's manager"];
const ACTS = ["enable", "disable", "unlock", "pwreset", "mfareset", "revoke", "addgrp", "rmgrp", "job", "expiry"];

function scenario(old, seed, opsPerShift){
  const r = rng(seed), pick = a => a[Math.floor(r() * a.length)];
  old.reset(); setState(st.fresh());
  const named = Object.keys(S.users).slice(0, 34).concat(Object.keys(S.users).slice(-5));
  let step = 0;
  const compare = where => {
    const a = JSON.stringify(old.getS()), b = JSON.stringify(S);
    if (a !== b) {
      let k = 0; while (a[k] === b[k]) k++;
      throw new Error(`seed ${seed}, ${where} (step ${step}): state differs near …${a.slice(Math.max(0, k - 80), k + 80)}… vs …${b.slice(Math.max(0, k - 80), k + 80)}…`);
    }
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
    for (let i = 0; i < n; i++, step++) {
      const x = r(), tid = pick(ids), ts = S.tickets[tid];
      if (x < 0.12) { old.tact("start", tid); st.tact("start", tid); }
      else if (x < 0.2) { const a = pick(["verify", "approval", "resume"]); old.tact(a, tid); st.tact(a, tid); }
      else if (x < 0.26) { const e = pick(ESC); old.tact("escalate", tid, e); st.tact("escalate", tid, e); }
      else if (x < 0.88) {
        const uid = r() < 0.7 && TK[tid].users.length ? pick(TK[tid].users) : pick(named);
        const a = pick(ACTS);
        const arg = a === "addgrp" ? pick(ALL_GROUPS) : a === "rmgrp" ? (pick(S.users[uid].groups.concat("GRP-None"))) :
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
  if (ot.sc !== nt.raw || ot.mx !== nt.mx || ot.done !== nt.done) throw new Error(`seed ${seed}: Monday totals differ ${JSON.stringify(ot)} vs ${JSON.stringify(nt)}`);
  old.startThursday(); startThursday();
  compare("Thursday start");
  const oldThu = old.curTickets().map(t => t.id).join(), newThu = curTickets().map(t => t.id).join();
  if (oldThu !== newThu) throw new Error(`seed ${seed}: Thursday queue differs: ${oldThu} vs ${newThu}`);
  run(curTickets(), Math.round(opsPerShift * 0.6));
  const oT = old.totals(old.curTickets()), nT = st.totals(curTickets());
  if (oT.sc !== nT.raw || oT.mx !== nT.mx) throw new Error(`seed ${seed}: Thursday totals differ`);
  // GRC grading on random answers (task G4 audits the log produced above)
  G.forEach(g => {
    const go = {}, gn = {};
    const qs = g.kind === "table" ? g.rows : gQs(g, gn); if (g.dynamic) old.gQs(g, go);
    const a = {}; qs.forEach((q, i) => { a[i] = g.kind === "table" ? Math.floor(r() * g.opts.length) : q.num ? Math.floor(r() * 4) : q.multi ? q.opts.map((_, j) => j).filter(() => r() < 0.5) : Math.floor(r() * q.opts.length); });
    if (JSON.stringify(old.gGrade(g, go, a)) !== JSON.stringify(gGrade(g, gn, a))) throw new Error(`seed ${seed}: GRC ${g.id} grading differs`);
  });
  return { thu: newThu.split(",").length, mon: nt, thuTot: nT };
}

try {
  const old = await loadOld();
  const seeds = Array.from({ length: +(new URLSearchParams(location.search).get("seeds") || 40) }, (_, i) => 1000 + i * 7919);
  let fired = 0;
  for (const s of seeds) { const res = scenario(old, s, 260); fired += res.thu - 2; }
  log(`PASS: ${seeds.length} seeded scenarios identical (every action, Thursday handoff, totals, GRC). Consequence tickets fired: ${fired}.`);
  document.body.dataset.result = "pass";
} catch (e) {
  log("FAIL: " + e.message + "\n" + (e.stack || ""));
  document.body.dataset.result = "fail";
}
