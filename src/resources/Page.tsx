// /resources: how grading works, runbook, sample readiness report, FAQ, accessibility.
import { ArrowRight, ExternalLink } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { MarketingFrame, PageHero } from "@/marketing/sections";
import { encodeReport } from "@/engine/report.js";
import sample from "@/marketing/sampleReport.json";
import { EarlyAccess } from "@/components/brand/EarlyAccess";
import { LEVELS, LEVEL_LABEL, LevelBadge, linkedInImage } from "@/components/brand/LevelBadge";

const SAMPLE_URL = "/report/#r=" + encodeReport(sample);

const HINTS = [["Nudge", "−10%", "Solo"], ["Policy clause", "−25%", "Solo"], ["Exact steps", "−50%", "Assisted"]];
const FAQ = [
  ["Who is Verdelit for?", "Identity and access professionals at every level: service desk analysts, IAM analysts and engineers, GRC and audit staff, and the team leads who develop them."],
  ["Where is progress stored?", "In the browser that is being used. No account is required, and scenario data is not sent to a server."],
  ["What is included in early access?", "Five industry companies, the PAM track and the Entra ID lab, as each is released. Pro features are included free during early access."],
  ["Are the companies and people real?", "No. All companies and people in Verdelit scenarios are fictional."],
  ["Is the policy content compliance advice?", "No. Runbook policies are training material based on published frameworks, not legal or compliance advice."],
];

export default function Page() {
  return (
    <MarketingFrame current="resources">
      <PageHero eyebrow="Resources" title="How Verdelit works, and what it produces." lead="Grading rules, the runbook every ticket is graded against, a sample readiness report and accessibility information." />
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-16 md:px-6">
        <section id="grading" aria-labelledby="grading-h" className="scroll-mt-24 grid gap-8 rounded-3xl border bg-card p-8 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 id="grading-h" className="t-h1">How grading works</h2>
            <p>Every ticket is graded on its <b>outcome</b> (the account state after the work) and its <b>process</b> (whether identity was verified, approval was recorded, or the right team was escalated to, and in the right order). Each check shows the points it carries and why it matters.</p>
            <p>Three hint tiers are available on every ticket. The score is reduced by the highest tier opened before closing; costs do not add up. Opening the exact steps marks the ticket <b>Assisted</b>. Hints are free to read after a ticket is closed.</p>
            <p>Thursday's queue is generated from Monday's decisions, so missed work returns as incidents.</p>
          </div>
          <div className="overflow-x-auto rounded-2xl border">
            <table className="w-full text-left">
              <caption className="sr-only">Hint tiers and their cost</caption>
              <thead className="bg-muted/60 font-display text-sm"><tr><th className="p-4">Hint tier</th><th className="p-4">Score reduction</th><th className="p-4">Result</th></tr></thead>
              <tbody className="divide-y">{HINTS.map(([t, c, r]) => <tr key={t}><td className="p-4 font-semibold">{t}</td><td className="p-4 font-mono">{c}</td><td className="p-4">{r}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          <section id="runbook" aria-labelledby="runbook-h" className="scroll-mt-24 space-y-4 rounded-3xl border bg-card p-8">
            <h2 id="runbook-h" className="t-h2">Runbook and access matrix</h2>
            <p className="text-muted-foreground">Thirteen policies (identity verification, joiners, movers, leavers, leave of absence, rehires, requestable access, separation of duties, privileged roles, inactive accounts, contractors, shared accounts and compromised accounts), the role-based access matrix and the SoD rules.</p>
            <Button asChild variant="outline" className="border-2 font-bold"><a href="/app/#/policy">Open the runbook <ArrowRight /></a></Button>
          </section>
          <section id="sample-report" aria-labelledby="sample-h" className="scroll-mt-24 space-y-4 rounded-3xl border bg-card p-8">
            <h2 id="sample-h" className="t-h2">Sample readiness report</h2>
            <p className="text-muted-foreground">A report from a full week: Monday {sample.mon.pct}%, Thursday {sample.thu?.pct}%, {sample.caused} Monday decisions that returned as Thursday incidents, and a score for each of five skills. Reports are shared as a single link.</p>
            <Button asChild variant="outline" className="border-2 font-bold"><a href={SAMPLE_URL} target="_blank" rel="noopener">View the sample report <ExternalLink /></a></Button>
          </section>
        </div>

        <section id="levels" aria-labelledby="levels-h" className="scroll-mt-24 space-y-5 rounded-3xl border bg-card p-8">
          <div className="flex flex-wrap items-center gap-3"><h2 id="levels-h" className="t-h2">Level badges</h2><EarlyAccess /></div>
          <p className="max-w-[70ch] text-muted-foreground">Each company can be worked at three levels. The badge lights up one light for Beginner, two for Intermediate and three for Pro, and appears on the readiness report and profile, with an image sized for LinkedIn. Levels arrive with practice mode.</p>
          <ul className="grid gap-4 sm:grid-cols-3">
            {LEVELS.map(l => (
              <li key={l} className="flex items-center justify-between gap-3 rounded-2xl bg-[#15201B] p-5 text-white ring-1 ring-[#2E4038]">
                <LevelBadge level={l} />
                <a href={linkedInImage(l)} download className="text-sm font-semibold text-[#3DDC97] underline underline-offset-2">LinkedIn image<span className="sr-only"> for the {LEVEL_LABEL[l]} badge</span></a>
              </li>
            ))}
          </ul>
        </section>

        <section id="faq" aria-labelledby="faq-h" className="scroll-mt-24 rounded-3xl border bg-card p-8">
          <h2 id="faq-h" className="t-h1">FAQ</h2>
          <Accordion type="single" collapsible className="mt-4">
            {FAQ.map(([q, a]) => <AccordionItem key={q} value={q}><AccordionTrigger className="font-display text-lg font-bold">{q}</AccordionTrigger><AccordionContent className="text-base text-muted-foreground">{a}</AccordionContent></AccordionItem>)}
          </Accordion>
        </section>

        <section id="accessibility" aria-labelledby="a11y-h" className="scroll-mt-24 space-y-4 rounded-3xl border bg-card p-8">
          <h2 id="a11y-h" className="t-h1">Accessibility</h2>
          <p>Verdelit targets WCAG 2.2 level AA. Every page is checked automatically for serious and critical issues in light and dark themes as part of each build.</p>
          <ul className="ml-5 list-disc space-y-2">
            <li>All functions are available from the keyboard, with visible focus and skip links.</li>
            <li>Motion stops when the operating system requests reduced motion, and every looping animation can be paused.</li>
            <li>Status is never shown by colour alone; text labels accompany every status.</li>
            <li>Text and interface contrast meet AA ratios in both themes.</li>
          </ul>
          <p className="text-muted-foreground">Known limitation: testing with every screen reader and browser combination is in progress.</p>
        </section>
      </div>
    </MarketingFrame>
  );
}
