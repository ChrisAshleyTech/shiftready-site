// AWS IAM lab: names, official resource links and grading. The step-by-step guide and scripts are
// served from lab-files/aws/ to browsers with lab access only, never bundled with the site.
import { gradeAwsExport, parseAwsExport } from "../../lab/aws";
import type { LabGuide } from "./shared";

const RESOURCES = [
  ["AWS Free Tier", "https://aws.amazon.com/free/", "A free account for practice."],
  ["AWS CloudShell", "https://docs.aws.amazon.com/cloudshell/latest/userguide/welcome.html", "A browser shell with your console credentials."],
  ["Manage IAM user console access", "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_passwords_admin-change-user.html", "Enabling, resetting and disabling console passwords."],
  ["Manage access keys", "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html", "Deactivating and deleting a user's keys."],
  ["Add and remove users in a group", "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_groups_manage_add-remove-users.html", "Group membership in the IAM console."],
  ["Tag IAM users", "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_tags_users.html", "Where department and job title live in this lab."],
  ["What is CloudFormation?", "https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html", "How the lab is seeded and removed."],
] as const;

export const AWS: LabGuide = {
  id: "aws", name: "AWS IAM lab", vendor: "Amazon Web Services",
  sub: "Work six Pacific Crest tickets in a free-tier AWS account, then grade a read-only check in your browser.",
  resources: RESOURCES,
  upload: { file: "rolevara-aws-export.json", script: "check_rolevara_lab.py", grade: text => gradeAwsExport(parseAwsExport(text)) },
};
