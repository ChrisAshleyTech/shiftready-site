// /guides/: career and how-to guides for IAM, GRC and PAM roles.
import { ArrowRight } from "lucide-react";
import { MarketingFrame, PageHero } from "@/marketing/sections";
import { GUIDES, guideHref } from "./data";

export default function GuidesIndex() {
  return (
    <MarketingFrame current="resources">
      <PageHero eyebrow="Guides" title="Guides to IAM, GRC and PAM work." lead="What the jobs involve, what interviewers ask, and how to practise the work before your first day." />
      <section aria-label="All guides" className="mx-auto grid max-w-7xl gap-6 px-4 py-16 md:grid-cols-2 md:px-6">
        {GUIDES.map(g => (
          <a key={g.slug} href={guideHref(g)} className="group space-y-3 rounded-3xl border bg-card p-8 hover:border-primary">
            <p className="t-eyebrow">{g.eyebrow}</p>
            <h2 className="t-h3 group-hover:underline">{g.title}</h2>
            <p className="text-muted-foreground">{g.lead}</p>
            <span className="inline-flex items-center gap-1 font-semibold text-primary-strong">Read the guide <ArrowRight className="size-4" aria-hidden /></span>
          </a>
        ))}
      </section>
    </MarketingFrame>
  );
}
