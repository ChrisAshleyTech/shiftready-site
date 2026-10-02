// Shared by every platform lab: the Pacific Crest seed data, and grading of a tenant's state.
// Each platform (Entra, Okta, AWS) parses its own read-only export into LabState, then grading runs
// the simulator's own ticket checks, so a ticket done in a real console is scored exactly as
// the same ticket done in the app.
// The labs are built on Pacific Crest, whichever company is active in the app.
import * as Active from "../../engine/company.js";
import * as PacificCrest from "../../packs/pacific-crest/company.js";
import { T } from "../../packs/pacific-crest/tickets.js";
import { S, setState } from "../../engine/store.js";

const { buildUsers, ROLES } = PacificCrest;
const TK: Record<string, any> = Object.fromEntries(T.map((t: any) => [t.id, t]));

// Assigned tickets that can be worked in a real console and checked from a read-only export.
export const LAB_TICKETS = ["REQ0018841", "REQ0018850", "REQ0018852", "REQ0018870", "REQ0018879", "REQ0018881"] as const;
export const LAB_USERS = ["maria.lopez", "robert.hayes", "tanya.wright", "sofia.ramirez", "rachel.adams", "ethan.moore", "bob.turner"];
// Roles the tickets provision into, so every group the learner needs exists in the tenant.
const TARGET_ROLES = ["Finance|AP Clerk", "Operations|Dispatcher", "HR|HR Generalist", "Sales|Account Executive"];

export const labTitle = (id: string): string => TK[id].title;

export type LabUser = { key: string; alias: string; name: string; empId: string; dept: string; title: string; enabled: boolean; groups: string[] };
export type LabSpec = { company: string; users: LabUser[]; groups: string[] };

export function labSpec(): LabSpec {
  const all = buildUsers();
  const users: LabUser[] = LAB_USERS.map(k => {
    const u = all[k];
    return { key: k, alias: k, name: u.name, empId: u.empId, dept: u.dept, title: u.title, enabled: u.enabled, groups: [...u.groups] };
  });
  const groups = [...new Set([...TARGET_ROLES.flatMap(r => ROLES[r] as string[]), ...users.flatMap(u => u.groups)])].sort();
  return { company: "Pacific Crest Logistics (Rolevara lab)", users, groups };
}

export class ExportError extends Error {}

/** Parses a JSON export, tolerating the byte-order mark Windows PowerShell 5.1 writes. */
export function readJson(text: string, hint: string): any {
  try { return JSON.parse(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text); }
  catch { throw new ExportError(`This file isn't valid JSON. ${hint}`); }
}

export function requireUsers(users: { key?: string }[], hint: string) {
  const missing = LAB_USERS.filter(k => !users.some(u => u?.key === k));
  if (missing.length) throw new ExportError(`The export is missing ${missing.join(", ")}. ${hint}`);
}

// ---------- Grading ----------
/** One lab user's state, in simulator terms. A deleted user carries only key and deleted. */
export type LabState = { key: string; deleted?: boolean; enabled?: boolean; dept?: string; title?: string; groups?: string[]; revoked?: boolean; pwReset?: boolean };
export type Check = { pass: boolean; label: string; pts: number; detail: string };
export type TicketResult = { id: string; title: string; lesson: string; checks: Check[]; score: number; max: number };
export type LabResult = { tickets: TicketResult[]; score: number; max: number; exportedAt: string };

/** True when `now` is a later timestamp than `before` (or `before` is unknown). */
export const later = (now?: string | null, before?: string | null) => !!now && (!before || Date.parse(now) > Date.parse(before));

export function gradeState(states: LabState[], exportedAt: string, deletedNote = "Policy disables accounts instead, so access stays auditable."): LabResult {
  const users = buildUsers();
  const deleted = new Set<string>();
  for (const e of states) {
    const u = users[e.key]; if (!u) continue;
    if (e.deleted) { deleted.add(e.key); continue; }
    Object.assign(u, { enabled: !!e.enabled, dept: e.dept ?? "", title: e.title ?? "", groups: [...(e.groups ?? [])], revoked: !!e.revoked, pwReset: !!e.pwReset });
  }
  const prev = S;
  // Grading reads the engine's access matrix, so point it at Pacific Crest while grading.
  const { ROLES: r, REQUESTABLE, SOD, ALL_GROUPS, BASE, fmtDay, buildUsers: b, HR_FEED } = Active;
  const prevCompany = { ROLES: r, REQUESTABLE, SOD, ALL_GROUPS, BASE, fmtDay, buildUsers: b, HR_FEED };
  Active.setCompanyData(PacificCrest);
  setState({ users, tickets: {}, log: [], active: null, clock: 480, grc: {} });
  try {
    const tickets = LAB_TICKETS.map(id => {
      const t = TK[id];
      let checks: Check[] = t.grade({ esc: [] });
      const gone = t.users.filter((k: string) => deleted.has(k));
      if (gone.length) checks = checks.map(c => ({ ...c, pass: false, detail: `${gone.map((k: string) => users[k].name).join(", ")} was deleted. ${deletedNote}` }));
      const max = checks.reduce((s, c) => s + c.pts, 0);
      return { id, title: t.title, lesson: t.lesson, checks, max, score: checks.reduce((s, c) => s + (c.pass ? c.pts : 0), 0) };
    });
    return { tickets, exportedAt, score: tickets.reduce((s, t) => s + t.score, 0), max: tickets.reduce((s, t) => s + t.max, 0) };
  } finally { setState(prev); Active.setCompanyData(prevCompany); }
}
