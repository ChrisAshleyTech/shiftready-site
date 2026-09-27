// Readiness report data. The shareable link carries this object, base64url-encoded, in the
// URL fragment, so no server is needed (and fragments are never sent to one).
import { S } from "./store.js";
import { T, TK } from "./tickets.js";
import { THU_T } from "./thursday.js";
import { finalScore, hintsUsed } from "./state.js";
import { HINTS } from "./hints.js";
import { skillScores, summary } from "./skills.js";
import { G } from "./grc.js";

export function buildReport(name){
  const s = summary(), sk = skillScores();
  const tickets = list => list.map(t => { const ts = S.tickets[t.id];
    // [id, final score x10, max, hint tiers used, 1 resolved / 2 rejected / 0 open, skill, title (Thursday only)]
    const row = [t.id, ts.checks ? Math.round(finalScore(ts) * 10) : -1, ts.max || 0, hintsUsed(ts), ts.checks ? (ts.status === "resolved" ? 1 : 2) : 0, (HINTS[t.id] || {}).skill || ""];
    if (!T.includes(t)) row.push(t.title);
    return row; });
  const shift = (x, list) => x ? { pct: x.pct, sc: x.sc, mx: x.mx, done: x.done, n: list.length, solo: x.solo, assisted: x.assisted } : null;
  return {
    v: 1, name: (name || "").trim().slice(0, 60), date: new Date().toISOString().slice(0, 10),
    week: s.weekPct, mon: shift(s.mon, T), thu: S.shift === "thu" ? shift(s.thu, THU_T) : null,
    grc: s.grc.done ? { pct: s.grc.pct, done: s.grc.done, n: G.length } : null,
    caused: s.caused, prevented: s.prevented, hints: s.hints,
    skills: sk.map(x => [x.key, x.pct]),
    tickets: tickets(T).concat(S.shift === "thu" ? tickets(THU_T) : []),
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
    if (data && data.v === 1 && data.mon && Array.isArray(data.tickets) && Array.isArray(data.skills)) return data;
  } catch (e) {}
  return null;
}
// Monday titles are static, so they aren't stored in the link.
export const ticketTitle = row => row[6] || (TK[row[0]] ? TK[row[0]].title : row[0]);
