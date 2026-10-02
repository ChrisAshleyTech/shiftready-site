// Okta lab: names, official resource links and grading. The step-by-step guide and scripts are
// served from lab-files/okta/ to browsers with lab access only, never bundled with the site.
import { gradeOktaExport, parseOktaExport } from "../../lab/okta";
import type { LabGuide } from "./shared";

const RESOURCES = [
  ["Okta Integrator Free Plan", "https://developer.okta.com/signup/", "A free org for building and practice."],
  ["Create an API token", "https://developer.okta.com/docs/guides/create-an-api-token/main/", "Tokens carry the permissions of the admin who creates them."],
  ["Read-only administrators", "https://help.okta.com/en-us/content/topics/security/administrators-read-only-admin.htm", "The role the check token should come from."],
  ["User states", "https://help.okta.com/en-us/content/topics/users-groups-profiles/usgp-end-user-states.htm", "Staged, active, suspended and deactivated."],
  ["Manage groups", "https://help.okta.com/en-us/content/topics/users-groups-profiles/usgp-groups-main.htm", "Adding and removing members."],
  ["System Log", "https://help.okta.com/en-us/content/topics/reports/syslog.htm", "Where session clears and resets are recorded."],
  ["Installing PowerShell", "https://learn.microsoft.com/en-us/powershell/scripting/install/installing-powershell", "PowerShell 7 for Windows, macOS and Linux."],
] as const;

export const OKTA: LabGuide = {
  id: "okta", name: "Okta lab", vendor: "Okta",
  sub: "Work six Pacific Crest tickets in a free Okta Integrator org, then grade a read-only check in your browser.",
  resources: RESOURCES,
  upload: { file: "rolevara-okta-export.json", script: "Check-RolevaraOktaLab.ps1", grade: text => gradeOktaExport(parseOktaExport(text)) },
};
