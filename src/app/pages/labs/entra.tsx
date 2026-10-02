// Microsoft Entra ID lab: names, official resource links and grading. The step-by-step guide and scripts are
// served from lab-files/entra/ to browsers with lab access only, never bundled with the site.
import { gradeExport, parseExport } from "../../lab/entra";
import type { LabGuide } from "./shared";

const RESOURCES = [
  ["Microsoft 365 Developer Program", "https://developer.microsoft.com/microsoft-365/dev-program", "A free developer tenant, if you qualify."],
  ["Azure free account", "https://azure.microsoft.com/free/", "Includes Microsoft Entra ID Free."],
  ["Create a new tenant", "https://learn.microsoft.com/en-us/entra/fundamentals/create-new-tenant", "A separate tenant keeps the lab away from real users."],
  ["Install Microsoft Graph PowerShell", "https://learn.microsoft.com/en-us/powershell/microsoftgraph/installation", "The scripts use the Graph PowerShell SDK."],
  ["Microsoft Entra admin center", "https://entra.microsoft.com/", "Where you work the tickets."],
  ["Revoke user access", "https://learn.microsoft.com/en-us/entra/identity/users/users-revoke-access", "Microsoft's guidance for leavers."],
  ["Manage groups", "https://learn.microsoft.com/en-us/entra/fundamentals/how-to-manage-groups", "Adding and removing members."],
  ["Entra built-in roles", "https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/permissions-reference", "Which admin roles can do what."],
] as const;

export const ENTRA: LabGuide = {
  id: "entra", name: "Microsoft Entra ID lab", vendor: "Microsoft",
  sub: "Work six Pacific Crest tickets in a real Microsoft Entra tenant, then grade a read-only export in your browser.",
  resources: RESOURCES,
  upload: { file: "rolevara-lab-export.json", script: "Export-RolevaraLab.ps1", grade: text => gradeExport(parseExport(text)) },
};
