// Okta lab: parsing and grading of the read-only export from Check-RolevaraOktaLab.ps1.
import { ExportError, gradeState, later, readJson, requireUsers, type LabResult } from "./core";

export const OKTA_DOMAIN = "pacificcrest.example.com";

// Okta user statuses that can sign in or are on their way to it (activated, pending the user).
// STAGED, DEPROVISIONED and SUSPENDED users can't sign in, which the simulator calls disabled.
const ENABLED = new Set(["ACTIVE", "PROVISIONED", "RECOVERY", "PASSWORD_EXPIRED", "LOCKED_OUT"]);
// System Log events, after seeding, that count as "sessions revoked" and "new password issued".
// Activating a deactivated user sends a fresh activation link and the old password stops working.
const REVOKE_EVENTS = ["user.session.clear"];
const PASSWORD_EVENTS = ["user.account.reset_password", "user.account.expire_password", "user.lifecycle.activate", "user.lifecycle.reactivate"];

export type OktaUser = {
  key: string; deleted?: boolean; name?: string; employeeNumber?: string | null; status?: string;
  department?: string | null; title?: string | null; passwordChanged?: string | null; groups?: string[]; events?: string[];
};
export type OktaExport = {
  schema: "rolevara-okta-export/1"; exportedAt: string; seededAt: string;
  baseline: Record<string, { passwordChanged: string | null }>;
  users: OktaUser[];
};

export const oktaEnabled = (status?: string) => ENABLED.has(status ?? "");

export function parseOktaExport(text: string): OktaExport {
  const data = readJson(text, "Upload the rolevara-okta-export.json file that Check-RolevaraOktaLab.ps1 created.");
  if (data?.schema !== "rolevara-okta-export/1")
    throw new ExportError("This isn't a Rolevara Okta lab export. Upload the rolevara-okta-export.json file that Check-RolevaraOktaLab.ps1 created.");
  if (!Array.isArray(data.users) || typeof data.baseline !== "object" || !data.baseline)
    throw new ExportError("The export is incomplete. Run Check-RolevaraOktaLab.ps1 again and upload the new file.");
  requireUsers(data.users, "Run Check-RolevaraOktaLab.ps1 again from the folder that holds rolevara-okta-state.json.");
  return data as OktaExport;
}

export function gradeOktaExport(exp: OktaExport): LabResult {
  return gradeState(exp.users.map(e => {
    if (e.deleted) return { key: e.key, deleted: true };
    const ev = new Set(e.events ?? []);
    return {
      key: e.key, enabled: oktaEnabled(e.status), dept: e.department ?? "", title: e.title ?? "", groups: e.groups ?? [],
      revoked: REVOKE_EVENTS.some(t => ev.has(t)),
      pwReset: later(e.passwordChanged, exp.baseline[e.key]?.passwordChanged) || PASSWORD_EVENTS.some(t => ev.has(t)),
    };
  }), exp.exportedAt, "Okta deletes are permanent; policy deactivates accounts instead, so access stays auditable.");
}
