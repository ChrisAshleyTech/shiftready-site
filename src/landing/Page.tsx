// Landing page. Enterprise tone, third person. Sections: hero, skills strip, capabilities, who it's
// for, industries, how it works, pricing, FAQ, waitlist. Photos: Unsplash License (credited).
import { ArrowRight, Bot, ClipboardCheck, FileBarChart2, KeyRound, ShieldAlert, UsersRound } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { AnimatedBackdrop, CountUp, MotionPauseProvider, PauseButton, Reveal } from "@/components/brand/motion";
import { IllusShield, IllusWeek } from "@/components/brand/illustrations";
import { SkillsStrip } from "@/components/brand/SkillsStrip";
import { EarlyAccess } from "@/components/brand/EarlyAccess";
import { SiteHeader, SiteFooter } from "@/marketing/chrome";
import { Photo, WaitlistBand } from "@/marketing/sections";
import { Pricing } from "@/marketing/Pricing";
import { ChoosePath } from "@/marketing/ChoosePath";
import { INDUSTRIES } from "@/marketing/catalog";
import { cn } from "@/lib/utils";
import { HeroVideo } from "./HeroVideo";

const CAPABILITIES: { icon: typeof UsersRound; tint: string; title: string; text: string; early?: boolean }[] = [
  { icon: UsersRound, tint: "bg-hue-blue/12 text-primary-strong", title: "Provisioning and lifecycle", text: "Joiner, mover, leaver and rehire requests provisioned from a role-based access matrix." },
  { icon: ClipboardCheck, tint: "bg-hue-violet/12 text-[color:var(--hue-violet)] dark:text-violet-300", title: "Access reviews and SoD", text: "Separation-of-duties conflicts, review revocations and requestable access with documented approvals." },
  { icon: KeyRound, tint: "bg-hue-amber/15 text-warn", title: "Privileged access", text: "Just-in-time elevation, break-glass accounts and privileged session review.", early: true },
  { icon: ShieldAlert, tint: "bg-hue-pink/12 text-bad", title: "Incident response", text: "Compromised accounts, MFA fatigue and post-termination activity, contained and escalated." },
  { icon: FileBarChart2, tint: "bg-hue-green/15 text-ok", title: "Audit readiness", text: "Provisioning, termination and review controls tested against the audit log of the shift just worked." },
  { icon: Bot, tint: "bg-hue-sky/15 text-info", title: "Coached, not answered", text: "Tiered hints that cost points and a rule-based tutor that asks the right questions instead of giving answers." },
];

const AUDIENCES = [
  ["Service desk and IT support", "Build lifecycle discipline: verify first, provision from the role, remove what the old role granted."],
  ["IAM analysts and engineers", "Rehearse edge cases such as rehires, service accounts and SoD conflicts before they reach production."],
  ["GRC, audit and compliance", "See controls from the operator's side, then test them against real evidence."],
  ["Team leads", "Baseline a team's skills with readiness reports scored by skill, with Solo and Assisted outcomes."],
];

const STEPS = [
  ["Work the queue", "Requests arrive from HR feeds, phone calls, security alerts and access reviews.", "bg-hue-blue"],
  ["Operate the directory", "Enable, disable, reset, change group membership and job data, set expiry, revoke sessions, escalate.", "bg-hue-violet"],
  ["Get graded", "Every ticket is scored on outcome and process, with the control behind each decision.", "bg-hue-pink"],
  ["Carry the consequences", "Thursday's queue is generated from Monday's decisions. The GRC track then audits the week.", "bg-hue-amber"],
];

const FAQ = [
  ["Who is Rolevara for?", "Identity and access professionals at every level: service desk analysts, IAM analysts and engineers, GRC and audit staff, and the team leads who develop them."],
  ["Is a lab tenant required?", "No. The simulator runs in the browser. The Entra ID lab, in early access, adds an optional path that uses a Microsoft Entra tenant."],
  ["What does the free tier include?", "Pacific Crest Logistics on all three paths (IAM only, IAM + GRC, GRC only), with both shifts, downstream consequences and the audits. Pro features are included free during early access."],
  ["Are the companies real?", "No. All companies and people in Rolevara scenarios are fictional."],
  ["Is the policy content compliance advice?", "No. Runbook policies are training material based on published frameworks, not legal or compliance advice."],
];

export default function Landing() {
  return (
    <MotionPauseProvider>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2">Skip to content</a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <section aria-labelledby="hero-h" className="relative overflow-hidden">
          <AnimatedBackdrop />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-14 md:px-6 lg:grid-cols-[1.05fr_1fr] lg:pb-24 lg:pt-20">
            <div className="space-y-7">
              <Reveal><p className="t-eyebrow">Identity and access skills platform</p></Reveal>
              <Reveal delay={0.05}><h1 id="hero-h" className="t-display">Identity and access skills, built on real operations work.</h1></Reveal>
              <Reveal delay={0.1}><p className="t-lead max-w-xl">Rolevara places identity and access professionals in a working service desk and audit function. Provision and deprovision access, run access reviews, contain compromised accounts and prepare audit evidence, then see how each decision holds up.</p></Reveal>
              <Reveal delay={0.15} className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="h-13 rounded-xl px-7 text-[17px] font-bold"><a href="/app/">Start free <ArrowRight /></a></Button>
                <Button asChild size="lg" variant="outline" className="h-13 rounded-xl border-2 px-7 text-[17px] font-bold"><a href="/tracks/">View tracks</a></Button>
              </Reveal>
              <Reveal delay={0.2}>
                <dl className="grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
                  {[[20, "service-desk tickets"], [13, "downstream consequences"], [10, "audit tasks"], [131, "directory accounts"]].map(([n, l]) => (
                    <div key={l} className="rounded-2xl border bg-card/85 p-3">
                      <dt className="t-meta">{l}</dt>
                      <dd className="font-display text-3xl font-extrabold text-primary-strong"><CountUp value={n as number} /></dd>
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

        <section id="capabilities" aria-labelledby="cap-h" className="scroll-mt-24 mx-auto max-w-7xl px-4 py-20 md:px-6">
          <Reveal className="max-w-3xl"><p className="t-eyebrow">Capabilities</p>
            <h2 id="cap-h" className="t-h1 mt-3">Skills that transfer to production.</h2>
            <p className="t-lead mt-4">Each scenario is graded on outcome and process and mapped to the controls auditors test.</p></Reveal>
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((f, i) => (
              <Reveal as="li" key={f.title} delay={(i % 3) * 0.06} className="lift rounded-3xl border bg-card p-7">
                <span className={cn("grid size-12 place-items-center rounded-2xl", f.tint)}><f.icon className="size-6" aria-hidden /></span>
                <h3 className="t-h3 mt-5 flex flex-wrap items-center gap-2">{f.title}{f.early && <EarlyAccess />}</h3>
                <p className="mt-2 text-muted-foreground">{f.text}</p>
              </Reveal>))}
          </ul>
        </section>

        <ChoosePath links="tracks" className="pt-0 pb-20" />

        <section aria-labelledby="aud-h" className="overflow-x-clip bg-card py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 md:px-6 lg:grid-cols-2">
            <Reveal from="left"><Photo name="service-desk" className="aspect-[4/5] max-h-[640px] shadow-2xl" alt="A service desk analyst wearing a headset, working at a computer with colleagues behind her."
              credit="BaljkanN 4" profile="https://unsplash.com/@baljkann4" /></Reveal>
            <Reveal from="right" className="space-y-8">
              <div><p className="t-eyebrow">Who it's for</p><h2 id="aud-h" className="t-h1 mt-3">For identity teams at every level.</h2></div>
              <dl className="grid gap-6 sm:grid-cols-2">
                {AUDIENCES.map(([t, d]) => <div key={t} className="border-l-4 border-primary pl-4"><dt className="font-display text-lg font-bold">{t}</dt><dd className="mt-1 text-muted-foreground">{d}</dd></div>)}
              </dl>
              <div className="grid gap-4 sm:grid-cols-2">
                <Photo name="mentoring" className="aspect-[3/2]" sizes="(min-width: 1024px) 25vw, 50vw" alt="A colleague points at a laptop screen while explaining something to a teammate." credit="Centre for Ageing Better" profile="https://unsplash.com/@ageing_better" />
                <Photo name="engineers" className="aspect-[3/2]" sizes="(min-width: 1024px) 25vw, 50vw" alt="Two engineers working side by side at computers in a bright office." credit="Tim van der Kuip" profile="https://unsplash.com/@timmykp" />
              </div>
            </Reveal>
          </div>
        </section>

        <section id="industries" aria-labelledby="ind-h" className="scroll-mt-24 mx-auto max-w-7xl px-4 py-20 md:px-6">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-3xl"><p className="t-eyebrow">Industries</p><h2 id="ind-h" className="t-h1 mt-3">Six industries. One engine.</h2>
              <p className="t-lead mt-4">Each company brings its own applications, access matrix, separation-of-duties rules and regulatory policies.</p></div>
            <Button asChild variant="outline" className="border-2 font-bold"><a href="/industries/">All industries <ArrowRight /></a></Button>
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

        <section id="how" aria-labelledby="how-h" className="scroll-mt-24 bg-card py-20">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
              <Reveal><p className="t-eyebrow">How it works</p><h2 id="how-h" className="t-h1 mt-3">One company. A full operating week.</h2></Reveal>
              <IllusWeek className="hidden h-36 lg:block" />
            </div>
            <ol className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {STEPS.map(([t, d, c], i) => (
                <Reveal as="li" key={t} delay={i * 0.06} className="lift rounded-3xl border bg-background p-7">
                  <span className={cn("grid size-11 place-items-center rounded-full font-display text-lg font-extrabold text-white", c)} aria-hidden>{i + 1}</span>
                  <h3 className="t-h3 mt-5"><span className="sr-only">Step {i + 1}: </span>{t}</h3>
                  <p className="mt-2 text-muted-foreground">{d}</p>
                </Reveal>))}
            </ol>
            <Reveal className="mt-10"><Photo name="team-room" className="aspect-[21/8] shadow-xl" sizes="100vw" alt="A team of analysts working at rows of computers in an open office."
              credit="RUT MIIT" profile="https://unsplash.com/@rutmiit" /></Reveal>
          </div>
        </section>

        <section id="pricing" aria-labelledby="pricing-h" className="scroll-mt-24 px-4 py-20 md:px-6">
          <div className="mx-auto max-w-7xl"><Pricing /></div>
        </section>

        <section id="faq" aria-labelledby="faq-h" className="scroll-mt-24 mx-auto grid max-w-7xl gap-10 px-4 py-20 md:px-6 lg:grid-cols-[1fr_1.4fr]">
          <Reveal className="space-y-4"><p className="t-eyebrow">FAQ</p><h2 id="faq-h" className="t-h1">Frequently asked questions</h2>
            <IllusShield className="h-44" /></Reveal>
          <Accordion type="single" collapsible>
            {FAQ.map(([q, a]) => <AccordionItem key={q} value={q}><AccordionTrigger className="font-display text-lg font-bold">{q}</AccordionTrigger><AccordionContent className="text-base text-muted-foreground">{a}</AccordionContent></AccordionItem>)}
          </Accordion>
        </section>

        <WaitlistBand />
      </main>
      <SiteFooter />
    </MotionPauseProvider>
  );
}
