// Landing page. Second person, plain language. Opens with the home-to-office film (Intro.tsx), then
// follows the usual training-platform pattern:
// hero, what's covered, how it works, choose a path, what you practise, companies, who it's for,
// pricing, FAQ, sign-up. Photos: Unsplash License (credited).
import { ArrowRight, Bot, ClipboardCheck, FileBarChart2, KeyRound, ShieldAlert, UsersRound } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { AnimatedBackdrop, CountUp, MotionPauseProvider, PauseButton, Reveal } from "@/components/brand/motion";
import { IllusShield, IllusReopen } from "@/components/brand/illustrations";
import { SkillsStrip } from "@/components/brand/SkillsStrip";
import { EarlyAccess } from "@/components/brand/EarlyAccess";
import { SiteHeader, SiteFooter } from "@/marketing/chrome";
import { Photo, WaitlistBand } from "@/marketing/sections";
import { Pricing } from "@/marketing/Pricing";
import { ChoosePath } from "@/marketing/ChoosePath";
import { INDUSTRIES } from "@/marketing/catalog";
import { cn } from "@/lib/utils";
import { HeroVideo } from "./HeroVideo";
import { Intro } from "./Intro";

const CAPABILITIES: { icon: typeof UsersRound; tint: string; title: string; text: string; early?: boolean }[] = [
  { icon: UsersRound, tint: "bg-hue-blue/12 text-primary-strong", title: "Provisioning and lifecycle", text: "Set up, change and remove access for joiners, movers, leavers and rehires, using the company's role-based access matrix." },
  { icon: ClipboardCheck, tint: "bg-hue-teal/15 text-eyebrow", title: "Access reviews and SoD", text: "Spot separation-of-duties conflicts, revoke what a review flags and approve requests with a clear paper trail." },
  { icon: KeyRound, tint: "bg-hue-amber/15 text-warn", title: "Privileged access", text: "Grant just-in-time admin rights, handle break-glass accounts and review privileged sessions.", early: true },
  { icon: ShieldAlert, tint: "bg-hue-coral/15 text-bad", title: "Incident response", text: "Contain compromised accounts, MFA fatigue attacks and activity from people who have already left." },
  { icon: FileBarChart2, tint: "bg-hue-green/15 text-ok", title: "Audit readiness", text: "Test provisioning, termination and review controls against the audit log of the shift you just worked." },
  { icon: Bot, tint: "bg-hue-sky/20 text-info", title: "Coached, not handed answers", text: "Hints cost points, and the tutor asks the questions a senior colleague would instead of giving the answer away." },
];

const AUDIENCES = [
  ["Moving into identity", "Find out what the job really involves, and prove to yourself you can do it before you apply."],
  ["Service desk and IT support", "Build the habits that get you promoted: verify first, provision from the role, remove what the old role granted."],
  ["IAM analysts and engineers", "Rehearse rehires, service accounts and SoD conflicts before they reach production."],
  ["GRC, audit and compliance", "See controls from the operator's side, then test them against real evidence."],
];

const STEPS = [
  ["Take a ticket", "Requests arrive from HR, phone calls, security alerts and access reviews, just like a real service desk.", "bg-hue-blue"],
  ["Do the work", "Enable, disable, reset, change groups and job data, set expiry dates, revoke sessions or escalate.", "bg-hue-teal"],
  ["Get graded", "Every ticket is scored on the outcome and the process, with the control behind each decision.", "bg-brand-navy"],
  ["Live with the results", "Tickets stay open until they're actually fixed. Miss something and the requester replies, or it comes back as an incident. The GRC track then audits the shift.", "bg-hue-amber"],
];

const FAQ = [
  ["Who is Rolevara for?", "Anyone working in, or moving into, identity and access: service desk analysts, IAM analysts and engineers, GRC and audit staff, and the team leads who train them."],
  ["Do you need a lab tenant?", "No. The simulator runs in your browser. The platform labs (Microsoft Entra ID, Okta and AWS) are an optional extra in Pro + Labs, run in a free tenant you own."],
  ["What does the free plan include?", "Pacific Crest Logistics on all three paths (IAM only, IAM + GRC, GRC only), with the full ticket queue, reopened tickets, follow-up incidents and the audits. Pro features are free during early access."],
  ["Are the companies real?", "No. Every company and person in Rolevara is fictional."],
  ["Is the policy content compliance advice?", "No. The runbook policies are training material based on published frameworks, not legal or compliance advice."],
];

const STATS: [number, string][] = [[20, "Service desk tickets"], [13, "Follow-up incidents"], [10, "Audit tasks"], [131, "Directory accounts"]];

export default function Landing() {
  return (
    <MotionPauseProvider>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2">Skip to content</a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <Intro />
        {/* Hero on the brand's navy, using the dark palette for this section only. */}
        <section aria-labelledby="hero-h" data-theme="dark" className="bg-brand-band relative overflow-hidden text-foreground">
          <AnimatedBackdrop />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-14 md:px-6 lg:grid-cols-[1.05fr_1fr] lg:pb-24 lg:pt-20">
            <div className="space-y-7">
              <Reveal><p className="t-eyebrow">Job simulator for IAM, GRC and PAM</p></Reveal>
              <Reveal delay={0.05}><h1 id="hero-h" className="t-display text-white">Know you can do the job <span className="text-primary">before you get it.</span></h1></Reveal>
              <Reveal delay={0.1}><p className="t-lead max-w-xl">Work a realistic identity service desk and audit team. Set up and remove access, run access reviews, contain compromised accounts and prepare audit evidence, then see how every decision holds up.</p></Reveal>
              <Reveal delay={0.15} className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="h-12 rounded-xl px-7 text-base font-semibold"><a href="/app/">Start free <ArrowRight /></a></Button>
                <Button asChild size="lg" variant="outline" className="h-12 rounded-xl border-white/40 bg-transparent px-7 text-base font-semibold text-white hover:bg-white/10 hover:text-white"><a href="/tracks/">Explore tracks</a></Button>
              </Reveal>
              <Reveal delay={0.2}>
                <dl className="grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
                  {STATS.map(([n, l]) => (
                    <div key={l} className="flex flex-col-reverse rounded-xl border border-white/12 bg-white/5 p-3">
                      <dt className="t-meta">{l}</dt>
                      <dd className="font-display text-3xl font-bold text-white"><CountUp value={n} /></dd>
                    </div>))}
                </dl>
              </Reveal>
            </div>
            {/* min-w-0: the video's natural width must not stretch the grid column on phones. */}
            <Reveal from="right" delay={0.1} className="min-w-0">
              <HeroVideo />
              <div className="mt-3 flex justify-end"><PauseButton /></div>
            </Reveal>
          </div>
        </section>

        <section aria-label="Skills, platforms and frameworks" className="mx-auto max-w-7xl px-4 py-10 md:px-6"><SkillsStrip /></section>

        <section id="how" aria-labelledby="how-h" className="scroll-mt-24 mx-auto max-w-7xl px-4 py-20 md:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <Reveal className="max-w-3xl"><p className="t-eyebrow">How it works</p><h2 id="how-h" className="t-h1 mt-3">Learn by doing the actual job.</h2>
              <p className="t-lead mt-4">One company, one live service desk queue. No slides, no multiple choice.</p></Reveal>
            <IllusReopen className="hidden h-36 lg:block" />
          </div>
          <ol className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([t, d, c], i) => (
              <Reveal as="li" key={t} delay={i * 0.06} className="lift rounded-2xl border bg-card p-7">
                <span className={cn("grid size-10 place-items-center rounded-full font-display text-base font-bold text-white", c)} aria-hidden>{i + 1}</span>
                <h3 className="t-h3 mt-5"><span className="sr-only">Step {i + 1}: </span>{t}</h3>
                <p className="mt-2 text-muted-foreground">{d}</p>
              </Reveal>))}
          </ol>
        </section>

        <ChoosePath links="tracks" className="pt-0 pb-20" />

        <section id="capabilities" aria-labelledby="cap-h" className="scroll-mt-24 bg-card py-20">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <Reveal className="max-w-3xl"><p className="t-eyebrow">What you'll practise</p>
              <h2 id="cap-h" className="t-h1 mt-3">The work employers hire for.</h2>
              <p className="t-lead mt-4">Every scenario is graded on what you did and how you did it, and mapped to the controls auditors test.</p></Reveal>
            <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {CAPABILITIES.map((f, i) => (
                <Reveal as="li" key={f.title} delay={(i % 3) * 0.06} className="lift rounded-2xl border bg-background p-7">
                  <span className={cn("grid size-12 place-items-center rounded-xl", f.tint)}><f.icon className="size-6" aria-hidden /></span>
                  <h3 className="t-h3 mt-5 flex flex-wrap items-center gap-2">{f.title}{f.early && <EarlyAccess />}</h3>
                  <p className="mt-2 text-muted-foreground">{f.text}</p>
                </Reveal>))}
            </ul>
          </div>
        </section>

        <section id="industries" aria-labelledby="ind-h" className="scroll-mt-24 mx-auto max-w-7xl px-4 py-20 md:px-6">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-3xl"><p className="t-eyebrow">Companies</p><h2 id="ind-h" className="t-h1 mt-3">Six companies. Six rulebooks.</h2>
              <p className="t-lead mt-4">Each company has its own applications, access matrix, separation-of-duties rules and regulations, so no two shifts feel the same.</p></div>
            <Button asChild variant="outline" className="border-2 font-semibold"><a href="/industries/">See all companies <ArrowRight /></a></Button>
          </Reveal>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {INDUSTRIES.map((c, i) => (
              <Reveal as="li" key={c.id} delay={(i % 3) * 0.06} className="lift rounded-2xl border bg-card p-6">
                <div className="flex items-center justify-between gap-2"><p className="t-meta font-semibold">{c.industry}</p>{c.early && <EarlyAccess />}</div>
                <h3 className="t-h3 mt-2">{c.name}</h3>
                <p className="mt-1 text-[15px] text-muted-foreground">{c.frameworks}</p>
              </Reveal>))}
          </ul>
        </section>

        <section aria-labelledby="aud-h" className="overflow-x-clip bg-card py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 md:px-6 lg:grid-cols-2">
            <Reveal from="left"><Photo name="service-desk" className="aspect-[4/5] max-h-[640px] shadow-2xl" alt="A service desk analyst wearing a headset, working at a computer with colleagues behind her."
              credit="BaljkanN 4" profile="https://unsplash.com/@baljkann4" /></Reveal>
            <Reveal from="right" className="space-y-8">
              <div><p className="t-eyebrow">Who it's for</p><h2 id="aud-h" className="t-h1 mt-3">Built for every step of an identity career.</h2></div>
              <dl className="grid gap-6 sm:grid-cols-2">
                {AUDIENCES.map(([t, d]) => <div key={t} className="border-l-4 border-brand-teal pl-4"><dt className="font-display text-lg font-bold">{t}</dt><dd className="mt-1 text-muted-foreground">{d}</dd></div>)}
              </dl>
              <div className="grid gap-4 sm:grid-cols-2">
                <Photo name="mentoring" className="aspect-[3/2]" sizes="(min-width: 1024px) 25vw, 50vw" alt="A colleague points at a laptop screen while explaining something to a teammate." credit="Centre for Ageing Better" profile="https://unsplash.com/@ageing_better" />
                <Photo name="engineers" className="aspect-[3/2]" sizes="(min-width: 1024px) 25vw, 50vw" alt="Two engineers working side by side at computers in a bright office." credit="Tim van der Kuip" profile="https://unsplash.com/@timmykp" />
              </div>
            </Reveal>
          </div>
        </section>

        <section id="pricing" aria-labelledby="pricing-h" className="scroll-mt-24 px-4 py-20 md:px-6">
          <div className="mx-auto max-w-7xl"><Pricing /></div>
        </section>

        <section id="faq" aria-labelledby="faq-h" className="scroll-mt-24 mx-auto grid max-w-7xl gap-10 px-4 py-20 md:px-6 lg:grid-cols-[1fr_1.4fr]">
          <Reveal className="space-y-4"><p className="t-eyebrow">FAQ</p><h2 id="faq-h" className="t-h1">Common questions</h2>
            <IllusShield className="h-44" /></Reveal>
          <Accordion type="single" collapsible>
            {FAQ.map(([q, a]) => <AccordionItem key={q} value={q}><AccordionTrigger className="font-display text-lg font-semibold">{q}</AccordionTrigger><AccordionContent className="text-base text-muted-foreground">{a}</AccordionContent></AccordionItem>)}
          </Accordion>
        </section>

        <WaitlistBand />
      </main>
      <SiteFooter />
    </MotionPauseProvider>
  );
}
