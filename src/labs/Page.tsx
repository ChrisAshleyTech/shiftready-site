// /labs: platform labs overview (Microsoft Entra ID, early access).
import { ArrowRight, Download, FileUp, ListChecks, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EarlyAccess } from "@/components/brand/EarlyAccess";
import { MarketingFrame, PageHero } from "@/marketing/sections";
import { chooseTier } from "@/marketing/plans";

const STEPS = [
  { icon: Server, t: "Seed a tenant", d: "A PowerShell script creates the Pacific Crest users and security groups in a Microsoft Entra tenant, tagged for easy cleanup." },
  { icon: ListChecks, t: "Work the tickets", d: "Nine lifecycle and access tickets are worked in the Microsoft Entra admin center, as they would be in production." },
  { icon: Download, t: "Export read-only", d: "A read-only script exports the lab users, groups and memberships to a JSON file. Nothing in the tenant is changed." },
  { icon: FileUp, t: "Grade in the browser", d: "The export is graded with the same rules as the simulator. The file never leaves the browser." },
];

export default function Page() {
  return (
    <MarketingFrame current="labs">
      <PageHero eyebrow="Platform labs" title="The same scenarios, in a real identity platform." lead="Platform labs move Rolevara tickets into a live tenant, then grade the result against the simulator's rules.">
        {/* The lab guide is in development, so the primary action is joining its waitlist. */}
        <Button asChild size="lg" className="font-bold"><a href="#waitlist" onClick={() => chooseTier("pack")}>Join the lab waitlist <ArrowRight /></a></Button>
      </PageHero>
      <section aria-labelledby="entra-h" className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="rounded-3xl border bg-card p-8">
          <h2 id="entra-h" className="t-h1 flex flex-wrap items-center gap-3">Microsoft Entra ID lab <EarlyAccess /></h2>
          <p className="t-lead mt-3 max-w-3xl">Requires a Microsoft Entra tenant with permission to create users and groups. The recommended path is the default tenant included with an Azure free account.</p>
          <ol className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.t} className="rounded-2xl border bg-background p-6">
                <span className="grid size-11 place-items-center rounded-xl bg-primary/12 text-primary-strong"><s.icon className="size-5" aria-hidden /></span>
                <h3 className="t-h3 mt-4"><span className="sr-only">Step {i + 1}: </span>{s.t}</h3>
                <p className="mt-2 text-muted-foreground">{s.d}</p>
              </li>))}
          </ol>
          <p className="t-meta mt-8">Microsoft, Microsoft Entra and Azure are trademarks of the Microsoft group of companies. Rolevara is not affiliated with Microsoft.</p>
        </div>
      </section>
    </MarketingFrame>
  );
}
