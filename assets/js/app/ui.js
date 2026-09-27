// Small rendering helpers shared by the views.
import { S, U } from "../engine/store.js";
import { finalScore, isAssisted, hintsUsed } from "../engine/state.js";

export const h = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
export const num = n => n == null ? "–" : nf.format(n);
export const pct = n => n == null ? "–" : n + "%";
export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
export const lastTxt = n => n===null?"Never":n===0?"Today":n===1?"Yesterday":n+" days ago";

// UI state that isn't part of the saved simulation.
export const ui = {
  view: "cur",            // "mon" to look back at Monday during the Thursday shift
  qfilter: "open",        // queue filter: open | closed | all
  dirQ: "", dirDept: "All", dirStatus: "all", dirSort: { key: "name", dir: 1 },
  tutorOpen: null,        // null = default for the screen width
  hintConfirm: null,      // ticket id awaiting a hint-cost confirmation
  freeHints: {},          // closed tickets: tiers opened for review (free)
  tutor: {},              // per-ticket tutor transcripts (session only)
  confirmReset: false,
  closeError: null,
};

export const statusPill = st => ({
  new:'<span class="pill">New</span>',
  working:'<span class="pill acc"><span class="dot"></span>In progress</span>',
  resolved:'<span class="pill ok">Resolved</span>',
  rejected:'<span class="pill warn">Rejected</span>'}[st]);

// Solo / Assisted badge. Shown on closed tickets, and on open tickets once exact steps are revealed.
export function modePill(ts){
  if (isAssisted(ts)) return '<span class="pill warn" title="Exact-steps hint used">Assisted</span>';
  return ts.checks ? '<span class="pill solid" title="Closed without the exact-steps hint">Solo</span>' : "";
}
export function scorePill(ts){
  if (!ts.checks) return "";
  const f = finalScore(ts);
  return `<span class="pill mono" title="${hintsUsed(ts) ? `Raw ${ts.score}/${ts.max}, hint penalty applied` : "Score"}">${num(f)}/${ts.max}</span>`;
}
export function userPills(u){
  const p=[];
  if(u.preHire&&!u.enabled) p.push('<span class="pill acc">Pre-hire</span>');
  else if(!u.enabled) p.push('<span class="pill bad">Disabled</span>');
  if(u.locked) p.push('<span class="pill warn">Locked</span>');
  if(u.type!=="Employee") p.push('<span class="pill">'+u.type+'</span>');
  return p.join("");
}
export const checksHtml = checks => `<div class="checks">${checks.map(c=>`<div class="check ${c.pass?"pass":"fail"}"><span class="mk" aria-hidden="true">${c.pass?"✓":"✗"}</span><span><span class="sr-only">${c.pass?"Passed: ":"Missed: "}</span>${h(c.label)}${c.detail?`<div class="why">${h(c.detail)}</div>`:""}</span><span class="pts">${c.pass?c.pts:0}/${c.pts}</span></div>`).join("")}</div>`;
// Score meters are toned by result; progress meters (neutral) always use the accent.
export const meter = (p, label, neutral) => `<div class="meter ${neutral||p==null?"":p>=85?"ok":p>=65?"":p>=45?"warn":"bad"}" role="img" aria-label="${h(label)}: ${p==null?"not started":p+"%"}"><span style="width:${p??0}%"></span></div>`;
export const userName = id => (S.users[id] ? U(id).name : id);

// ---------- Toasts ----------
// One toast at a time. Plain toasts auto-dismiss after 6s; toasts with an action stay
// until dismissed or replaced (WCAG 2.2.1).
let toastTimer;
export function toast(msg, action){
  const box = document.getElementById("toasts");
  clearTimeout(toastTimer);
  box.innerHTML = `<div class="toast"><span>${h(msg)}</span>${action?`<button class="tbtn" data-toast-act>${h(action.label)}</button>`:""}<button class="tbtn" data-toast-close aria-label="Dismiss">✕</button></div>`;
  const el = box.firstElementChild;
  if (action) el.querySelector("[data-toast-act]").onclick = () => { box.innerHTML = ""; action.run(); };
  el.querySelector("[data-toast-close]").onclick = () => { box.innerHTML = ""; };
  if (!action) toastTimer = setTimeout(() => { box.innerHTML = ""; }, 6000);
}
