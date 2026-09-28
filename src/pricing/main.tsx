// /pricing: the pricing section, pricing questions and the waitlist.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MotionPauseProvider, AnimatedBackdrop } from "@/components/brand/motion";
import { SiteHeader, SiteFooter, Waitlist } from "@/marketing/chrome";
import { Pricing } from "@/marketing/Pricing";
import "@/index.css";

const QA = [
  ["Can I pay today?", "Not yet. Pricing is shown so you can plan ahead. Pick a plan's waitlist and we'll email you once when it opens. We never ask for payment details on this site."],
  ["What's free right now?", "Pacific Crest Logistics with both shifts, the Monday-to-Thursday consequences and the GRC audit track. During early access, the full hints, the guided tutor and the readiness report are included free as well."],
  ["What's coming soon?", "Four more industry companies (Healthcare, Aerospace/Defense, Banking, SaaS, Retail round out the five), the PAM track, and platform packs for Entra ID, Okta, AWS and Active Directory."],
  ["What's a platform pack?", "Scripts that load a company into your own lab tenant and grade the work you do in the real console. Pro + Labs includes all four; the add-on is one pack, one-time, with 12 months of updates."],
  ["Is yearly billing cheaper?", "Yes. Pro is $129 a year instead of $180 (save 28%), and Pro + Labs is $169 instead of $240 (save 30%)."],
];

function Page() {
  return (
    <MotionPauseProvider>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2">Skip to content</a>
      <SiteHeader current="/pricing/" />
      <main id="main" tabIndex={-1} className="outline-none">
        <section aria-labelledby="pricing-h" className="relative overflow-hidden px-4 py-16 md:px-6 md:py-24">
          <AnimatedBackdrop className="opacity-60" />
          <div className="relative mx-auto max-w-7xl"><Pricing headingLevel="h1" /></div>
        </section>
        <section aria-labelledby="pq-h" className="mx-auto max-w-3xl px-4 py-16 md:px-6">
          <h2 id="pq-h" className="text-3xl">Pricing questions</h2>
          <Accordion type="single" collapsible className="mt-6">
            {QA.map(([q, a]) => <AccordionItem key={q} value={q}><AccordionTrigger className="text-base font-bold">{q}</AccordionTrigger><AccordionContent className="text-base text-muted-foreground">{a}</AccordionContent></AccordionItem>)}
          </Accordion>
        </section>
        <section id="waitlist" aria-labelledby="wl-h" className="scroll-mt-20 px-4 pb-24 md:px-6">
          <div className="mx-auto grid max-w-5xl gap-10 rounded-3xl bg-gradient-to-br from-[#1d4ed8] via-[#2563eb] to-[#6d28d9] text-white p-8 md:grid-cols-2 md:p-12">
            <div><h2 id="wl-h" className="text-3xl">Join the waitlist</h2><p className="mt-3 text-white">Choose the plan you're interested in. One email when it opens, no spam, and no commitment to buy.</p></div>
            <div className="rounded-2xl bg-card p-6 text-card-foreground shadow-xl"><Waitlist /></div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </MotionPauseProvider>
  );
}
createRoot(document.getElementById("root")!).render(<StrictMode><Page /></StrictMode>);
