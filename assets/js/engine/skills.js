// Skill scores and shift summaries, derived from graded tickets (after hint penalties).
import { S } from "./store.js";
import { T, TK } from "./tickets.js";
import { THU_T } from "./thursday.js";
import { totals, finalScore, isAssisted, hintsUsed, round1 } from "./state.js";
import { SKILLS, HINTS } from "./hints.js";
import { gTotals } from "./grc.js";

export const allTickets = () => T.concat(S.shift === "thu" ? THU_T : []);

export function skillScores(){
  return SKILLS.map(sk => {
    let sc = 0, mx = 0, n = 0;
    allTickets().forEach(t => {
      const ts = S.tickets[t.id];
      if (ts && ts.checks && HINTS[t.id] && HINTS[t.id].skill === sk.key) { sc += finalScore(ts); mx += ts.max; n++; }
    });
    return { ...sk, sc: round1(sc), mx, n, pct: mx ? Math.round(sc / mx * 100) : null };
  });
}

// Where the learner is in the week: "new" | "mon" | "mon-done" | "thu" | "thu-done".
export function stage(){
  const mon = totals(T);
  if (S.shift === "thu") return totals(THU_T).done === THU_T.length ? "thu-done" : "thu";
  if (mon.done === T.length) return "mon-done";
  return mon.done === 0 && !S.log.length ? "new" : "mon";
}

export function summary(){
  const mon = totals(T), thu = S.shift === "thu" ? totals(THU_T) : null, grc = gTotals();
  const closed = allTickets().map(t => S.tickets[t.id]).filter(ts => ts && ts.checks);
  const hints = closed.reduce((a, ts) => a + hintsUsed(ts), 0);
  const week = [mon, thu].filter(Boolean).reduce((a, x) => ({ sc: a.sc + x.sc, mx: a.mx + x.mx }), { sc: 0, mx: 0 });
  return {
    mon, thu, grc, hints,
    solo: closed.filter(ts => !isAssisted(ts)).length, assisted: closed.filter(isAssisted).length,
    caused: S.report ? S.report.filter(r => r.bad).length : null,
    prevented: S.report ? S.report.filter(r => !r.bad).length : null,
    weekPct: week.mx ? Math.round(round1(week.sc) / week.mx * 100) : null,
  };
}

// Next ticket to work on: the active one, else the highest-priority open ticket.
export function nextTicket(list){
  if (S.active && S.tickets[S.active] && !S.tickets[S.active].checks && list.some(t => t.id === S.active)) return TK[S.active];
  return list.filter(t => !S.tickets[t.id].checks).sort((a, b) => a.pri - b.pri)[0] || null;
}
