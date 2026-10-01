// Okta lab guide: seed a free Okta Integrator org with PowerShell 7 and the Okta API, work six
// Monday tickets in the Admin Console, run a read-only check with a read-only admin's token and
// grade it in the browser.
import { type ReactNode } from "react";
import { labSpec } from "../../lab/core";
import { gradeOktaExport, parseOktaExport, OKTA_DOMAIN } from "../../lab/okta";
import { Code, Ext, Mono, Scripts, Step, TicketList, type LabGuide } from "./shared";

const SCRIPTS = [
  ["Seed-RolevaraOktaLab.ps1", "Creates the 7 lab users and 9 groups. Asks you to confirm the org first."],
  ["Check-RolevaraOktaLab.ps1", "Read-only (GET requests only). Writes rolevara-okta-export.json for grading."],
  ["Remove-RolevaraOktaLab.ps1", "Deletes only the tagged lab users and groups."],
] as const;

const TODO: Record<string, string> = {
  REQ0018841: "Activate Maria Lopez and add her to exactly the AP Clerk groups.",
  REQ0018850: "Offboard Robert Hayes: remove every group, clear his user sessions, then deactivate him.",
  REQ0018852: "Move Tanya Wright to Operations / Dispatcher: edit Department and Title in her profile, swap Sales groups for Dispatcher groups.",
  REQ0018870: "Rehire Sofia Ramirez as HR / HR Generalist: activate her (her old password stops working), update her profile, remove old access, add the new role's groups.",
  REQ0018879: "Put Rachel Adams on leave: suspend her and keep her groups.",
  REQ0018881: "Provision Ethan Moore as a Dispatcher from the access matrix: activate him and add the Dispatcher groups, not Bob Turner's.",
};

const ORG = "https://integrator-1234567.okta.com";

function Setup() {
  return (
    <ol className="space-y-7">
      <Step n={1} title="Get a free Okta Integrator org">
        <p>Sign up for the Okta Integrator Free Plan. It gives you an org of your own for practice. <b>Never run the scripts in an employer's org.</b> The seed script stops if an org has more than 50 users.</p>
        <p className="text-sm text-muted-foreground">Sign up at <Ext href="https://developer.okta.com/signup/">developer.okta.com/signup</Ext>. Your org URL looks like <Mono>{ORG}</Mono>.</p>
      </Step>
      <Step n={2} title="Create a Super Administrator token for seeding">
        <p>Signed in as the org's first admin (a Super Administrator), open <b>Security &gt; API &gt; Tokens</b> and create a token named <Mono>rolevara-seed</Mono>. Okta shows it once. Seeding and cleanup use it; the scripts never save it.</p>
        <p className="text-sm text-muted-foreground">See <Ext href="https://developer.okta.com/docs/guides/create-an-api-token/main/">Create an API token</Ext>.</p>
      </Step>
      <Step n={3} title="Create a read-only admin token for checks">
        <p>A token has exactly the permissions of the admin who creates it, so grading uses a read-only one. Add a person for yourself (a plus address such as <Mono>you+readonly@…</Mono> works), assign them the <b>Read-Only Administrator</b> role under <b>Security &gt; Administrators</b>, sign in as them in a private window, and create a token named <Mono>rolevara-check</Mono>.</p>
        <p className="text-sm text-muted-foreground">See <Ext href="https://help.okta.com/en-us/content/topics/security/administrators-read-only-admin.htm">Read-only administrators</Ext>.</p>
      </Step>
      <Step n={4} title="Install PowerShell 7">
        <p>The scripts need PowerShell 7 on Windows, macOS or Linux, and no extra modules.</p>
        <p className="text-sm text-muted-foreground">See <Ext href="https://learn.microsoft.com/en-us/powershell/scripting/install/installing-powershell">Installing PowerShell</Ext>.</p>
      </Step>
      <Step n={5} title="Download the scripts into one folder">
        <Scripts lab="okta" files={SCRIPTS} />
        <p className="text-sm text-muted-foreground">Read the scripts before you run them. Each one explains what it does at the top.</p>
      </Step>
    </ol>
  );
}

function Run() {
  const spec = labSpec();
  return (
    <ol className="space-y-7">
      <Step n={1} title="Seed the org">
        <p>In PowerShell 7 (<Mono>pwsh</Mono>), go to the folder with the scripts. Paste the <b>Super Administrator</b> token when asked (input is hidden), preview with <Mono>-WhatIf</Mono>, then run the seed with your org URL:</p>
        <Code>{`$env:OKTA_API_TOKEN = Read-Host "Super admin token" -MaskInput\n.\\Seed-RolevaraOktaLab.ps1 -OrgUrl ${ORG} -WhatIf\n.\\Seed-RolevaraOktaLab.ps1 -OrgUrl ${ORG}`}</Code>
        <p>The script shows the org and asks you to type its subdomain. It then creates {spec.users.length} users (sign-in names end in <Mono>@{OKTA_DOMAIN}</Mono>, which never receives mail) and {spec.groups.length} groups, and saves <Mono>rolevara-okta-state.json</Mono> in the same folder. Keep that file.</p>
      </Step>
      <Step n={2} title="Work the six tickets in the Okta Admin Console">
        <p>Open your org's Admin Console and go to <b>Directory &gt; People</b> and <b>Directory &gt; Groups</b>. Clear a user's sessions from their profile under <b>More Actions</b>. The access matrix and runbook are on the <a href="#/policy" className="font-medium text-primary-strong underline underline-offset-2">Policy &amp; matrix</a> page.</p>
        <TicketList todo={TODO} />
      </Step>
      <Step n={3} title="Check the results with the read-only token">
        <p>Switch to the <b>Read-Only Administrator</b> token. The check sends only GET requests, reads only the lab users and their System Log events, and writes <Mono>rolevara-okta-export.json</Mono>:</p>
        <Code>{`$env:OKTA_API_TOKEN = Read-Host "Read-only admin token" -MaskInput\n.\\Check-RolevaraOktaLab.ps1`}</Code>
        <p>Then open the <b>Upload results</b> tab. You can fix things in Okta and check again as often as you like.</p>
      </Step>
      <Step n={4} title="Clean up when you're done">
        <p>With the Super Administrator token again, this deactivates and deletes only the users and groups the seed created, and only while they still carry the lab tag. Then revoke both tokens under <b>Security &gt; API &gt; Tokens</b>.</p>
        <Code>{`$env:OKTA_API_TOKEN = Read-Host "Super admin token" -MaskInput\n.\\Remove-RolevaraOktaLab.ps1 -WhatIf\n.\\Remove-RolevaraOktaLab.ps1`}</Code>
      </Step>
    </ol>
  );
}

const TROUBLE: [string, ReactNode][] = [
  ["\"Running scripts is disabled on this system\" (Windows)", <>Run <code className="font-mono">Unblock-File .\*.ps1</code>, then allow scripts for this window only: <code className="font-mono">Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass</code>.</>],
  ["\"#Requires\" or \"-MaskInput\" errors", <>The scripts need PowerShell 7. Start <code className="font-mono">pwsh</code>, not Windows PowerShell 5.1.</>],
  ["\"Okta returned 401\"", <>The token is wrong, revoked or expired (unused tokens expire after 30 days), or it belongs to another org. Create a new one in the same org as <code className="font-mono">-OrgUrl</code>.</>],
  ["\"Okta returned 403\" while seeding", <>The token was created by an admin without enough rights. Seeding and cleanup need a token created by a Super Administrator.</>],
  ["\"This org has N users\"", <>The seed stops on orgs with more than 50 users so it can't touch a real organization. If the org really is a lab, run it with <code className="font-mono">-LabTenant</code>.</>],
  ["\"A group named … already exists\" or \"A user … already exists\"", <>A previous lab is still there. Run <code className="font-mono">.\Remove-RolevaraOktaLab.ps1</code> from the folder with the state file, then seed again.</>],
  ["Clearing sessions or a new password didn't count", <>Both are read from the System Log, which can take a minute to show new events. Wait, then run the check again. For Sofia, activating her after the seed counts: Okta sends a fresh activation link and her old password stops working.</>],
  ["The check says a user \"was not found\"", <>The user was deleted. Okta deletes are permanent, and the runbook deactivates instead, so that ticket scores 0. Remove the lab and seed it again to retry.</>],
  ["The upload says the file isn't a lab export", <>Upload <code className="font-mono">rolevara-okta-export.json</code>, not the state file. If you edited it, run the check again.</>],
];

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
  sub: "Work six Pacific Crest Monday tickets in a free Okta Integrator org, then grade a read-only check in your browser.",
  setup: Setup, run: Run, trouble: TROUBLE, resources: RESOURCES,
  upload: { file: "rolevara-okta-export.json", script: "Check-RolevaraOktaLab.ps1", grade: text => gradeOktaExport(parseOktaExport(text)) },
};
