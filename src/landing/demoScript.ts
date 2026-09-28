// Script for the landing-page demo: INC0041207 worked correctly. The ticket text comes from the
// engine; the grade lines must match what the engine awards (tests/demo.test.js checks this).
import { TK } from "@/engine/tickets.js";

export const DEMO_TICKET = TK.INC0041207 as { id: string; pri: number; title: string; from: string; channel: string; body: string; caller: { empId: string; mgr: string } };

export const DEMO_DIRECTORY = { user: "james.carter", name: "James Carter", empId: "10231", mgr: "Linda Park" };

export const DEMO_LOG = [
  { at: 3, t: "8:02 AM", text: "Caller identity marked verified" },
  { at: 4, t: "8:04 AM", text: "james.carter: temporary password issued" },
  { at: 5, t: "8:06 AM", text: "Resolved" },
];

export const DEMO_CHECKS = [
  { label: "Identity verified before the reset", pts: 3 },
  { label: "Password reset issued", pts: 3 },
  { label: "MFA left alone (not part of the issue)", pts: 1 },
  { label: "Closed as resolved", pts: 1 },
];

/** Steps: 0 arrives, 1 start, 2 compare caller, 3 verify, 4 reset, 5 resolve, 6 graded. */
export const DEMO_STEPS = [
  "A ticket arrives in the queue",
  "Start work",
  "Compare the caller's details with the directory",
  "Mark identity verified",
  "Reset the password in the Directory",
  "Resolve the ticket",
  "Graded on outcome and process",
];
