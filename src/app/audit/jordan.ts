// Jordan Reyes, a simulated IAM analyst at the active company. On the GRC-only path the learner
// audits Jordan's Monday and Thursday. The week is played through the real engine, so the audit
// log, the directory, the ticket grades and Thursday's consequences are all genuine evidence.
// Jordan works most tickets by the playbook and makes six realistic mistakes; each company's
// ticket set says which (see TicketSet.jordan).
import { S } from "@/engine/store.js";
import { T, TK } from "@/engine/tickets.js";
import { act, tact, closeTicket } from "@/engine/state.js";
import { startThursday, THU_T } from "@/engine/thursday.js";
import { SET } from "@/engine/ticketSet.js";

export const ANALYST = { name: "Jordan Reyes", first: "Jordan", title: "IAM Analyst" };

// The mistakes at the active company, for tests and the answer key: ticket id -> what went wrong.
export const mistakes = () => SET.jordan.MISTAKES;

function work(id: string) {
  const play = SET.jordan.plays[id] ?? SET.playbook[id];
  tact("start", id);
  let r = play(id); if (!Array.isArray(r)) r = [r, ""];
  closeTicket(id, r[0], { note: SET.jordan.notes[id] ?? "Done per runbook.", answer: TK[id].question ? r[1] : undefined });
}

// Plays Jordan's week into the current (fresh) state: Monday, then Thursday.
export function playJordanWeek() {
  const { after, act: [a, uid] } = SET.jordan.unticketed;
  T.forEach((t: any) => {
    work(t.id);
    // Someone asks Jordan at the desk for a quick change, and Jordan makes it without a ticket.
    if (t.id === after) act(a, uid);
  });
  startThursday();
  THU_T.forEach((t: any) => work(t.id));
  S.jordan = 1;
}
