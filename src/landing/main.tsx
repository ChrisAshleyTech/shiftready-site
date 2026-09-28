// Landing page, "Bright and Bold". Section order: hero, skills strip, features, people, how it
// works, learner stories (placeholder), pricing, FAQ, waitlist. Copy carried over from v1 where
// it existed. Photos: Unsplash License (credits in the captions and the README).
import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { ArrowRight, Bot, ClipboardCheck, FileBarChart2, Inbox, Lightbulb, MessageSquareQuote, Repeat2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { AnimatedBackdrop, CountUp, MotionPauseProvider, PauseButton, Reveal } from "@/components/brand/motion";
import { IllusChart, IllusShield, IllusWeek } from "@/components/brand/illustrations";
import { SkillsStrip } from "@/components/brand/SkillsStrip";
import { SiteHeader, SiteFooter, Waitlist } from "@/marketing/chrome";
import { Pricing } from "@/marketing/Pricing";
import { cn } from "@/lib/utils";
import { TicketDemo } from "./TicketDemo";
import "@/index.css";

const Eyebrow = ({ children, className }: { children: ReactNode; className?: string }) => <p className={cn("text-sm font-bold uppercase tracking-[0.14em] text-primary", className)}>{children}</p>;

function Photo({ name, alt, credit, profile, className, sizes = "(min-width: 1024px) 50vw, 100vw" }: { name: string; alt: string; credit: string; profile: string; className?: string; sizes?: string }) {
  return (
    <figure className={cn("relative overflow-hidden rounded-3xl", className)}>
      <img src={`/img/photos/${name}-1600.webp`} srcSet={`/img/photos/${name}-800.webp 800w, /img/photos/${name}-1600.webp 1600w`} sizes={sizes}
        alt={alt} loading="lazy" decoding="async" className="size-full object-cover" />
      <figcaption className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] text-white backdrop-blur">
        Photo: <a className="underline" href={profile} target="_blank" rel="noopener">{credit}</a> / Unsplash
      </figcaption>
    </figure>
  );
}

const FEATURES = [
  { icon: Inbox, tint: "bg-hue-blue/12 text-primary-strong", title: "A real ticket queue", text: "Joiners, movers, leavers, lockouts, access requests, SoD conflicts, a fake CFO on the phone and an MFA-fatigue attack, at one company with 131 accounts." },
  { icon: Repeat2, tint: "bg-hue-pink/12 text-bad", title: "Monday comes back Thursday", text: "Leave a stale account enabled and an attacker uses it. Disable the wrong service account and backups fail. Your next shift is built from your last one." },
  { icon: ClipboardCheck, tint: "bg-hue-violet/12 text-[color:var(--hue-violet)] dark:text-violet-300", title: "Audit your own work", text: "Switch to the GRC desk and test the controls you just operated, including the audit log of your own shift." },
  { icon: Lightbulb, tint: "bg-hue-amber/15 text-warn", title: "Hints that cost points", text: "A nudge, the policy clause, or the exact steps. Each tier costs part of the ticket's score, and exact steps marks it Assisted." },
  { icon: Bot, tint: "bg-hue-sky/15 text-info", title: "A tutor that won't cheat for you", text: "Ask about terms, people and roles, or what you've done so far. It asks the right questions instead of giving answers." },
  { icon: FileBarChart2, tint: "bg-hue-green/15 text-ok", title: "A report you can share", text: "Scores, skills, consequences and Solo vs Assisted on every ticket, in one link a hiring manager can open." },
];

const STEPS = [
  ["Take a ticket", "Pick up requests from HR feeds, phone calls, alerts and access reviews.", "bg-hue-blue"],
  ["Work the console", "Enable, disable, reset, change groups and job info, set expiry, revoke sessions, escalate.", "bg-hue-violet"],
  ["Get graded", "Scored on the result and the process, with the NIST control behind each decision.", "bg-hue-pink"],
  ["Live with it", "Thursday's queue is built from your Monday. Then audit the whole week as the GRC tester.", "bg-hue-amber"],
];

const FAQ = [
  ["Who is this for?", "Career changers and help desk techs moving into IAM, current analysts who want reps, and hiring managers who want to see how someone handles a real queue."],
  ["Do I need my own lab tenant?", "No. The simulator runs in your browser. Platform packs for your own Entra, Okta, AWS and Active Directory labs are coming for people who want to practise in the real consoles."],
  ["What does it cost?", "The free plan covers Pacific Crest Logistics, both shifts and the GRC track. Pro and Pro + Labs are on a waitlist; see pricing for what's included."],
  ["Is Pacific Crest a real company?", "No. Pacific Crest Logistics and everyone in it are fictional."],
];

function Landing() {
  return (
    <MotionPauseProvider>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2">Skip to content</a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        {/* Hero */}
        <section aria-labelledby="hero-h" className="relative overflow-hidden">
          <AnimatedBackdrop />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-14 md:px-6 lg:grid-cols-[1.05fr_1fr] lg:pb-24 lg:pt-20">
            <div className="space-y-7">
              <Reveal><span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-card/80 py-1 pl-1 pr-3 text-sm font-semibold shadow-sm backdrop-blur">
                <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-primary-foreground">Free</span>
                The Monday shift runs in your browser. No sign-up.</span></Reveal>
              <Reveal delay={0.05}><h1 id="hero-h" className="text-5xl font-extrabold leading-[1.02] sm:text-6xl xl:text-7xl">
                Work a real <span className="bg-gradient-to-r from-primary to-[color:var(--hue-violet)] bg-clip-text text-transparent dark:from-sky-300 dark:to-violet-300">IAM shift</span> before your first day.</h1></Reveal>
              <Reveal delay={0.1}><p className="max-w-xl text-xl leading-relaxed text-muted-foreground">Take the ticket queue at a 150-person company. Onboard, offboard, reset, deny, escalate. Then audit your own work. What you miss on Monday comes back on Thursday.</p></Reveal>
              <Reveal delay={0.15} className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="h-14 rounded-xl px-7 text-lg font-bold shadow-lg shadow-primary/30"><a href="/app/">Start the free Monday shift <ArrowRight /></a></Button>
                <Button asChild size="lg" variant="outline" className="h-14 rounded-xl border-2 border-primary/40 bg-card/70 px-7 text-lg font-bold"><a href="/pricing/">See pricing</a></Button>
              </Reveal>
              <Reveal delay={0.2}>
                <dl className="grid max-w-xl grid-cols-2 gap-4 sm:grid-cols-4">
                  {[[20, "Monday tickets"], [13, "consequences"], [10, "audit tasks"], [131, "accounts"]].map(([n, l]) => (
                    <div key={l} className="rounded-2xl border bg-card/80 p-3 backdrop-blur">
                      <dt className="text-xs font-semibold text-muted-foreground">{l}</dt>
                      <dd className="text-3xl font-extrabold text-primary-strong"><CountUp value={n as number} /></dd>
                    </div>))}
                </dl>
              </Reveal>
            </div>
            <Reveal from="right" delay={0.1} className="relative">
              <TicketDemo />
              <div className="mt-3 flex justify-end"><PauseButton /></div>
            </Reveal>
          </div>
        </section>

        {/* Skills strip */}
        <section aria-label="Platforms and frameworks" className="mx-auto max-w-7xl px-4 py-10 md:px-6"><SkillsStrip /></section>

        {/* Features */}
        <section id="features" aria-labelledby="features-h" className="scroll-mt-20 mx-auto max-w-7xl px-4 py-20 md:px-6">
          <Reveal className="mx-auto max-w-3xl text-center"><Eyebrow>Why it's different</Eyebrow>
            <h2 id="features-h" className="mt-3 text-4xl md:text-5xl">Other labs teach features. This teaches the job.</h2>
            <p className="mt-4 text-lg text-muted-foreground">Real IAM work is a queue: messy requests, approvals, people in a hurry, and decisions that have consequences.</p></Reveal>
          <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal as="li" key={f.title} delay={(i % 3) * 0.08} className="lift rounded-3xl border bg-card p-7">
                <span className={cn("grid size-14 place-items-center rounded-2xl", f.tint)}><f.icon className="size-7" aria-hidden /></span>
                <h3 className="mt-5 text-xl">{f.title}</h3>
                <p className="mt-2 text-muted-foreground">{f.text}</p>
              </Reveal>))}
          </ul>
        </section>

        {/* People */}
        <section aria-labelledby="people-h" className="bg-card py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 md:px-6 lg:grid-cols-2">
            <Reveal from="left"><Photo name="service-desk" className="aspect-[4/5] max-h-[640px] shadow-2xl" alt="A smiling service desk analyst wearing a headset, working at a computer with colleagues behind her."
              credit="BaljkanN 4" profile="https://unsplash.com/@baljkann4" /></Reveal>
            <Reveal from="right" className="space-y-6">
              <Eyebrow>Built for the people on the desk</Eyebrow>
              <h2 id="people-h" className="text-4xl md:text-5xl">Get the reps before the stakes are real.</h2>
              <p className="text-lg text-muted-foreground">Help desk techs moving into IAM, career changers, and analysts who want practice all hit the same wall: you can't learn judgment from a settings page. ShiftReady gives you a queue, a directory and consequences, then shows you exactly where you slipped.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Photo name="mentoring" className="aspect-[3/2]" sizes="(min-width: 1024px) 25vw, 50vw" alt="A mentor points at a laptop screen while explaining something to a colleague." credit="Centre for Ageing Better" profile="https://unsplash.com/@ageing_better" />
                <Photo name="engineers" className="aspect-[3/2]" sizes="(min-width: 1024px) 25vw, 50vw" alt="Two engineers working side by side at computers in a bright office." credit="Tim van der Kuip" profile="https://unsplash.com/@timmykp" />
              </div>
            </Reveal>
          </div>
        </section>

        {/* How it works */}
        <section id="how" aria-labelledby="how-h" className="scroll-mt-20 mx-auto max-w-7xl px-4 py-20 md:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <Reveal><Eyebrow>How it works</Eyebrow><h2 id="how-h" className="mt-3 text-4xl md:text-5xl">One company. A full week.</h2></Reveal>
            <IllusWeek className="hidden h-36 lg:block" />
          </div>
          <ol className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([t, d, c], i) => (
              <Reveal as="li" key={t} delay={i * 0.08} className="lift relative rounded-3xl border bg-card p-7">
                <span className={cn("grid size-12 place-items-center rounded-full text-lg font-extrabold text-white", c)} aria-hidden>{i + 1}</span>
                <h3 className="mt-5 text-xl"><span className="sr-only">Step {i + 1}: </span>{t}</h3>
                <p className="mt-2 text-muted-foreground">{d}</p>
              </Reveal>))}
          </ol>
          <Reveal className="mt-10"><Photo name="team-room" className="aspect-[21/8] shadow-xl" sizes="100vw" alt="A team of analysts working at rows of computers in an open office."
            credit="RUT MIIT" profile="https://unsplash.com/@rutmiit" /></Reveal>
        </section>

        {/* Learner stories (placeholder, no invented quotes) */}
        <section aria-labelledby="stories-h" className="mx-auto max-w-7xl px-4 pb-20 md:px-6">
          <Reveal className="grid items-center gap-8 rounded-3xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 md:grid-cols-[auto_1fr_auto] md:p-12">
            <span className="grid size-16 place-items-center rounded-2xl bg-primary text-primary-foreground"><MessageSquareQuote className="size-8" aria-hidden /></span>
            <div><h2 id="stories-h" className="text-3xl">Learner stories coming soon</h2>
              <p className="mt-2 text-lg text-muted-foreground">We're collecting stories from early learners. There are no testimonials here yet because we won't publish quotes that aren't real. Try the free shift and tell us how it went.</p></div>
            <Button asChild size="lg" className="h-12 font-bold"><a href="#waitlist">Share yours</a></Button>
          </Reveal>
        </section>

        {/* Pricing */}
        <section id="pricing" aria-labelledby="pricing-h" className="scroll-mt-20 relative overflow-hidden bg-card px-4 py-20 md:px-6">
          <div className="relative mx-auto max-w-7xl"><Pricing /></div>
        </section>

        {/* FAQ */}
        <section id="faq" aria-labelledby="faq-h" className="scroll-mt-20 mx-auto grid max-w-7xl gap-10 px-4 py-20 md:px-6 lg:grid-cols-[1fr_1.4fr]">
          <Reveal className="space-y-4"><Eyebrow>Questions</Eyebrow><h2 id="faq-h" className="text-4xl md:text-5xl">Before you start</h2>
            <IllusShield className="h-44" /></Reveal>
          <Accordion type="single" collapsible>
            {FAQ.map(([q, a]) => <AccordionItem key={q} value={q}><AccordionTrigger className="text-lg font-bold">{q}</AccordionTrigger><AccordionContent className="text-base text-muted-foreground">{a}</AccordionContent></AccordionItem>)}
          </Accordion>
        </section>

        {/* Waitlist */}
        <section id="waitlist" aria-labelledby="wl-h" className="scroll-mt-20 px-4 pb-24 md:px-6">
          <Reveal className="relative mx-auto grid max-w-6xl gap-10 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1d4ed8] via-[#2563eb] to-[#6d28d9] text-white p-8 md:grid-cols-2 md:p-14">
            <div className="relative space-y-4">
              <Eyebrow className="text-white">Early access</Eyebrow>
              <h2 id="wl-h" className="text-4xl">Get the full week when it opens.</h2>
              <p className="text-lg text-white">Join the waitlist for Pro, Pro + Labs or a platform pack. One email when it's ready. No spam, and no commitment to buy.</p>
              <IllusChart className="h-40" />
            </div>
            <div className="relative rounded-2xl bg-card p-6 text-card-foreground shadow-2xl"><Waitlist /></div>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
    </MotionPauseProvider>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><Landing /></StrictMode>);
