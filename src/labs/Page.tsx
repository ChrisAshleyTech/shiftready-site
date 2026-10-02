// /labs: the public overview of each platform lab (what it covers, what you'll practice, time needed,
// a screenshot). Scripts, step-by-step instructions and grading are in the app's lab guide, which
// opens with tester access (Pro + Labs once paid plans launch).
import { useEffect, useState } from "react";
import { ArrowRight, Clock, Lock, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EarlyAccess } from "@/components/brand/EarlyAccess";
import { MarketingFrame, PageHero } from "@/marketing/sections";
import { WhyProLabs } from "@/marketing/WhyProLabs";
import { LAB_INFO, type LabInfo } from "@/marketing/catalog";
import { chooseTier } from "@/marketing/plans";

const ComingSoon = () => (
  <span className="inline-flex h-5 items-center whitespace-nowrap rounded-full border border-dashed border-muted-foreground/50 px-2 align-middle font-display text-[11px] font-semibold tracking-wide text-muted-foreground">Coming soon</span>
);

function LabCard({ l }: { l: LabInfo }) {
  const soon = l.status === "soon";
  return (
    <article id={l.id} aria-labelledby={`${l.id}-h`} className="scroll-mt-24 grid gap-8 rounded-3xl border bg-card p-6 md:p-8 lg:grid-cols-[1.1fr_1fr]">
      <div className="min-w-0 space-y-5">
        <h2 id={`${l.id}-h`} className="t-h2 flex flex-wrap items-center gap-3">{l.name} {soon ? <ComingSoon /> : <EarlyAccess />}</h2>
        <p className="t-lead">{l.overview}</p>
        <div>
          <h3 className="font-display text-base font-bold">What you'll practice</h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[15px] marker:text-primary">{l.practice.map(p => <li key={p}>{p}</li>)}</ul>
        </div>
        <dl className="grid gap-3 text-[15px] sm:grid-cols-2">
          <div><dt className="flex items-center gap-2 font-semibold"><Clock className="size-4 shrink-0 text-primary-strong" aria-hidden />Time needed</dt><dd className="pl-6 text-muted-foreground">{l.time}</dd></div>
          <div><dt className="flex items-center gap-2 font-semibold"><Server className="size-4 shrink-0 text-primary-strong" aria-hidden />You'll need</dt><dd className="pl-6 text-muted-foreground">{l.needs}</dd></div>
        </dl>
      </div>
      {l.shot
        ? <figure className="min-w-0 space-y-2">
            <img src={l.shot.src} alt={l.shot.alt} width={1046} height={784} loading="lazy" decoding="async" className="w-full rounded-2xl border bg-background shadow-sm" />
            <figcaption className="t-meta">Graded results in the lab guide.</figcaption>
          </figure>
        : <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed bg-background p-6 text-center text-muted-foreground">In development.</div>}
    </article>
  );
}

export default function Page() {
  // /labs/access sends an invalid or expired link back here.
  const [invalid, setInvalid] = useState(false);
  useEffect(() => { setInvalid(new URLSearchParams(location.search).get("access") === "invalid"); }, []);
  return (
    <MarketingFrame current="labs">
      <PageHero eyebrow="Platform labs" title="The same scenarios, in a real identity platform."
        lead="Practice the Pacific Crest tickets in the consoles employers use: Microsoft Entra ID, Okta and AWS. Each lab seeds a free tenant you own, and your work is graded automatically.">
        {invalid && <p role="alert" className="max-w-3xl rounded-xl border border-bad/40 bg-bad/8 px-4 py-3 font-semibold text-bad">That lab access link is invalid or has expired. Ask for a new one.</p>}
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" className="font-bold"><a href="#waitlist" onClick={() => chooseTier("labs-monthly")}>Join the Pro + Labs waitlist <ArrowRight /></a></Button>
          <Button asChild size="lg" variant="outline" className="border-2 border-primary font-bold text-primary-strong hover:bg-primary/5"><a href="#why-pro-labs">Why Pro + Labs</a></Button>
        </div>
      </PageHero>
      <section aria-label="Labs" className="mx-auto max-w-7xl space-y-6 px-4 py-16 md:px-6">
        <p className="flex items-start gap-2.5 rounded-2xl border bg-card px-5 py-4 text-[15px]"><Lock className="mt-0.5 size-4 shrink-0 text-primary-strong" aria-hidden />
          <span>Lab scripts, step-by-step instructions and grading are part of Pro + Labs. During early access they open with an invitation link.</span></p>
        {LAB_INFO.map(l => <LabCard key={l.id} l={l} />)}
        <p className="t-meta">Microsoft, Microsoft Entra and Azure are trademarks of the Microsoft group of companies. Okta is a trademark of Okta, Inc. AWS and Amazon Web Services are trademarks of Amazon.com, Inc. or its affiliates. Rolevara is not affiliated with Microsoft, Okta or Amazon.</p>
      </section>
      <WhyProLabs />
    </MarketingFrame>
  );
}
