// Jordan Reyes, a simulated IAM analyst at the active company. On the GRC-only path the learner
// audits Jordan's shift. It is played through the real engine, so the audit log, the directory,
// the ticket grades and the follow-ups Jordan's work caused are all genuine evidence.
// Jordan works most tickets by the playbook and makes six realistic mistakes; each company's
// ticket set says which (see TicketSet.jordan).
import { S } from "@/engine/store.js";
import { T, TK } from "@/engine/tickets.js";
import { act, tact, closeTicket } from "@/engine/state.js";
import { queueTickets } from "@/engine/followups.js";
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

// Plays Jordan's shift into the current (fresh) state: the assigned tickets in order, then
// whatever arrived or was reopened while Jordan worked, until the queue is clear.
export function playJordanWeek() {
  const { after, act: [a, uid] } = SET.jordan.unticketed;
  T.forEach((t: any) => {
    work(t.id);
    // Someone asks Jordan at the desk for a quick change, and Jordan makes it without a ticket.
    if (t.id === after) act(a, uid);
  });
  for (let i = 0; i < 100; i++) {
    const next = queueTickets().find((t: any) => !S.tickets[t.id].checks);
    if (!next) break;
    work(next.id);
  }
  S.jordan = 1;
}
