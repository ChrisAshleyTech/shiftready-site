// The live queue. A shift starts with the assigned tickets; the rest of the work arrives while
// it's being worked, the way a real service desk runs:
//   - Follow-ups: a closed ticket's consequences (CONSEQ) are checked a couple of tickets later.
//     If the problem is still there, it comes back. A requester who sees the fix didn't work
//     replies and the original ticket reopens; a security event arrives as a new, related
//     incident. If it was fixed in the meantime, it's prevented.
//   - Replies: a ticket whose fix didn't take (see the set's `replies`) is reopened by the
//     requester's reply, and stays in the queue until it's actually fixed.
//   - Standing tickets arrive partway through, like any other new work.
// The consequences, standing tickets and replies belong to the active company's ticket set.
import { S } from "./store.js";
import { TK, T } from "./tickets.js";
import { save, clockStr } from "./state.js";
import { CONSEQ as PC_CONSEQ, STANDING as PC_STANDING } from "../packs/pacific-crest/followups.js";
import { CONSEQ_LINKS as PC_LINKS } from "../packs/pacific-crest/hints.js";
import { REPLIES as PC_REPLIES } from "../packs/pacific-crest/replies.js";

export { escalatedOn } from "./store.js";
// How many closed tickets later each kind of event lands.
export const DELAY = { followUp: 2, reply: 1 };
// Standing tickets arrive after this many tickets have been closed.
export const STANDING_AT = [6, 12];

export let CONSEQ, STANDING, REPLIES;
// The arrived follow-up and standing tickets, in arrival order.
export let FOLLOW = [];
export function setFollowUps(conseq, standing, links, replies){
  CONSEQ = conseq.map(c => ({ ...c, src: links[c.key].src, reopen: !!links[c.key].reopen }));
  STANDING = standing; REPLIES = replies || {}; FOLLOW = [];
}
setFollowUps(PC_CONSEQ, PC_STANDING, PC_LINKS, PC_REPLIES);

// The parity test drives the engine like the original simulator, which had no live queue.
let LIVE = true;
export const setLiveQueue = on => { LIVE = on; };

// Queue state lives on S.q: closes so far, pending events, and what has arrived (in order).
const Q = () => S.q || (S.q = { closes: 0, pend: STANDING.map((t, i) => ({ type: "std", id: t.id, at: STANDING_AT[i] ?? STANDING_AT.at(-1) })), arr: [] });

function make(x){
  if (x.std) return STANDING.find(t => t.id === x.std);
  const c = CONSEQ.find(c => c.key === x.key), t = c.make(x.target);
  t.key = c.key; t.src = c.src; if (c.reopen) t.reopens = c.src;
  return t;
}
export function buildFollow(){
  FOLLOW = (S.q ? S.q.arr : []).map(make);
  FOLLOW.forEach(t => { const ts = S.tickets[t.id]; if (ts && ts.opened) t.opened = ts.opened; TK[t.id] = t; });
}
// Everything in the queue: the assigned tickets, then whatever has arrived. Rebuilds when the
// state was swapped underneath (a reset or a loaded save).
export const queueTickets = () => {
  if (FOLLOW.length !== (S.q ? S.q.arr.length : 0)) buildFollow();
  return T.concat(FOLLOW);
};
const openCount = () => queueTickets().filter(t => !S.tickets[t.id].checks).length;

function arrive(x){
  const q = Q(); q.arr.push(x); buildFollow();
  const t = FOLLOW[FOLLOW.length - 1];
  S.tickets[t.id] = { status: "new", esc: [], opened: clockStr() };
  t.opened = S.tickets[t.id].opened;
}
// Reopens a closed ticket with the requester's reply. The first resolution's grade stands.
export function reopen(tid, reply){
  const ts = S.tickets[tid];
  if (!ts.first) ts.first = { checks: ts.checks, score: ts.score, max: ts.max, status: ts.status };
  delete ts.checks;
  ts.status = "reopened"; ts.reopens = (ts.reopens || 0) + 1;
  (ts.replies || (ts.replies = [])).push({ t: clockStr(), from: reply.from, text: reply.text });
}
function fire(e){
  if (e.type === "std") { arrive({ std: e.id }); return; }
  if (e.type === "reply") { const r = REPLIES[e.tid] && REPLIES[e.tid](S.tickets[e.tid]); if (r && S.tickets[e.tid].checks) reopen(e.tid, r); return; }
  const c = CONSEQ.find(c => c.key === e.key);
  if ((S.report || []).some(r => r.key === c.key)) return;
  const tg = c.when();
  (S.report || (S.report = [])).push(tg ? { key: c.key, bad: true, text: c.cause } : { key: c.key, bad: false, text: c.prevented });
  if (!tg) return;
  c.apply(tg);
  (S.thu || (S.thu = [])).push({ key: c.key, target: tg });
  arrive({ key: c.key, target: tg });
}
// Lands every event that is due. When nothing is left open, the rest lands at once, so the
// shift never stalls waiting for work.
function land(){
  const q = Q();
  for (;;) {
    let due = q.pend.filter(e => e.at <= q.closes);
    if (!due.length && q.pend.length && !openCount()) due = q.pend.slice();
    if (!due.length) return;
    q.pend = q.pend.filter(e => !due.includes(e));
    due.forEach(fire);
  }
}
// Called by closeTicket after grading.
export function afterClose(tid){
  if (!LIVE) return;
  const q = Q(), ts = S.tickets[tid];
  q.closes++;
  if (!ts.queued) { ts.queued = 1; CONSEQ.filter(c => c.src === tid).forEach(c => q.pend.push({ type: "con", key: c.key, at: q.closes + DELAY.followUp })); }
  if (REPLIES[tid]) q.pend.push({ type: "reply", tid, at: q.closes + DELAY.reply });
  land();
}
// Lands everything still pending, and any follow-up not yet checked (in CONSEQ order).
// Used when a whole queue is worked in one go: tests, Jordan Reyes' shift, older saves.
export function releaseAll(){
  const q = Q();
  const pend = q.pend; q.pend = [];
  pend.filter(e => e.type === "std").forEach(fire);
  CONSEQ.forEach(c => { const p = pend.find(e => e.type === "con" && e.key === c.key); if (p || !LIVE) fire({ type: "con", key: c.key }); });
  pend.filter(e => e.type === "reply").forEach(fire);
  save();
}
// The queue is clear when every ticket is closed and nothing else is on its way.
export const queueDone = () => !openCount() && !(S.q && S.q.pend.length);
// Saves from before the live queue (an older two-shift format) carry over: a started second
// shift becomes the arrived follow-ups.
export function migrate(){
  if (S.q) return;
  if (S.shift === "thu") {
    S.q = { closes: queueTickets().length, pend: [], arr: STANDING.map(t => ({ std: t.id })).concat((S.thu || []).map(x => ({ key: x.key, target: x.target }))) };
    if (S.report) S.report = S.report.map((r, i) => ({ key: CONSEQ[i].key, ...r }));
    T.forEach(t => { S.tickets[t.id].queued = 1; });
  } else {
    Q().closes = T.filter(t => S.tickets[t.id] && S.tickets[t.id].checks).length;
    T.forEach(t => { if (S.tickets[t.id] && S.tickets[t.id].checks) { S.tickets[t.id].queued = 1; CONSEQ.filter(c => c.src === t.id).forEach(c => S.q.pend.push({ type: "con", key: c.key, at: S.q.closes + DELAY.followUp })); } });
  }
  delete S.shift;
}
