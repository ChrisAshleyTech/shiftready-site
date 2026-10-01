// Microsoft Entra ID lab guide: seed a lab tenant with PowerShell, work six Monday tickets in the
// Entra admin center, export read-only results and grade them in the browser.
import { type ReactNode } from "react";
import { gradeExport, labSpec, parseExport } from "../../lab/entra";
import { Code, Ext, Mono, Scripts, Step, TicketList, type LabGuide } from "./shared";

const SCRIPTS = [
  ["Seed-RolevaraLab.ps1", "Creates the 7 lab users and 9 groups. Asks you to confirm the tenant first."],
  ["Export-RolevaraLab.ps1", "Read-only. Writes rolevara-lab-export.json for grading."],
  ["Remove-RolevaraLab.ps1", "Deletes only the tagged lab users and groups."],
] as const;

// What each ticket asks for in Entra terms. The grading itself comes from the simulator.
const TODO: Record<string, string> = {
  REQ0018841: "Enable Maria Lopez and add exactly the AP Clerk groups.",
  REQ0018850: "Offboard Robert Hayes: disable the account, revoke sessions, and remove every group.",
  REQ0018852: "Move Tanya Wright to Operations / Dispatcher: update job info, swap Sales groups for Dispatcher groups.",
  REQ0018870: "Rehire Sofia Ramirez as HR / HR Generalist: enable, reset the password, remove old access, add the new role's groups.",
  REQ0018879: "Put Rachel Adams on leave: disable the account and keep her groups.",
  REQ0018881: "Provision Ethan Moore as a Dispatcher from the access matrix, not from Bob Turner's access.",
};

function Setup() {
  return (
    <ol className="space-y-7">
      <Step n={1} title="Get a lab tenant">
        <p>Use a tenant you own for practice: a Microsoft 365 developer tenant, or a new tenant created from an Azure free account. <b>Never run the scripts in an employer's tenant.</b> The seed script stops if a tenant has more than 50 users.</p>
        <p className="text-sm text-muted-foreground">See <Ext href="https://learn.microsoft.com/en-us/entra/fundamentals/create-new-tenant">Create a new tenant</Ext> in Microsoft's documentation.</p>
      </Step>
      <Step n={2} title="Use an admin account in that tenant">
        <p>You need to create users and groups: User Administrator plus Groups Administrator, or Global Administrator. The account that creates a new tenant is a Global Administrator.</p>
      </Step>
      <Step n={3} title="Install Microsoft Graph PowerShell">
        <p>PowerShell 7 is recommended. Windows PowerShell 5.1 also works. Install just the four modules the scripts use:</p>
        <Code>Install-Module Microsoft.Graph.Authentication, Microsoft.Graph.Users, Microsoft.Graph.Groups, Microsoft.Graph.Identity.DirectoryManagement -Scope CurrentUser</Code>
      </Step>
      <Step n={4} title="Download the scripts into one folder">
        <Scripts lab="entra" files={SCRIPTS} />
        <p className="text-sm text-muted-foreground">Read the scripts before you run them. Each one explains what it does at the top.</p>
      </Step>
    </ol>
  );
}

function Run() {
  const spec = labSpec();
  return (
    <ol className="space-y-7">
      <Step n={1} title="Seed the tenant">
        <p>In PowerShell, go to the folder with the scripts. Unblock them (downloaded files are blocked by default), preview with <Mono>-WhatIf</Mono>, then run the seed:</p>
        <Code>{"Unblock-File .\\*.ps1\n.\\Seed-RolevaraLab.ps1 -WhatIf\n.\\Seed-RolevaraLab.ps1"}</Code>
        <p>Sign in with your lab admin account and accept the permissions prompt. The script shows the tenant name and asks you to type its domain. It then creates {spec.users.length} users in {spec.company} and {spec.groups.length} security groups, and saves <Mono>rolevara-lab-state.json</Mono> in the same folder. Keep that file.</p>
      </Step>
      <Step n={2} title="Work the six tickets in the Entra admin center">
        <p>Open <Ext href="https://entra.microsoft.com/">entra.microsoft.com</Ext> and go to <b>Users</b> and <b>Groups</b>. The access matrix and runbook are on the <a href="#/policy" className="font-medium text-primary-strong underline underline-offset-2">Policy &amp; matrix</a> page.</p>
        <TicketList todo={TODO} />
      </Step>
      <Step n={3} title="Export the results">
        <p>The export signs in with read-only permissions and reads only the lab users. It writes <Mono>rolevara-lab-export.json</Mono>:</p>
        <Code>{".\\Export-RolevaraLab.ps1"}</Code>
        <p>Then open the <b>Upload results</b> tab. You can fix things in Entra and export again as often as you like.</p>
      </Step>
      <Step n={4} title="Clean up when you're done">
        <p>This deletes only the users and groups the seed created, and only while they still carry the lab tag. Add <Mono>-Purge</Mono> to also empty them from the recycle bin.</p>
        <Code>{".\\Remove-RolevaraLab.ps1 -WhatIf\n.\\Remove-RolevaraLab.ps1"}</Code>
      </Step>
    </ol>
  );
}

const TROUBLE: [string, ReactNode][] = [
  ["\"Running scripts is disabled on this system\"", <>Run <code className="font-mono">Unblock-File .\*.ps1</code>, then allow scripts for this PowerShell window only: <code className="font-mono">Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass</code>. See <Ext href="https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_execution_policies">about Execution Policies</Ext>.</>],
  ["\"The Microsoft.Graph… module is missing\"", <>Run the install command on the Setup tab. In Windows PowerShell 5.1, install only those four modules rather than the full Microsoft.Graph module, which can exceed 5.1's function limit.</>],
  ["The sign-in asks for admin approval", <>Sign in with an admin of the lab tenant. The first run asks you to consent to permissions for Microsoft Graph Command Line Tools.</>],
  ["\"This tenant has N users\"", <>The seed stops on tenants with more than 50 users so it can't touch a real organization. If the tenant really is a lab, run it with <code className="font-mono">-LabTenant</code>.</>],
  ["\"A group named … already exists\" or \"A user … already exists\"", <>A previous lab is still there. Run <code className="font-mono">.\Remove-RolevaraLab.ps1</code> from the folder with the state file, or delete those objects in the admin center, then seed again.</>],
  ["\"Insufficient privileges to complete the operation\"", <>Your account needs User Administrator and Groups Administrator, or Global Administrator. See <Ext href="https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/permissions-reference">Entra built-in roles</Ext>.</>],
  ["Revoking sessions or resetting a password didn't count", <>These are read from timestamps that can take a minute to update. Wait, then run the export again.</>],
  ["The export says a user \"was not found\"", <>The user was deleted. The runbook disables accounts instead, so that ticket scores 0. Remove the lab and seed it again to retry.</>],
  ["The upload says the file isn't a lab export", <>Upload <code className="font-mono">rolevara-lab-export.json</code>, not the state file. If you edited it, export again.</>],
];

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
  sub: "Work six Pacific Crest Monday tickets in a real Microsoft Entra tenant, then grade a read-only export in your browser.",
  setup: Setup, run: Run, trouble: TROUBLE, resources: RESOURCES,
  upload: { file: "rolevara-lab-export.json", script: "Export-RolevaraLab.ps1", grade: text => gradeExport(parseExport(text)) },
};
