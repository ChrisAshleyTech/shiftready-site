// /tracks: IAM Ops, GRC Audit and PAM (early access).
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EarlyAccess } from "@/components/brand/EarlyAccess";
import { MarketingFrame, PageHero } from "@/marketing/sections";
import { ChoosePath } from "@/marketing/ChoosePath";

const TRACKS = [
  { id: "iam-ops", name: "IAM Ops", level: "Service desk and IAM operations",
    lead: "A full operating week on the identity service desk at Pacific Crest Logistics.",
    covers: ["Joiner, mover, leaver, rehire and leave-of-absence requests provisioned from the access matrix",
      "Caller verification before password, MFA and unlock actions", "Requestable access with documented approvals, and SoD enforcement",
      "Inactive-account sweeps, contractor expiry and service-account ownership", "Compromised-account containment and escalation",
      "Thursday's queue generated from Monday's decisions, with 13 possible downstream consequences"],
    cta: { href: "/app/", label: "Start the Monday shift" } },
  { id: "grc", name: "GRC Audit", level: "IT audit and compliance",
    lead: "The same company from the auditor's side, for a Q3 SOX IT general controls cycle.",
    covers: ["Test new-user provisioning (APD-01) and timely terminations (APD-02) against sampled evidence",
      "Classify deficiencies: control deficiency, significant deficiency or material weakness",
      "Audit the change log of the IAM Ops shift just worked (APD-03)", "Assess access-review completeness (UAR-01) and rate an IT risk register",
      "Review a vendor SOC 2 Type II report and decide a policy exception", "Map controls to NIST 800-53, ISO 27001, SOC 2 and CMMC, and write the finding"],
    cta: { href: "/app/#/grc", label: "Open the audit desk" } },
  { id: "pam", name: "PAM", level: "Privileged access management", early: true,
    lead: "Privileged access operations: elevation, emergency access and oversight.",
    covers: ["Just-in-time role activation with approval and time limits", "Break-glass account use, monitoring and post-use review",
      "Credential rotation for shared and service credentials", "Privileged session review and escalation"],
    cta: null },
];

export default function Page() {
  return (
    <MarketingFrame current="tracks">
      <PageHero eyebrow="Tracks" title="Role-based tracks for identity and access work." lead="Each track is graded on outcome and process, with the control behind every decision." />
      <ChoosePath links="app" className="pb-0" />
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-16 md:px-6">
        {TRACKS.map(t => (
          <section key={t.id} id={t.id} aria-labelledby={`${t.id}-h`} className="scroll-mt-24 grid gap-8 rounded-3xl border bg-card p-8 lg:grid-cols-[1fr_1.4fr]">
            <div className="space-y-3">
              <p className="t-meta font-semibold">{t.level}</p>
              <h2 id={`${t.id}-h`} className="t-h1 flex flex-wrap items-center gap-3">{t.name}{t.early && <EarlyAccess />}</h2>
              <p className="t-lead">{t.lead}</p>
              {/* One primary action per page: IAM Ops (the free starting point) gets it; others are secondary. */}
              {t.cta && <Button asChild size="lg" variant={t.id === "iam-ops" ? "default" : "outline"} className={t.id === "iam-ops" ? "mt-2 font-bold" : "mt-2 border-2 font-bold"}><a href={t.cta.href}>{t.cta.label} <ArrowRight /></a></Button>}
            </div>
            <div>
              <h3 className="t-eyebrow mb-4">{t.early ? "In development" : "What it covers"}</h3>
              <ul className="space-y-3">{t.covers.map(c => <li key={c} className="flex gap-3"><Check className="mt-1 size-4 shrink-0 text-ok" strokeWidth={3} aria-hidden />{c}</li>)}</ul>
            </div>
          </section>))}
      </div>
    </MarketingFrame>
  );
}
