// Connect your lab: the platform lab guides (Microsoft Entra ID, Okta, AWS). Each seeds a lab
// tenant, has the learner work six Monday tickets in the real console, and grades a read-only export
// in the browser. The guides open only with tester access; the scripts are served by the lab-file
// endpoint to browsers that hold it (api/_lib/labAccess.js).
//
// The step-by-step content is fetched from the server (lab-files/<lab>/guide.json) with the same
// access check as the scripts, so none of it is in the public site bundle.
// TODO(labs-auth): gate on a Supabase session with the Pro + Labs plan instead of the tester cookie.
import { useEffect, useState } from "react";
import { FlaskConical, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EarlyAccess } from "@/components/brand/EarlyAccess";
import { LAB_INFO } from "@/marketing/catalog";
import { cn } from "@/lib/utils";
import type { Route } from "../sim";
import { PageHeader } from "../components/bits";
import { GuideSteps, Resources, Trouble, UploadResults, type GuideContent, type LabGuide } from "./labs/shared";
import { ENTRA } from "./labs/entra";
import { OKTA } from "./labs/okta";
import { AWS } from "./labs/aws";

const GUIDES: LabGuide[] = [ENTRA, OKTA, AWS];

type Access = "checking" | "open" | "locked";
function useLabAccess(): Access {
  const [a, setA] = useState<Access>("checking");
  useEffect(() => {
    let live = true;
    fetch("/api/lab-session", { credentials: "same-origin", cache: "no-store" })
      .then(r => live && setA(r.ok ? "open" : "locked"), () => live && setA("locked"));
    return () => { live = false; };
  }, []);
  return a;
}

function Picker({ current }: { current: string }) {
  return (
    <nav aria-label="Labs" className="flex flex-wrap gap-2">
      {LAB_INFO.map(l => l.status === "soon"
        ? <span key={l.id} className="inline-flex items-center gap-2 rounded-full border border-dashed px-4 py-2 text-sm text-muted-foreground">{l.short}<span className="font-display text-[11px] font-semibold">Coming soon</span></span>
        : <a key={l.id} href={`#/labs/${l.id}`} aria-current={current === l.id ? "page" : undefined}
            className={cn("rounded-full border px-4 py-2 text-sm font-semibold", current === l.id ? "border-primary bg-primary text-primary-foreground" : "text-primary-strong hover:bg-primary/5")}>{l.short}</a>)}
    </nav>
  );
}

function useGuideContent(lab: string) {
  const [c, setC] = useState<GuideContent | "error" | null>(null);
  useEffect(() => {
    let live = true;
    setC(null);
    fetch(`/lab-files/${lab}/guide.json`, { credentials: "same-origin", cache: "no-store" })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(j => live && setC(j), () => live && setC("error"));
    return () => { live = false; };
  }, [lab]);
  return c;
}

function Guide({ g }: { g: LabGuide }) {
  const c = useGuideContent(g.id);
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <Card className="min-w-0 p-5 md:p-6">
        {c === null && <p role="status" className="t-meta py-10 text-center">Loading the lab guide…</p>}
        {c === "error" && <p role="alert" className="py-10 text-center font-medium text-destructive">The lab guide couldn't be loaded. Your access may have expired; open your invitation link again.</p>}
        {c && c !== "error" && (
          /* Keyed by lab, so switching labs starts on Setup with a fresh upload. */
          <Tabs key={g.id} defaultValue="setup">
            <TabsList className="grid w-full grid-cols-2 group-data-[orientation=horizontal]/tabs:h-auto sm:flex sm:w-fit">
              <TabsTrigger className="h-9" value="setup">Setup</TabsTrigger>
              <TabsTrigger className="h-9" value="run">Run scripts</TabsTrigger>
              <TabsTrigger className="h-9" value="upload">Upload results</TabsTrigger>
              <TabsTrigger className="h-9" value="trouble">Troubleshooting</TabsTrigger>
            </TabsList>
            <TabsContent value="setup" className="pt-4"><GuideSteps steps={c.setup} guide={g} content={c} /></TabsContent>
            <TabsContent value="run" className="pt-4"><GuideSteps steps={c.run} guide={g} content={c} /></TabsContent>
            <TabsContent value="upload" className="pt-4"><UploadResults guide={g} /></TabsContent>
            <TabsContent value="trouble" className="pt-4"><Trouble items={c.trouble} /></TabsContent>
          </Tabs>
        )}
      </Card>
      <Resources items={g.resources} vendor={g.vendor} />
    </div>
  );
}

function Locked() {
  return (
    <Card className="space-y-5 p-6 md:p-8">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary-strong"><Lock className="size-5" aria-hidden /></span>
        <div className="space-y-1.5">
          <h2 className="font-display text-lg font-bold">Lab guides are part of Pro + Labs</h2>
          <p className="text-muted-foreground">During early access, the scripts, step-by-step instructions and grading open with the invitation link sent to testers. Open that link in this browser to continue.</p>
        </div>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {LAB_INFO.map(l => (
          <li key={l.id} className="rounded-xl border p-4">
            <p className="flex flex-wrap items-center gap-2 font-semibold">{l.name}{l.status === "soon" ? <span className="text-xs font-semibold text-muted-foreground">Coming soon</span> : <EarlyAccess />}</p>
            <p className="mt-1 text-sm text-muted-foreground">{l.overview}</p>
            <p className="mt-2 text-sm"><b>Time needed:</b> {l.time}</p>
          </li>))}
      </ul>
      <p className="text-sm"><a href="/labs/" className="font-medium text-primary-strong underline underline-offset-2">See what each lab covers</a> or <a href="/pricing/#why-pro-labs" className="font-medium text-primary-strong underline underline-offset-2">compare Pro and Pro + Labs</a>.</p>
    </Card>
  );
}

export default function Lab({ r }: { r: Route }) {
  const access = useLabAccess();
  const g = GUIDES.find(x => x.id === r.id) ?? GUIDES[0];
  return (
    <>
      <PageHeader icon={FlaskConical} title="Connect your lab" sub={access === "open" ? g.sub : "Practice the Pacific Crest tickets in Microsoft Entra ID, Okta and AWS, and get your work graded automatically."}>
        <EarlyAccess />
      </PageHeader>
      {access === "checking" && <p role="status" className="t-meta py-10 text-center">Checking lab access…</p>}
      {access === "locked" && <Locked />}
      {access === "open" && <div className="space-y-5"><Picker current={g.id} /><Guide g={g} /></div>}
    </>
  );
}
