// Entra ID lab: the seed spec for a Microsoft Entra tenant, and grading of the read-only export.
// Grading runs the simulator's own Monday ticket checks against the exported tenant state, so a
// ticket done in Entra is scored exactly as the same ticket done in the app.
import { buildUsers, ROLES } from "../../engine/company.js";
import { TK } from "../../engine/tickets.js";
import { S, setState } from "../../engine/store.js";

// Monday tickets that can be worked in the Entra admin center and checked from an export.
export const LAB_TICKETS = ["REQ0018841", "REQ0018850", "REQ0018852", "REQ0018870", "REQ0018879", "REQ0018881"] as const;
const LAB_USERS = ["maria.lopez", "robert.hayes", "tanya.wright", "sofia.ramirez", "rachel.adams", "ethan.moore", "bob.turner"];
// Roles the tickets provision into, so every group the learner needs exists in the tenant.
const TARGET_ROLES = ["Finance|AP Clerk", "Operations|Dispatcher", "HR|HR Generalist", "Sales|Account Executive"];

export type LabUser = { key: string; alias: string; name: string; empId: string; dept: string; title: string; enabled: boolean; groups: string[] };
export type LabSpec = { company: string; users: LabUser[]; groups: string[] };

export function labSpec(): LabSpec {
  const all = buildUsers();
  const users: LabUser[] = LAB_USERS.map(k => {
    const u = all[k];
    return { key: k, alias: k, name: u.name, empId: u.empId, dept: u.dept, title: u.title, enabled: u.enabled, groups: [...u.groups] };
  });
  const groups = [...new Set([...TARGET_ROLES.flatMap(r => ROLES[r] as string[]), ...users.flatMap(u => u.groups)])].sort();
  return { company: "Pacific Crest Logistics (ShiftReady lab)", users, groups };
}

// ---------- Export parsing ----------
export type ExportUser = {
  key: string; deleted?: boolean; name?: string; employeeId?: string; accountEnabled?: boolean;
  department?: string | null; jobTitle?: string | null; sessionsValidFrom?: string | null; passwordChanged?: string | null; groups?: string[];
};
export type LabExport = {
  schema: "shiftready-entra-export/1"; exportedAt: string; seededAt: string;
  baseline: Record<string, { sessionsValidFrom: string | null; passwordChanged: string | null }>;
  users: ExportUser[];
};

export class ExportError extends Error {}

export function parseExport(text: string): LabExport {
  let data: any;
  try { data = JSON.parse(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text); }
  catch { throw new ExportError("This file isn't valid JSON. Upload the shiftready-lab-export.json file that Export-ShiftReadyLab.ps1 created."); }
  if (data?.schema !== "shiftready-entra-export/1")
    throw new ExportError("This isn't a ShiftReady lab export. Upload the shiftready-lab-export.json file that Export-ShiftReadyLab.ps1 created.");
  if (!Array.isArray(data.users) || typeof data.baseline !== "object" || !data.baseline)
    throw new ExportError("The export is incomplete. Run Export-ShiftReadyLab.ps1 again and upload the new file.");
  const missing = LAB_USERS.filter(k => !data.users.some((u: ExportUser) => u?.key === k));
  if (missing.length) throw new ExportError(`The export is missing ${missing.join(", ")}. Run Export-ShiftReadyLab.ps1 again from the folder that holds shiftready-lab-state.json.`);
  return data as LabExport;
}

// ---------- Grading ----------
export type Check = { pass: boolean; label: string; pts: number; detail: string };
export type TicketResult = { id: string; title: string; lesson: string; checks: Check[]; score: number; max: number };
export type LabResult = { tickets: TicketResult[]; score: number; max: number; exportedAt: string };

const later = (now?: string | null, before?: string | null) => !!now && (!before || Date.parse(now) > Date.parse(before));

export function gradeExport(exp: LabExport): LabResult {
  const users = buildUsers();
  const deleted = new Set<string>();
  for (const e of exp.users) {
    const u = users[e.key]; if (!u) continue;
    if (e.deleted) { deleted.add(e.key); continue; }
    const base = exp.baseline[e.key] ?? { sessionsValidFrom: null, passwordChanged: null };
    Object.assign(u, {
      enabled: !!e.accountEnabled, dept: e.department ?? "", title: e.jobTitle ?? "", groups: [...(e.groups ?? [])],
      revoked: later(e.sessionsValidFrom, base.sessionsValidFrom), pwReset: later(e.passwordChanged, base.passwordChanged),
    });
  }
  const prev = S;
  setState({ users, tickets: {}, log: [], active: null, clock: 480, grc: {} });
  try {
    const tickets = LAB_TICKETS.map(id => {
      const t = TK[id];
      let checks: Check[] = t.grade({ esc: [] });
      const gone = t.users.filter((k: string) => deleted.has(k));
      if (gone.length) checks = checks.map(c => ({ ...c, pass: false,
        detail: `${gone.map((k: string) => users[k].name).join(", ")} was deleted. Policy disables accounts instead, so access stays auditable.` }));
      const max = checks.reduce((s, c) => s + c.pts, 0);
      return { id, title: t.title, lesson: t.lesson, checks, max, score: checks.reduce((s, c) => s + (c.pass ? c.pts : 0), 0) };
    });
    return { tickets, exportedAt: exp.exportedAt, score: tickets.reduce((s, t) => s + t.score, 0), max: tickets.reduce((s, t) => s + t.max, 0) };
  } finally { setState(prev); }
}
