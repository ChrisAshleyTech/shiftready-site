// Okta lab: the seed script's data matches the simulator, and checks grade like the app does.
import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { labSpec, ExportError, LAB_TICKETS } from "../src/app/lab/core";
import { parseOktaExport, gradeOktaExport, oktaEnabled, type OktaExport, type OktaUser } from "../src/app/lab/okta";
import { ROLES } from "../src/engine/company.js";

const T0 = "2026-10-05T14:00:00.000Z", T1 = "2026-10-05T15:30:00.000Z";
const spec = labSpec();
const seeded = (enabled: boolean, groups: string[]) => (enabled ? "ACTIVE" : groups.length ? "DEPROVISIONED" : "STAGED");

function exportOf(changes: Record<string, Partial<OktaUser>> = {}): OktaExport {
  return {
    schema: "rolevara-okta-export/1", exportedAt: T1, seededAt: T0,
    baseline: Object.fromEntries(spec.users.map(u => [u.key, { passwordChanged: u.enabled ? T0 : null }])),
    users: spec.users.map(u => ({
      key: u.key, name: u.name, employeeNumber: u.empId, status: seeded(u.enabled, u.groups), department: u.dept, title: u.title,
      passwordChanged: u.enabled ? T0 : null, groups: [...u.groups], events: [], ...changes[u.key],
    })),
  };
}

const PERFECT: Record<string, Partial<OktaUser>> = {
  "maria.lopez": { status: "PROVISIONED", groups: ROLES["Finance|AP Clerk"], events: ["user.lifecycle.activate"] },
  "robert.hayes": { status: "DEPROVISIONED", groups: [], events: ["user.session.clear"] },
  "tanya.wright": { department: "Operations", title: "Dispatcher", groups: ROLES["Operations|Dispatcher"] },
  "sofia.ramirez": { status: "PROVISIONED", department: "HR", title: "HR Generalist", groups: ROLES["HR|HR Generalist"], events: ["user.lifecycle.reactivate"] },
  "rachel.adams": { status: "SUSPENDED" },
  "ethan.moore": { status: "ACTIVE", groups: ROLES["Operations|Dispatcher"], passwordChanged: T1 },
};

describe("Okta lab", () => {
  test("seed script data matches the simulator", () => {
    const ps1 = readFileSync("lab-files/okta/Seed-RolevaraOktaLab.ps1", "utf8");
    const json = ps1.match(/# BEGIN LAB DATA\r?\n\$Lab = @'\r?\n(.*)\r?\n'@/)?.[1];
    expect(JSON.parse(json!)).toEqual(spec);
  });

  test("Okta statuses map to enabled and disabled", () => {
    for (const s of ["ACTIVE", "PROVISIONED", "RECOVERY", "PASSWORD_EXPIRED", "LOCKED_OUT"]) expect(oktaEnabled(s), s).toBe(true);
    for (const s of ["STAGED", "SUSPENDED", "DEPROVISIONED", undefined]) expect(oktaEnabled(s), String(s)).toBe(false);
  });

  test("a correctly worked org scores full marks", () => {
    const r = gradeOktaExport(exportOf(PERFECT));
    expect(r.tickets.map(t => t.id)).toEqual([...LAB_TICKETS]);
    for (const t of r.tickets) expect(t.checks.filter(c => !c.pass), t.id).toEqual([]);
    expect(r.score).toBe(r.max);
  });

  test("an untouched org fails the work that wasn't done", () => {
    const r = gradeOktaExport(exportOf());
    expect(r.score).toBeLessThan(r.max);
    expect(r.tickets.find(t => t.id === "REQ0018850")!.checks.every(c => !c.pass)).toBe(true);
  });

  test("deactivating a leaver without clearing sessions loses the session check", () => {
    const r = gradeOktaExport(exportOf({ ...PERFECT, "robert.hayes": { status: "DEPROVISIONED", groups: [], events: [] } }));
    expect(r.tickets.find(t => t.id === "REQ0018850")!.checks.map(c => c.pass)).toEqual([true, false, true]);
  });

  test("a rehire without a new password loses the password check", () => {
    const r = gradeOktaExport(exportOf({ ...PERFECT, "sofia.ramirez": { ...PERFECT["sofia.ramirez"], events: [] } }));
    const sofia = r.tickets.find(t => t.id === "REQ0018870")!;
    expect(sofia.checks.at(-1)!.pass).toBe(false);
    expect(sofia.score).toBe(sofia.max - 2);
  });

  test("deleting a user fails the ticket", () => {
    const exp = exportOf(PERFECT);
    exp.users = exp.users.map(u => u.key === "robert.hayes" ? { key: u.key, deleted: true } : u);
    const leaver = gradeOktaExport(exp).tickets.find(t => t.id === "REQ0018850")!;
    expect(leaver.score).toBe(0);
    expect(leaver.checks[0].detail).toMatch(/Robert Hayes was deleted/);
  });

  test("rejects other files", () => {
    expect(() => parseOktaExport("nope")).toThrow(ExportError);
    expect(() => parseOktaExport(JSON.stringify({ ...exportOf(), schema: "rolevara-entra-export/1" }))).toThrow(/isn't a Rolevara Okta lab export/);
    const partial = exportOf(); partial.users = partial.users.slice(1);
    expect(() => parseOktaExport(JSON.stringify(partial))).toThrow(/missing maria.lopez/);
    expect(parseOktaExport(String.fromCharCode(0xfeff) + JSON.stringify(exportOf())).users).toHaveLength(7);
  });
});
