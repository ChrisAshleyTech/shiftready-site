// How a ticket is labelled in the queue. A follow-up that reopens its source ticket (the
// requester replied that the fix didn't work) is shown under the source ticket's number and title.
import { S } from "@/engine/store.js";
import { TK } from "@/engine/tickets.js";
import { FOLLOW } from "@/engine/followups.js";

export const ticketNo = (t: any): string => t.reopens || t.id;
export const ticketName = (t: any): string => (t.reopens ? TK[t.reopens].title : t.title);
// Source tickets standing in for a reopen: the queue lists the reopened ticket in their place.
export const supersededIds = () => new Set<string>(FOLLOW.filter((t: any) => t.reopens).map((t: any) => t.reopens));
// The status to show: a reopen follow-up that hasn't been picked up yet reads as Reopened.
export const statusOf = (t: any): string => { const st = S.tickets[t.id].status; return st === "new" && t.reopens ? "reopened" : st; };
