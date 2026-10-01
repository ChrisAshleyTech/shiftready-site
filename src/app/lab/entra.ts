// Entra ID lab: parsing and grading of the read-only export from Export-RolevaraLab.ps1.
import { ExportError, gradeState, labSpec, later, readJson, requireUsers, LAB_TICKETS, type LabResult } from "./core";

export { ExportError, labSpec, LAB_TICKETS };
export type { Check, LabResult, LabSpec, LabUser, TicketResult } from "./core";

export type ExportUser = {
  key: string; deleted?: boolean; name?: string; employeeId?: string; accountEnabled?: boolean;
  department?: string | null; jobTitle?: string | null; sessionsValidFrom?: string | null; passwordChanged?: string | null; groups?: string[];
};
export type LabExport = {
  schema: "rolevara-entra-export/1" | "verdelit-entra-export/1" | "shiftready-entra-export/1"; exportedAt: string; seededAt: string;
  baseline: Record<string, { sessionsValidFrom: string | null; passwordChanged: string | null }>;
  users: ExportUser[];
};

export function parseExport(text: string): LabExport {
  const data = readJson(text, "Upload the rolevara-lab-export.json file that Export-RolevaraLab.ps1 created.");
  // Exports made under the earlier product names (verdelit-, shiftready-) still grade.
  if (!["rolevara-entra-export/1", "verdelit-entra-export/1", "shiftready-entra-export/1"].includes(data?.schema))
    throw new ExportError("This isn't a Rolevara lab export. Upload the rolevara-lab-export.json file that Export-RolevaraLab.ps1 created.");
  if (!Array.isArray(data.users) || typeof data.baseline !== "object" || !data.baseline)
    throw new ExportError("The export is incomplete. Run Export-RolevaraLab.ps1 again and upload the new file.");
  requireUsers(data.users, "Run Export-RolevaraLab.ps1 again from the folder that holds rolevara-lab-state.json.");
  return data as LabExport;
}

export function gradeExport(exp: LabExport): LabResult {
  return gradeState(exp.users.map(e => {
    if (e.deleted) return { key: e.key, deleted: true };
    const base = exp.baseline[e.key] ?? { sessionsValidFrom: null, passwordChanged: null };
    return {
      key: e.key, enabled: !!e.accountEnabled, dept: e.department ?? "", title: e.jobTitle ?? "", groups: e.groups ?? [],
      revoked: later(e.sessionsValidFrom, base.sessionsValidFrom), pwReset: later(e.passwordChanged, base.passwordChanged),
    };
  }), exp.exportedAt);
}
