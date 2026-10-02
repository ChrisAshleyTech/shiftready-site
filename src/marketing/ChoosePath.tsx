// "Choose your path": the three areas of work (IAM, GRC, PAM) and how they map to the app's paths.
// Shared by the landing and Tracks pages. Text links only, so each page keeps one primary action.
import { ArrowRight, ClipboardCheck, KeyRound, UsersRound } from "lucide-react";
import { EarlyAccess } from "@/components/brand/EarlyAccess";
import { cn } from "@/lib/utils";

type Area = { id: string; icon: typeof UsersRound; tint: string; name: string; full: string; text: string; paths: [string, string][]; early?: boolean; track: string };
const AREAS: Area[] = [
  { id: "iam", icon: UsersRound, tint: "bg-hue-blue/12 text-primary-strong", name: "IAM", full: "Identity and access management", track: "/tracks/#iam-ops",
    text: "Work the Pacific Crest service desk: joiners, movers and leavers, caller verification, access requests and compromised accounts. Tickets stay in the queue until they're actually fixed.",
    paths: [["IAM only", "Work the queue until it's clear, then a shift summary."], ["IAM + GRC", "The same shift, then an optional audit of your own work."]] },
  { id: "grc", icon: ClipboardCheck, tint: "bg-hue-violet/12 text-[color:var(--hue-violet)] dark:text-violet-300", name: "GRC", full: "Governance, risk and compliance", track: "/tracks/#grc",
    text: "Take the auditor's side: walkthrough, sampling, control testing, evidence, findings, risk ratings and management's response, with the requirements behind each decision from the frameworks the company answers to, such as HIPAA, CMMC, GLBA, SOX or PCI DSS.",
    paths: [["GRC only", "Audit Jordan Reyes, a simulated IAM analyst whose shift includes realistic mistakes."], ["IAM + GRC", "Audit the shift you just worked on the desk."]] },
  { id: "pam", icon: KeyRound, tint: "bg-hue-amber/15 text-warn", name: "PAM", full: "Privileged access management", track: "/tracks/#pam",
    text: "Guard the admin keys at any of the six companies: just-in-time elevation, break-glass accounts, credential rotation and privileged session review.",
    paths: [["PAM", "Work the privileged access queue until it's clear, then a shift summary."]] },
];

// links="tracks": each card links to its track details (landing). links="app": to the app (Tracks page).
export function ChoosePath({ links, className }: { links: "tracks" | "app"; className?: string }) {
  return (
    <section id="paths" aria-labelledby="paths-h" className={cn("scroll-mt-24 mx-auto max-w-7xl px-4 py-16 md:px-6", className)}>
      <div className="max-w-3xl">
        <p className="t-eyebrow">Paths</p>
        <h2 id="paths-h" className="t-h1 mt-3">Choose your path</h2>
        <p className="t-lead mt-4">Pick a path when you open the app and switch any time. Each path keeps its own progress. The IAM and GRC paths are free, and PAM is part of Pro, open to everyone during early access.</p>
      </div>
      <ul className="mt-10 grid gap-5 lg:grid-cols-3">
        {AREAS.map(a => (
          <li key={a.id} className="flex flex-col gap-4 rounded-3xl border bg-card p-7">
            <span className={cn("grid size-12 place-items-center rounded-2xl", a.tint)}><a.icon className="size-6" aria-hidden /></span>
            <div>
              <h3 className="t-h3 flex flex-wrap items-center gap-2">{a.name}{a.early && <EarlyAccess />}</h3>
              <p className="t-meta font-semibold">{a.full}</p>
            </div>
            <p className="text-muted-foreground">{a.text}</p>
            <dl className="space-y-2 border-t pt-4 text-[15px]">
              {a.paths.map(([k, v]) => <div key={k}><dt className="font-semibold">{k}</dt><dd className="text-muted-foreground">{v}</dd></div>)}
            </dl>
            {(links === "tracks" || !a.early) && (
              <a href={links === "tracks" ? a.track : "/app/"} className="mt-auto inline-flex items-center gap-1 font-semibold text-primary-strong underline-offset-4 hover:underline">
                {links === "tracks" ? `${a.name} track details` : `Choose ${a.name} in the app`}<ArrowRight className="size-4" aria-hidden />
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
