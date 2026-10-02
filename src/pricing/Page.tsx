// /pricing: the pricing section, pricing questions and the waitlist.
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MotionPauseProvider, AnimatedBackdrop } from "@/components/brand/motion";
import { SiteHeader, SiteFooter } from "@/marketing/chrome";
import { WaitlistBand } from "@/marketing/sections";
import { Pricing } from "@/marketing/Pricing";
import { WhyProLabs } from "@/marketing/WhyProLabs";
import { PRICES, TIERS, yearlySaving } from "@/marketing/plans";

const [, pro, labs] = TIERS;

const QA = [
  ["Can plans be purchased today?", "Not yet. Paid plans open from a waitlist, and no payment details are collected on this site."],
  ["What does the free tier include?", "Pacific Crest Logistics on all three paths (IAM only, IAM + GRC, GRC only), with the full ticket queue, reopened tickets, follow-up incidents and the audits. Pro features are included free during early access."],
  ["What is in early access?", "Five industry companies (Harbor Health Network, Meridian Aerospace, Coastline Credit Union, Brightpath SaaS and Sunset Retail Group), the PAM track, and the Microsoft Entra ID, Okta and AWS labs."],
  ["How do the labs work?", "Each lab seeds a free tenant you own (Microsoft Entra ID, Okta or AWS) with the Pacific Crest directory. The tickets are worked in the real console, then a read-only check grades the result in the browser."],
  ["Is there a free trial, and can plans be cancelled?", `Pro includes a ${PRICES.pro.trialDays}-day free trial. Every paid plan can be cancelled anytime.`],
  ["How much does yearly billing save?", `Pro is $${pro.yearly} a year instead of $${pro.monthly * 12} (${yearlySaving(pro)}% less). Pro + Labs is $${labs.yearly} instead of $${labs.monthly * 12} (${yearlySaving(labs)}% less).`],
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
        <WhyProLabs />
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
