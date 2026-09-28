// User actions, ported from v1 actions.js: the same engine calls, followed by commit() and a toast.
import { toast } from "sonner";
import { S, U } from "@/engine/store.js";
import { act, tact, closeTicket as engineClose, revealHint, resetAll, finalScore, isAssisted } from "@/engine/state.js";
import { startThursday as engineStartThursday, THU_T } from "@/engine/thursday.js";
import { TK } from "@/engine/tickets.js";
import { commit, ui, go, num, plural, focusSoon } from "./sim";

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

export function closeTicket(tid: string, kind: "resolve" | "reject", note: string, answer?: string) {
  const t = TK[tid];
  const err = engineClose(tid, kind, { note, answer: t.question ? answer : undefined });
  ui.closeError = err;
  commit();
  if (err) { focusSoon(t.question ? "#ans-" + tid : "#close-error"); return; }
  const ts = S.tickets[tid];
  toast(`${tid} ${ts.status}: ${num(finalScore(ts))}/${ts.max}${isAssisted(ts) ? " · Assisted" : ""}.`);
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

export function startThursday() {
  engineStartThursday(); ui.view = "cur"; ui.qfilter = "open";
  const caused = S.report.filter((r: any) => r.bad).length;
  go("#/queue");
  toast(`Thursday, 8:00 AM. ${caused ? plural(caused, "Monday decision", "Monday decisions") + " came back as tickets." : "Nothing from Monday came back."} ${THU_T.length} tickets waiting.`);
}

export function resetProgress() {
  resetAll();
  Object.assign(ui, { confirmReset: false, view: "cur", tutor: {}, freeHints: {}, qfilter: "open" });
  go("#/home");
  toast("Progress erased. Monday starts again.");
}
