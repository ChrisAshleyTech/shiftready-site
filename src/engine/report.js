// Readiness report data. The shareable link carries this object, base64url-encoded, in the
// URL fragment, so no server is needed (and fragments are never sent to one).
import { S } from "./store.js";
import { T, TK } from "./tickets.js";
import { FOLLOW } from "./followups.js";
import { finalScore, hintsUsed } from "./state.js";
import { HINTS } from "./hints.js";
import { skillScores, summary } from "./skills.js";
import { G } from "./grc.js";
import { SET } from "./ticketSet.js";

export function buildReport(name){
  const s = summary(), sk = skillScores();
  const tickets = list => list.map(t => { const ts = S.tickets[t.id];
    // [id, final score x10, max, hint tiers used, 1 resolved / 2 rejected / 0 open, skill, title (follow-ups only)]
    const row = [t.id, ts.checks ? Math.round(finalScore(ts) * 10) : -1, ts.max || 0, hintsUsed(ts), ts.checks ? (ts.status === "resolved" ? 1 : 2) : 0, (HINTS[t.id] || {}).skill || ""];
    // Pacific Crest's assigned ticket titles are known to every reader; other companies' are stored.
    if (!T.includes(t) || SET.id !== "pacific-crest") row.push(t.title);
    return row; });
  const shift = (x, list) => x ? { pct: x.pct, sc: x.sc, mx: x.mx, done: x.done, n: list.length, solo: x.solo, assisted: x.assisted } : null;
  // Field names predate the live queue and stay for old links: `week` is the shift score, `mon`
  // the assigned tickets and `thu` the follow-ups and standing tickets that arrived.
  return {
    v: 1, name: (name || "").trim().slice(0, 60), date: new Date().toISOString().slice(0, 10),
    week: s.shiftPct, mon: shift(s.assigned, T), thu: s.follow ? shift(s.follow, FOLLOW) : null,
    grc: s.grc.done ? { pct: s.grc.pct, done: s.grc.done, n: G.length } : null,
    caused: s.caused, prevented: s.prevented, reopened: s.reopened, hints: s.hints,
    skills: sk.map(x => [x.key, x.pct]),
    tickets: tickets(T).concat(tickets(FOLLOW)),
  };
}

export function encodeReport(data){
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  let bin = ""; bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function decodeReport(str){
  try {
    const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/"));
    const data = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))));
    // GRC-only reports (p: "grc") carry an audit result instead of shifts.
    if (data && data.v === 1 && (data.mon || (data.p === "grc" && data.audit)) && Array.isArray(data.tickets) && Array.isArray(data.skills)) return data;
  } catch (e) {}
  return null;
}
// Pacific Crest's assigned ticket titles are static, so they aren't stored in the link.
export const ticketTitle = row => row[6] || (TK[row[0]] ? TK[row[0]].title : row[0]);
