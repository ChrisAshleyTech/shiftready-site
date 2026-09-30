// /pricing: the pricing section, pricing questions and the waitlist.
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MotionPauseProvider, AnimatedBackdrop } from "@/components/brand/motion";
import { SiteHeader, SiteFooter } from "@/marketing/chrome";
import { WaitlistBand } from "@/marketing/sections";
import { Pricing } from "@/marketing/Pricing";

const QA = [
  ["Can plans be purchased today?", "Not yet. Paid plans open from a waitlist, and no payment details are collected on this site."],
  ["What does the free tier include?", "Pacific Crest Logistics on all three paths (IAM only, IAM + GRC, GRC only), with both shifts, Monday-to-Thursday consequences and the audits. Pro features are included free during early access."],
  ["What is in early access?", "Five industry companies (Harbor Health Network, Meridian Aerospace, Coastline Credit Union, Brightpath SaaS and Sunset Retail Group), the PAM track and the Entra ID lab."],
  ["What is the Entra ID lab?", "Scripts that seed a Microsoft Entra tenant with the Pacific Crest directory, a read-only export of the results, and in-browser grading of that export."],
  ["How much does yearly billing save?", "Pro is $129 a year instead of $180 (28% less). Pro + Labs is $169 instead of $240 (30% less)."],
];

export default function Page() {
  return (
    <MotionPauseProvider>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2">Skip to content</a>
      <SiteHeader current="pricing" />
      <main id="main" tabIndex={-1} className="outline-none">
        <section aria-labelledby="pricing-h" className="relative overflow-hidden px-4 py-16 md:px-6 md:py-24">
          <AnimatedBackdrop className="opacity-60" />
          <div className="relative mx-auto max-w-7xl"><Pricing headingLevel="h1" /></div>
        </section>
        <section aria-labelledby="pq-h" className="mx-auto max-w-3xl px-4 py-16 md:px-6">
          <h2 id="pq-h" className="t-h2">Pricing questions</h2>
          <Accordion type="single" collapsible className="mt-6">
            {QA.map(([q, a]) => <AccordionItem key={q} value={q}><AccordionTrigger className="font-display text-base font-bold">{q}</AccordionTrigger><AccordionContent className="text-base text-muted-foreground">{a}</AccordionContent></AccordionItem>)}
          </Accordion>
        </section>
        <WaitlistBand />
      </main>
      <SiteFooter />
    </MotionPauseProvider>
  );
}
