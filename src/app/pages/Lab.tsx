// Connect your lab: the Microsoft Entra ID lab guide. Seed a lab tenant with PowerShell, work six
// Monday tickets in the Entra admin center, export read-only results and grade them in the browser.
import { useId, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Copy, Download, ExternalLink, FlaskConical, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EarlyAccess } from "@/components/brand/EarlyAccess";
import { TK } from "@/engine/tickets.js";
import { LAB_TICKETS, ExportError, gradeExport, labSpec, parseExport, type LabResult } from "../lab/entra";
import { PageHeader, Checks, SectionLabel, Tag } from "../components/bits";

const SCRIPTS = [
  ["Seed-VerdelitLab.ps1", "Creates the 7 lab users and 9 groups. Asks you to confirm the tenant first."],
  ["Export-VerdelitLab.ps1", "Read-only. Writes verdelit-lab-export.json for grading."],
  ["Remove-VerdelitLab.ps1", "Deletes only the tagged lab users and groups."],
] as const;

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

// What each ticket asks for in Entra terms. The grading itself comes from the simulator.
const TODO: Record<string, string> = {
  REQ0018841: "Enable Maria Lopez and add exactly the AP Clerk groups.",
  REQ0018850: "Offboard Robert Hayes: disable the account, revoke sessions, and remove every group.",
  REQ0018852: "Move Tanya Wright to Operations / Dispatcher: update job info, swap Sales groups for Dispatcher groups.",
  REQ0018870: "Rehire Sofia Ramirez as HR / HR Generalist: enable, reset the password, remove old access, add the new role's groups.",
  REQ0018879: "Put Rachel Adams on leave: disable the account and keep her groups.",
  REQ0018881: "Provision Ethan Moore as a Dispatcher from the access matrix, not from Bob Turner's access.",
};

function Code({ children }: { children: string }) {
  const copy = () => navigator.clipboard?.writeText(children).then(() => toast("Copied to the clipboard."), () => toast("Couldn't copy. Select the text and copy it instead."));
  return (
    <div className="relative">
      {/* Long commands wrap rather than scroll, so the copy button never covers them. */}
      <pre className="whitespace-pre-wrap rounded-lg border bg-muted/50 py-3 pl-4 pr-12 font-mono text-[13px] leading-relaxed [overflow-wrap:anywhere]"><code>{children}</code></pre>
      <Button type="button" size="icon" variant="ghost" onClick={copy} className="absolute right-1.5 top-1.5 size-8" aria-label="Copy command">
        <Copy className="size-4" aria-hidden />
      </Button>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[2rem_1fr] gap-3">
      <span aria-hidden className="grid size-7 place-items-center rounded-full bg-primary/12 font-mono text-sm font-semibold text-primary-strong">{n}</span>
      <div className="min-w-0 space-y-2.5">
        <h2 className="font-semibold">{title}</h2>
        {children}
      </div>
    </li>
  );
}

const Ext = ({ href, children }: { href: string; children: ReactNode }) =>
  <a href={href} target="_blank" rel="noopener" className="font-medium text-primary-strong underline underline-offset-2">{children}<span className="sr-only"> (opens in a new tab)</span></a>;

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
        <ul className="space-y-2">
          {SCRIPTS.map(([f, d]) => (
            <li key={f} className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <a href={`/lab/entra/${f}`} download className="inline-flex items-center gap-1.5 font-mono text-sm font-medium text-primary-strong underline underline-offset-2">
                <Download className="size-4" aria-hidden />{f}
              </a>
              <span className="text-sm text-muted-foreground">{d}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">Read the scripts before you run them. Each one explains what it does at the top.</p>
      </Step>
    </ol>
  );
}

function RunScripts() {
  const spec = labSpec();
  return (
    <ol className="space-y-7">
      <Step n={1} title="Seed the tenant">
        <p>In PowerShell, go to the folder with the scripts. Unblock them (downloaded files are blocked by default), preview with <code className="font-mono text-sm">-WhatIf</code>, then run the seed:</p>
        <Code>{"Unblock-File .\\*.ps1\n.\\Seed-VerdelitLab.ps1 -WhatIf\n.\\Seed-VerdelitLab.ps1"}</Code>
        <p>Sign in with your lab admin account and accept the permissions prompt. The script shows the tenant name and asks you to type its domain. It then creates {spec.users.length} users in {spec.company} and {spec.groups.length} security groups, and saves <code className="font-mono text-sm">verdelit-lab-state.json</code> in the same folder. Keep that file.</p>
      </Step>
      <Step n={2} title="Work the six tickets in the Entra admin center">
        <p>Open <Ext href="https://entra.microsoft.com/">entra.microsoft.com</Ext> and go to <b>Users</b> and <b>Groups</b>. The access matrix and runbook are on the <a href="#/policy" className="font-medium text-primary-strong underline underline-offset-2">Policy &amp; matrix</a> page.</p>
        <ul className="divide-y rounded-lg border">
          {LAB_TICKETS.map(id => (
            <li key={id} className="space-y-1 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2"><Tag className="font-mono">{id}</Tag><span className="font-medium">{TK[id].title}</span></div>
              <p className="text-sm text-muted-foreground">{TODO[id]}</p>
            </li>
          ))}
        </ul>
      </Step>
      <Step n={3} title="Export the results">
        <p>The export signs in with read-only permissions and reads only the lab users. It writes <code className="font-mono text-sm">verdelit-lab-export.json</code>:</p>
        <Code>{".\\Export-VerdelitLab.ps1"}</Code>
        <p>Then open the <b>Upload results</b> tab. You can fix things in Entra and export again as often as you like.</p>
      </Step>
      <Step n={4} title="Clean up when you're done">
        <p>This deletes only the users and groups the seed created, and only while they still carry the lab tag. Add <code className="font-mono text-sm">-Purge</code> to also empty them from the recycle bin.</p>
        <Code>{".\\Remove-VerdelitLab.ps1 -WhatIf\n.\\Remove-VerdelitLab.ps1"}</Code>
      </Step>
    </ol>
  );
}

function UploadResults() {
  const [result, setResult] = useState<LabResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const id = useId();

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setFile(f.name); setResult(null);
    try {
      if (f.size > 1_000_000) throw new ExportError("This file is too large to be a lab export. Upload verdelit-lab-export.json.");
      setResult(gradeExport(parseExport(await f.text()))); setError(null);
      requestAnimationFrame(() => heading.current?.focus());
    } catch (e) {
      setError(e instanceof ExportError ? e.message : "The file couldn't be read. Export it again and upload the new file.");
    }
    if (input.current) input.current.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor={id} className="font-semibold">Export file</label>
        <p id={`${id}-help`} className="text-sm text-muted-foreground">verdelit-lab-export.json, from Export-VerdelitLab.ps1. Grading runs in your browser; the file isn't uploaded anywhere.</p>
        <div className="flex flex-wrap items-center gap-3">
          <input ref={input} id={id} type="file" accept=".json,application/json" className="sr-only" aria-describedby={`${id}-help${error ? ` ${id}-err` : ""}`}
            aria-invalid={!!error} onChange={e => onFile(e.target.files?.[0])} />
          <Button type="button" onClick={() => input.current?.click()} className="font-bold"><Upload className="size-4" aria-hidden />Choose export file</Button>
          {file && <span className="font-mono text-sm text-muted-foreground">{file}</span>}
        </div>
        {error && <p id={`${id}-err`} role="alert" className="text-sm font-medium text-destructive">{error}</p>}
      </div>

      {result && (
        <section aria-labelledby="lab-score" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3 rounded-lg border bg-muted/40 p-4">
            <div>
              <h2 id="lab-score" ref={heading} tabIndex={-1} className="font-semibold outline-none">Lab score</h2>
              <p className="text-sm text-muted-foreground">Exported {new Date(result.exportedAt).toLocaleString()}. Graded with the same checks as the Monday shift.</p>
            </div>
            <div className="font-mono text-3xl">{result.score}/{result.max}</div>
          </div>
          {result.tickets.map(t => (
            <article key={t.id} aria-labelledby={`lab-${t.id}`} className="space-y-3 rounded-lg border p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2"><Tag className="font-mono">{t.id}</Tag><h3 id={`lab-${t.id}`} className="font-semibold">{t.title}</h3></div>
                <Tag tone={t.score === t.max ? "ok" : "warn"} className="font-mono">{t.score}/{t.max}</Tag>
              </div>
              <Checks checks={t.checks} />
              <p className="rounded-r-md border-l-2 border-primary bg-primary/8 px-4 py-2 text-sm"><b>Takeaway.</b> {t.lesson}</p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

const TROUBLE: [string, ReactNode][] = [
  ["\"Running scripts is disabled on this system\"", <>Run <code className="font-mono">Unblock-File .\*.ps1</code>, then allow scripts for this PowerShell window only: <code className="font-mono">Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass</code>. See <Ext href="https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_execution_policies">about Execution Policies</Ext>.</>],
  ["\"The Microsoft.Graph… module is missing\"", <>Run the install command on the Setup tab. In Windows PowerShell 5.1, install only those four modules rather than the full Microsoft.Graph module, which can exceed 5.1's function limit.</>],
  ["The sign-in asks for admin approval", <>Sign in with an admin of the lab tenant. The first run asks you to consent to permissions for Microsoft Graph Command Line Tools.</>],
  ["\"This tenant has N users\"", <>The seed stops on tenants with more than 50 users so it can't touch a real organization. If the tenant really is a lab, run it with <code className="font-mono">-LabTenant</code>.</>],
  ["\"A group named … already exists\" or \"A user … already exists\"", <>A previous lab is still there. Run <code className="font-mono">.\Remove-VerdelitLab.ps1</code> from the folder with the state file, or delete those objects in the admin center, then seed again.</>],
  ["\"Insufficient privileges to complete the operation\"", <>Your account needs User Administrator and Groups Administrator, or Global Administrator. See <Ext href="https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/permissions-reference">Entra built-in roles</Ext>.</>],
  ["Revoking sessions or resetting a password didn't count", <>These are read from timestamps that can take a minute to update. Wait, then run the export again.</>],
  ["The export says a user \"was not found\"", <>The user was deleted. The runbook disables accounts instead, so that ticket scores 0. Remove the lab and seed it again to retry.</>],
  ["The upload says the file isn't a lab export", <>Upload <code className="font-mono">verdelit-lab-export.json</code>, not the state file. If you edited it, export again.</>],
];

export default function Lab() {
  return (
    <>
      <PageHeader icon={FlaskConical} title="Connect your lab" sub="Work six Pacific Crest Monday tickets in a real Microsoft Entra tenant, then grade a read-only export in your browser.">
        <EarlyAccess />
      </PageHeader>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Card className="min-w-0 p-5 md:p-6">
          <Tabs defaultValue="setup">
            <TabsList className="grid w-full grid-cols-2 group-data-[orientation=horizontal]/tabs:h-auto sm:flex sm:w-fit">
              <TabsTrigger className="h-9" value="setup">Setup</TabsTrigger>
              <TabsTrigger className="h-9" value="run">Run scripts</TabsTrigger>
              <TabsTrigger className="h-9" value="upload">Upload results</TabsTrigger>
              <TabsTrigger className="h-9" value="trouble">Troubleshooting</TabsTrigger>
            </TabsList>
            <TabsContent value="setup" className="pt-4"><Setup /></TabsContent>
            <TabsContent value="run" className="pt-4"><RunScripts /></TabsContent>
            <TabsContent value="upload" className="pt-4"><UploadResults /></TabsContent>
            <TabsContent value="trouble" className="pt-4">
              <div className="divide-y rounded-lg border">
                {TROUBLE.map(([q, a]) => (
                  <details key={q} className="group px-4 py-3">
                    <summary className="cursor-pointer font-medium">{q}</summary>
                    <p className="pt-2 text-sm text-muted-foreground [&_code]:text-foreground">{a}</p>
                  </details>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
        <aside aria-labelledby="lab-res" className="space-y-3">
          <SectionLabel id="lab-res">Resources</SectionLabel>
          <ul className="space-y-3">
            {RESOURCES.map(([t, href, d]) => (
              <li key={href}>
                <a href={href} target="_blank" rel="noopener" className="group inline-flex items-start gap-1.5 font-medium text-primary-strong hover:underline">
                  {t}<ExternalLink className="mt-1 size-3.5 shrink-0" aria-hidden /><span className="sr-only"> (opens in a new tab)</span>
                </a>
                <p className="text-sm text-muted-foreground">{d}</p>
              </li>
            ))}
          </ul>
          <p className="pt-2 text-xs text-muted-foreground">Links go to Microsoft's official documentation. Verdelit is not affiliated with Microsoft.</p>
        </aside>
      </div>
    </>
  );
}
