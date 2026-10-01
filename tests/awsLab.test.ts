// AWS IAM lab: the CloudFormation template matches the simulator, and checks grade like the app does.
import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { labSpec, ExportError } from "../src/app/lab/core";
import { awsTemplate, parseAwsExport, gradeAwsExport, AWS_KEY_USERS, type AwsExport, type AwsUser } from "../src/app/lab/aws";
import { ROLES } from "../src/engine/company.js";

const T0 = "2026-10-05T14:00:00+00:00", T1 = "2026-10-05T15:30:00+00:00", BEFORE = "2026-10-05T13:59:30+00:00";
const spec = labSpec();

function exportOf(changes: Record<string, Partial<AwsUser>> = {}): AwsExport {
  return {
    schema: "rolevara-aws-export/1", exportedAt: T1, seededAt: T0,
    users: spec.users.map(u => ({
      key: u.key, name: u.name, employeeId: u.empId, consoleAccess: u.enabled, loginProfileCreated: u.enabled ? BEFORE : null,
      activeAccessKeys: AWS_KEY_USERS.includes(u.key) ? 1 : 0, department: u.dept, jobTitle: u.title, groups: [...u.groups], ...changes[u.key],
    })),
  };
}

const PERFECT: Record<string, Partial<AwsUser>> = {
  "maria.lopez": { consoleAccess: true, loginProfileCreated: T1, groups: ROLES["Finance|AP Clerk"] },
  "robert.hayes": { consoleAccess: false, loginProfileCreated: null, activeAccessKeys: 0, groups: [] },
  "tanya.wright": { department: "Operations", jobTitle: "Dispatcher", groups: ROLES["Operations|Dispatcher"] },
  "sofia.ramirez": { consoleAccess: true, loginProfileCreated: T1, department: "HR", jobTitle: "HR Generalist", groups: ROLES["HR|HR Generalist"] },
  "rachel.adams": { consoleAccess: false, loginProfileCreated: null },
  "ethan.moore": { consoleAccess: true, loginProfileCreated: T1, groups: ROLES["Operations|Dispatcher"] },
};

describe("AWS IAM lab", () => {
  test("the CloudFormation template file is generated from the simulator", () => {
    expect(JSON.parse(readFileSync("lab-files/aws/rolevara-lab-aws.json", "utf8"))).toEqual(awsTemplate());
  });

  test("the template seeds the lab users and groups, with no permissions and no secrets", () => {
    const t = awsTemplate();
    const res = Object.values(t.Resources) as any[];
    const users = res.filter(r => r.Type === "AWS::IAM::User").map(r => r.Properties);
    expect(users.map(u => u.UserName)).toEqual(spec.users.map(u => u.alias));
    expect(res.filter(r => r.Type === "AWS::IAM::Group").map(r => r.Properties.GroupName)).toEqual(spec.groups);
    for (const u of users) {
      const s = spec.users.find(x => x.alias === u.UserName)!;
      expect(!!u.LoginProfile, u.UserName).toBe(s.enabled);
      expect(u.Path).toBe("/rolevara-lab/");
      expect(u.Tags).toContainEqual({ Key: "rolevara-lab", Value: "pacific-crest" });
      expect(u.Tags).toContainEqual({ Key: "Department", Value: s.dept });
    }
    const types = new Set(res.map(r => r.Type));
    expect([...types].sort()).toEqual(["AWS::IAM::AccessKey", "AWS::IAM::Group", "AWS::IAM::User"]);
    expect(JSON.stringify(t)).not.toMatch(/Polic|Password":\s*"/);
    expect(t.Parameters.LabPassword.NoEcho).toBe(true);
  });

  test("a correctly worked account scores full marks", () => {
    const r = gradeAwsExport(exportOf(PERFECT));
    for (const t of r.tickets) expect(t.checks.filter(c => !c.pass), t.id).toEqual([]);
    expect(r.score).toBe(r.max);
  });

  test("an untouched account fails the work that wasn't done", () => {
    const r = gradeAwsExport(exportOf());
    expect(r.score).toBeLessThan(r.max);
    expect(r.tickets.find(t => t.id === "REQ0018850")!.checks.every(c => !c.pass)).toBe(true);
  });

  test("leaving the leaver's access key active fails the session check", () => {
    const r = gradeAwsExport(exportOf({ ...PERFECT, "robert.hayes": { ...PERFECT["robert.hayes"], activeAccessKeys: 1 } }));
    expect(r.tickets.find(t => t.id === "REQ0018850")!.checks.map(c => c.pass)).toEqual([true, false, true]);
  });

  test("only console access set up after seeding counts as a new password", () => {
    const r = gradeAwsExport(exportOf({ ...PERFECT, "sofia.ramirez": { ...PERFECT["sofia.ramirez"], loginProfileCreated: BEFORE } }));
    expect(r.tickets.find(t => t.id === "REQ0018870")!.checks.at(-1)!.pass).toBe(false);
  });

  test("rejects other files", () => {
    expect(() => parseAwsExport("{")).toThrow(ExportError);
    expect(() => parseAwsExport(JSON.stringify({ ...exportOf(), schema: "rolevara-okta-export/1" }))).toThrow(/isn't a Rolevara AWS lab export/);
    const partial = exportOf(); partial.users = partial.users.slice(2);
    expect(() => parseAwsExport(JSON.stringify(partial))).toThrow(/missing maria.lopez, robert.hayes/);
  });
});
