// Entra ID lab: the seed script's data matches the simulator, and exports grade like the app does.
import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { labSpec, parseExport, gradeExport, ExportError, LAB_TICKETS, type LabExport, type ExportUser } from "../src/app/lab/entra";
import { ROLES } from "../src/engine/company.js";

const T0 = "2026-10-05T14:00:00.0000000Z", T1 = "2026-10-05T15:30:00.0000000Z";
const spec = labSpec();

// An export of the tenant exactly as seeded, with optional per-user changes.
function exportOf(changes: Record<string, Partial<ExportUser>> = {}): LabExport {
  return {
    schema: "rolevara-entra-export/1", exportedAt: T1, seededAt: T0,
    baseline: Object.fromEntries(spec.users.map(u => [u.key, { sessionsValidFrom: T0, passwordChanged: T0 }])),
    users: spec.users.map(u => ({
      key: u.key, name: u.name, employeeId: u.empId, accountEnabled: u.enabled, department: u.dept, jobTitle: u.title,
      sessionsValidFrom: T0, passwordChanged: T0, groups: [...u.groups], ...changes[u.key],
    })),
  };
}

const PERFECT = {
  "maria.lopez": { accountEnabled: true, groups: ROLES["Finance|AP Clerk"] },
  "robert.hayes": { accountEnabled: false, groups: [], sessionsValidFrom: T1 },
  "tanya.wright": { department: "Operations", jobTitle: "Dispatcher", groups: ROLES["Operations|Dispatcher"] },
  "sofia.ramirez": { accountEnabled: true, department: "HR", jobTitle: "HR Generalist", groups: ROLES["HR|HR Generalist"], passwordChanged: T1 },
  "rachel.adams": { accountEnabled: false },
  "ethan.moore": { accountEnabled: true, groups: ROLES["Operations|Dispatcher"] },
};

describe("Entra ID lab", () => {
  test("seed script data matches the simulator", () => {
    const ps1 = readFileSync("lab-files/entra/Seed-RolevaraLab.ps1", "utf8");
    const json = ps1.match(/# BEGIN LAB DATA\r?\n\$Lab = @'\r?\n(.*)\r?\n'@/)?.[1];
    expect(JSON.parse(json!)).toEqual(spec);
  });

  test("every group a ticket needs exists in the lab", () => {
    for (const r of ["Finance|AP Clerk", "Operations|Dispatcher", "HR|HR Generalist", "Sales|Account Executive"])
      for (const g of ROLES[r]) expect(spec.groups).toContain(g);
  });

  test("a correctly worked tenant scores full marks", () => {
    const r = gradeExport(exportOf(PERFECT));
    expect(r.tickets.map(t => t.id)).toEqual([...LAB_TICKETS]);
    for (const t of r.tickets) expect(t.checks.filter(c => !c.pass), t.id).toEqual([]);
    expect(r.score).toBe(r.max);
  });

  test("an untouched tenant fails the work that wasn't done", () => {
    const r = gradeExport(exportOf());
    expect(r.score).toBeLessThan(r.max);
    const leaver = r.tickets.find(t => t.id === "REQ0018850")!;
    expect(leaver.checks.every(c => !c.pass)).toBe(true);
    expect(leaver.checks[2].detail).toMatch(/Still in: GRP-All-Staff/);
  });

  test("copying Bob's access and skipping the session revoke are caught", () => {
    const bob = spec.users.find(u => u.key === "bob.turner")!.groups;
    const r = gradeExport(exportOf({ ...PERFECT, "ethan.moore": { accountEnabled: true, groups: bob }, "robert.hayes": { accountEnabled: false, groups: [] } }));
    const ethan = r.tickets.find(t => t.id === "REQ0018881")!;
    expect(ethan.checks.map(c => c.pass)).toEqual([true, false, false]);
    expect(ethan.checks[1].detail).toMatch(/Extra: APP-SAP-AP-Entry, APP-Finance-Reports/);
    expect(r.tickets.find(t => t.id === "REQ0018850")!.checks.map(c => c.pass)).toEqual([true, false, true]);
  });

  test("deleting a leaver instead of disabling fails the ticket", () => {
    const exp = exportOf(PERFECT);
    exp.users = exp.users.map(u => u.key === "robert.hayes" ? { key: u.key, deleted: true } : u);
    const leaver = gradeExport(exp).tickets.find(t => t.id === "REQ0018850")!;
    expect(leaver.score).toBe(0);
    expect(leaver.checks[0].detail).toMatch(/Robert Hayes was deleted/);
  });

  test("grading leaves the learner's simulator state alone", async () => {
    const store = await import("../src/engine/store.js");
    const mine = { users: {}, tickets: {}, log: [] };
    store.setState(mine);
    gradeExport(exportOf(PERFECT));
    expect(store.S).toBe(mine);
  });

  test("parses a PowerShell 5.1 file with a byte-order mark, and rejects other files", () => {
    expect(parseExport(String.fromCharCode(0xfeff) + JSON.stringify(exportOf())).users).toHaveLength(7);
    expect(() => parseExport("not json")).toThrow(ExportError);
    // Exports made before the product was renamed still grade.
    expect(parseExport(JSON.stringify({ ...exportOf(), schema: "shiftready-entra-export/1" })).users).toHaveLength(7);
    expect(parseExport(JSON.stringify({ ...exportOf(), schema: "verdelit-entra-export/1" })).users).toHaveLength(7);
    expect(() => parseExport('{"schema":"other"}')).toThrow(/isn't a Rolevara lab export/);
    const partial = exportOf(); partial.users = partial.users.slice(1);
    expect(() => parseExport(JSON.stringify(partial))).toThrow(/missing maria.lopez/);
  });
});
