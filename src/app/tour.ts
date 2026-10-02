// Guided walkthrough of the simulator: one tour per kind of path. Each step opens a screen and
// points at one part of it. It runs once on the first visit and replays from "How it works".
import { useSyncExternalStore } from "react";
import { queueTickets } from "@/engine/followups.js";
import { nextTicket } from "@/engine/skills.js";
import { path, pathChosen } from "./paths";
import { company } from "./company";
import { weekAudit } from "./audit/weekAudit";
import { ANALYST } from "./audit/jordan";

export type TourStep = {
  hash: string; // screen to open
  target?: string; // data-tour value (or a CSS selector) to point at; centred card when missing
  title: string;
  body: string;
};

const SEEN = "rolevara-tour-seen";
const NAV = '[data-slot="sidebar"]';

function firstTicket() {
  const t = nextTicket() ?? queueTickets()[0];
  return t ? `#/queue/${t.id}` : "#/queue";
}

function iamSteps(): TourStep[] {
  const c = company().name, tk = firstTicket();
  return [
    { hash: "#/home", title: "How a shift works",
      body: `You're the IAM analyst on the ${c} service desk. Tickets come in, you do the work in the admin tools, and each ticket is graded against ${c}'s policy. This tour walks through one ticket, start to finish.` },
    { hash: "#/home", target: NAV, title: "Your tools",
      body: "Everything is in this menu, like a real admin center. The Ticket queue holds your work. Users and Groups are where you make changes. Policy & matrix has the rules you're graded on." },
    { hash: "#/queue", target: "queue-list", title: "1. Pick a ticket",
      body: "Each card is a ticket. P1 is the most urgent, so work those first. New work and requester replies land here while you work." },
    { hash: tk, target: "ticket", title: "2. Read the request",
      body: "Check who's asking, what they want and which accounts are involved. Not every request should be done: some should be rejected or escalated." },
    { hash: tk, target: "start", title: "3. Start work",
      body: "Click Start work before you change anything. It makes this the active ticket, so the audit log ties your changes to it." },
    { hash: "#/policy", target: "page-title", title: "4. Check the policy",
      body: "The access matrix says which groups each job gets and what needs manager approval. If you're not sure, check here before you guess." },
    { hash: "#/directory", target: "users", title: "5. Make the change in Users",
      body: "Click a person to open their account. From there you can disable, unlock, reset a password or MFA, revoke sessions, update job info, and add or remove groups. A ticket's related accounts link straight here." },
    { hash: tk, target: "help", title: "Stuck? Get help",
      body: "Ask the tutor any time for free. It asks questions and explains terms, but won't give you the answer. Hints cost part of the ticket's score, and the last one marks it Assisted." },
    { hash: tk, title: "6. Close the ticket",
      body: "Back on the ticket, you can verify a caller, request manager approval or escalate. Then add a note and pick Resolve or Reject. Closing grades it. If your fix didn't work, the requester replies and the ticket reopens." },
    { hash: tk, target: "progress", title: "Track your score",
      body: "Closed tickets and your score update as you go. When the queue is clear, your shift summary and readiness report are ready. Replay this tour any time from How it works in the menu." },
  ];
}

function grcSteps(): TourStep[] {
  const c = company().name, task = weekAudit()?.tasks[0]?.id;
  return [
    { hash: "#/home", title: "How the audit works",
      body: `You're ${c}'s internal auditor. ${ANALYST.name}, an IAM analyst, worked a service-desk shift with some realistic mistakes in it. You test that work against the IAM controls.` },
    { hash: "#/home", target: NAV, title: "Your tools",
      body: "Everything is in this menu. Audit Jordan's shift holds your tasks. Users, Groups, the Audit log and Policy & matrix are your evidence. They're read-only for you." },
    { hash: "#/log", target: "page-title", title: "The evidence",
      body: `The audit log records every change ${ANALYST.first} made, with the time and the ticket it was made under. Compare it with the tickets and the policy.` },
    { hash: "#/policy", target: "page-title", title: "The standard",
      body: "Policy & matrix is what the controls require: which groups each job gets and what needs approval. A finding is the gap between this and what actually happened." },
    { hash: task ? `#/audit/${task}` : "#/audit", target: "page-title", title: "Work the tasks in order",
      body: "Seven tasks, from walkthrough and sampling to the finding, risk rating and management's response. Read the task, check the evidence, then submit the workpaper. Each one is graded when you submit. Replay this tour from How it works in the menu." },
  ];
}

export const tourSteps = (): TourStep[] => (path() === "grc" ? grcSteps() : iamSteps());

// ---------- State ----------
let step: number | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const useTourStep = () => useSyncExternalStore(subscribe, () => step);

const seenKey = () => `${SEEN}-${path() === "grc" ? "grc" : "iam"}`;
function markSeen() { try { localStorage.setItem(seenKey(), "1"); } catch { /* shows again next visit */ } }
function seen() { try { return localStorage.getItem(seenKey()) === "1"; } catch { return true; } }

export function startTour() { step = 0; emit(); }
export function goStep(i: number) { step = i; emit(); }
export function endTour() { step = null; markSeen(); emit(); }

// First visit to a path at a company with tickets: run the tour once. Automated browsers skip it,
// so it never covers the screen in tests (they start it from the menu instead).
export function shouldAutoStart() {
  return step === null && pathChosen() && company().hasTickets && !seen() && !navigator.webdriver;
}
