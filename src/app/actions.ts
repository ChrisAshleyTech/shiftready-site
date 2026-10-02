// User actions, ported from v1 actions.js: the same engine calls, followed by commit() and a toast.
import { toast } from "sonner";
import { S, U } from "@/engine/store.js";
import { act, tact, closeTicket as engineClose, revealHint, resetAll, finalScore, isAssisted } from "@/engine/state.js";
import { queueTickets } from "@/engine/followups.js";
import { TK } from "@/engine/tickets.js";
import { commit, ui, go, num, focusSoon } from "./sim";
import { ensureJordan } from "./company";
import { path } from "./paths";
import { ticketNo, ticketName } from "./ticketLabel";

const noTicket = () => (S.active ? "" : " No active ticket, so this change isn't tied to one.");
// Plain toasts auto-dismiss; toasts with an action stay until dismissed (WCAG 2.2.1).
const persistent = { duration: Infinity } as const;

export function doAct(op: string, uid: string, arg?: string) {
  const d = act(op, uid, arg);
  commit();
  if (d === null) return;
  const name = U(uid).name;
  // Reversible changes get an undo. It applies the opposite change, so the audit log stays honest.
  if (op === "disable") toast(`${name}: account disabled.${noTicket()}`, { ...persistent, action: { label: "Undo", onClick: () => { act("enable", uid); commit(); toast(`${name}: re-enabled. Both changes are in the audit log.`); } } });
  else if (op === "rmgrp") toast(`${name}: removed from ${arg}.${noTicket()}`, { ...persistent, action: { label: "Undo", onClick: () => { act("addgrp", uid, arg); commit(); toast(`${name}: added back to ${arg}. Both changes are in the audit log.`); } } });
  else toast(`${name}: ${d.charAt(0).toLowerCase() + d.slice(1)}.${noTicket()}`);
}

export const startWork = (tid: string) => { tact("start", tid); commit(); focusSoon("#ta-h"); };
export const resume = (tid: string) => { tact("resume", tid); commit(); focusSoon("#ta-h"); };
export const verify = (tid: string) => { toast(tact("verify", tid)); commit(); };
export const requestApproval = (tid: string) => { tact("approval", tid); commit(); toast("Approval requested. The reply is on the ticket."); };
export const escalate = (tid: string, who: string) => { toast(tact("escalate", tid, who)); commit(); };

const openIds = () => new Set<string>(queueTickets().filter((t: any) => !S.tickets[t.id].checks).map((t: any) => t.id));

export function closeTicket(tid: string, kind: "resolve" | "reject", note: string, answer?: string) {
  const t = TK[tid], before = openIds(), again = !!S.tickets[tid].first;
  const err = engineClose(tid, kind, { note, answer: t.question ? answer : undefined });
  ui.closeError = err;
  commit();
  if (err) { focusSoon(t.question ? "#ans-" + tid : "#close-error"); return; }
  const ts = S.tickets[tid];
  toast(again ? `${ticketNo(t)} ${ts.status} again. The first resolution's grade stands: ${num(finalScore(ts))}/${ts.max}.`
    : `${ticketNo(t)} ${ts.status}: ${num(finalScore(ts))}/${ts.max}${isAssisted(ts) ? " · Assisted" : ""}.`);
  // Whatever landed in the queue while this ticket was being closed: replies and new tickets.
  [...openIds()].filter(id => !before.has(id) && id !== tid).forEach(id => {
    const n = TK[id], s = S.tickets[id], open = { label: "Open", onClick: () => go(`#/queue/${id}`) };
    if (s.status === "reopened") toast(`${ticketNo(n)} reopened. ${s.replies[s.replies.length - 1].from} replied that it isn't fixed.`, { ...persistent, action: open });
    else if (n.reopens) toast(`${ticketNo(n)} reopened. ${n.from} replied: ${n.title}`, { ...persistent, action: open });
    else toast(`New in the queue: ${n.id} ${ticketName(n)}`, { ...persistent, action: open });
  });
  focusSoon("#grade-h");
}

export const hintAsk = (tid: string) => { ui.hintConfirm = tid; commit(); focusSoon("#hint-yes"); };
export const hintNo = (tid: string) => { ui.hintConfirm = null; commit(); focusSoon(`#hint-ask-${tid}`); };
export function hintYes(tid: string) {
  ui.hintConfirm = null; revealHint(tid); commit();
  focusSoon(`#hint-${tid}-${S.tickets[tid].hints - 1}`);
}
export function hintFree(tid: string) {
  const n = Math.max(S.tickets[tid].hints || 0, ui.freeHints[tid] || 0) + 1;
  ui.freeHints[tid] = n; commit(); focusSoon(`#hint-${tid}-${n - 1}`);
}

// Resets the current path at the current company. Other paths keep their progress.
export function resetProgress() {
  resetAll();
  ensureJordan();
  Object.assign(ui, { confirmReset: false, tutor: {}, freeHints: {}, qfilter: "open" });
  go("#/home");
  toast(path() === "grc" ? "Audit erased. Jordan's shift is ready to audit again." : "Progress erased. The shift starts again.");
}
