// Skill scores and shift summaries, derived from graded tickets (after hint penalties).
import { S } from "./store.js";
import { T, TK } from "./tickets.js";
import { FOLLOW, CONSEQ, queueTickets, queueDone } from "./followups.js";
import { totals, finalScore, isAssisted, hintsUsed, round1 } from "./state.js";
import { SKILLS, HINTS } from "./hints.js";
import { gTotals } from "./grc.js";

export const allTickets = () => queueTickets();

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

// Where the learner is in the shift: "new" | "working" | "done".
export function stage(){
  if (queueDone()) return "done";
  return totals(T).done === 0 && !S.log.length ? "new" : "working";
}

export function summary(){
  const assigned = totals(T), follow = FOLLOW.length ? totals(FOLLOW) : null, shift = totals(queueTickets()), grc = gTotals();
  const closed = allTickets().map(t => S.tickets[t.id]).filter(ts => ts && ts.checks);
  const hints = closed.reduce((a, ts) => a + hintsUsed(ts), 0);
  const report = S.report || [];
  return {
    assigned, follow, shift, grc, hints,
    solo: closed.filter(ts => !isAssisted(ts)).length, assisted: closed.filter(isAssisted).length,
    // Tickets a requester reopened because the fix didn't take, and how many times in all.
    reopened: allTickets().filter(t => S.tickets[t.id] && S.tickets[t.id].reopens).length,
    reopens: allTickets().reduce((a, t) => a + ((S.tickets[t.id] && S.tickets[t.id].reopens) || 0), 0),
    caused: report.filter(r => r.bad).length,
    prevented: report.filter(r => !r.bad).length,
    // Follow-ups not yet checked (their source ticket is open, or they're still on the way).
    pending: CONSEQ.length - report.length,
    shiftPct: shift.pct,
  };
}

// Next ticket to work on: the active one, else the highest-priority open ticket.
export function nextTicket(list = queueTickets()){
  if (S.active && S.tickets[S.active] && !S.tickets[S.active].checks && list.some(t => t.id === S.active)) return TK[S.active];
  return list.filter(t => !S.tickets[t.id].checks).sort((a, b) => a.pri - b.pri)[0] || null;
}
