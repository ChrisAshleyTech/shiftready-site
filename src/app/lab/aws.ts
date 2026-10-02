// AWS IAM lab: the CloudFormation seed template, and grading of the read-only export from
// check_rolevara_lab.py. In IAM terms an "enabled" user has console access (a login profile),
// "sessions revoked" means no active access keys, and a new password is a login profile created
// after the stack was seeded. Department and job title are user tags.
import { ExportError, gradeState, labSpec, later, readJson, requireUsers, type LabResult } from "./core";

export const AWS_PATH = "/rolevara-lab/";
export const AWS_STACK = "rolevara-lab";
export const AWS_TAG = { Key: "rolevara-lab", Value: "pacific-crest" };
// The one lab user seeded with an access key: the leaver, so offboarding has a key to deactivate.
export const AWS_KEY_USERS = ["robert.hayes"];

const logicalId = (prefix: string, name: string) => prefix + name.replace(/[^A-Za-z0-9]/g, "");

/** The CloudFormation template that seeds the lab (lab-files/aws/rolevara-lab-aws.json). */
export function awsTemplate() {
  const spec = labSpec();
  const resources: Record<string, unknown> = {};
  for (const g of spec.groups) resources[logicalId("Group", g)] = { Type: "AWS::IAM::Group", Properties: { GroupName: g, Path: AWS_PATH } };
  for (const u of spec.users) {
    resources[logicalId("User", u.alias)] = {
      Type: "AWS::IAM::User",
      Properties: {
        UserName: u.alias, Path: AWS_PATH,
        Groups: u.groups.map(g => ({ Ref: logicalId("Group", g) })),
        Tags: [AWS_TAG, { Key: "DisplayName", Value: u.name }, { Key: "EmployeeId", Value: u.empId }, { Key: "Department", Value: u.dept }, { Key: "JobTitle", Value: u.title }],
        ...(u.enabled ? { LoginProfile: { Password: { Ref: "LabPassword" }, PasswordResetRequired: true } } : {}),
      },
    };
  }
  for (const k of AWS_KEY_USERS) resources[logicalId("Key", k)] = { Type: "AWS::IAM::AccessKey", Properties: { UserName: { Ref: logicalId("User", k) }, Status: "Active" } };
  return {
    AWSTemplateFormatVersion: "2010-09-09",
    Description: `${spec.company}. ${spec.users.length} IAM users and ${spec.groups.length} IAM groups with no permissions attached. Generated from the Rolevara simulator; do not edit by hand.`,
    Parameters: {
      LabPassword: { Type: "String", NoEcho: true, MinLength: 20, Description: "Console password for the seeded users that start with console access. seed_rolevara_lab.py generates a random one; nobody signs in as these users." },
    },
    Resources: resources,
  };
}

export type AwsUser = {
  key: string; deleted?: boolean; name?: string | null; employeeId?: string | null; consoleAccess?: boolean; loginProfileCreated?: string | null;
  activeAccessKeys?: number; department?: string | null; jobTitle?: string | null; groups?: string[];
};
export type AwsExport = { schema: "rolevara-aws-export/1"; exportedAt: string; seededAt: string; users: AwsUser[] };

export function parseAwsExport(text: string): AwsExport {
  const data = readJson(text, "Upload the rolevara-aws-export.json file that check_rolevara_lab.py created.");
  if (data?.schema !== "rolevara-aws-export/1")
    throw new ExportError("This isn't a Rolevara AWS lab export. Upload the rolevara-aws-export.json file that check_rolevara_lab.py created.");
  if (!Array.isArray(data.users) || typeof data.seededAt !== "string")
    throw new ExportError("The export is incomplete. Run check_rolevara_lab.py again and upload the new file.");
  requireUsers(data.users, "Run check_rolevara_lab.py again; the lab stack may have been changed or deleted.");
  return data as AwsExport;
}

export function gradeAwsExport(exp: AwsExport): LabResult {
  return gradeState(exp.users.map(e => e.deleted ? { key: e.key, deleted: true } : {
    key: e.key, enabled: !!e.consoleAccess, dept: e.department ?? "", title: e.jobTitle ?? "", groups: e.groups ?? [],
    revoked: (e.activeAccessKeys ?? 0) === 0, pwReset: !!e.consoleAccess && later(e.loginProfileCreated, exp.seededAt),
  }), exp.exportedAt, "Policy removes access instead of deleting the user, so the account stays auditable.");
}
