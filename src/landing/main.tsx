// Landing page. Copy carried over from v1; hero adapted from the 21st Financial Hero.
import { StrictMode, useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import { ClipboardCheck, Inbox, Repeat2 } from "lucide-react";
import { HeroFinancial } from "@/components/ui/hero-financial";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/app/components/Logo";
import { cn } from "@/lib/utils";
import "@/index.css";

// Set this to your form endpoint when deployed (e.g. a Formspree or Tally endpoint URL).
const FORM_ENDPOINT = "";

const Brand = () => <a href="#top" className="flex items-center gap-2.5 font-display text-lg font-semibold"><Logo className="size-7" />ShiftReady</a>;
const Eyebrow = ({ children }: { children: string }) => <p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">{children}</p>;
const H2 = ({ children }: { children: string }) => <h2 className="mt-3 max-w-[22ch] text-3xl font-semibold md:text-4xl">{children}</h2>;
const Chip = ({ children, live }: { children: string; live?: boolean }) =>
  <span className={cn("rounded-md border px-2 py-0.5 text-xs font-medium", live ? "border-ok/30 bg-ok/12 text-ok" : "border-border bg-muted text-muted-foreground")}>{children}</span>;

function Waitlist() {
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = e.currentTarget, email = (f.elements.namedItem("email") as HTMLInputElement).value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setErr(true); setMsg("Enter a valid email address, like name@example.com."); (f.elements.namedItem("email") as HTMLInputElement).focus(); return; }
    setErr(false);
    if (!FORM_ENDPOINT) { setMsg("Preview only: the waitlist connects once the form endpoint is set."); return; }
    setMsg("Joining…");
    try {
      const r = await fetch(FORM_ENDPOINT, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify({ email, role: (f.elements.namedItem("role") as HTMLSelectElement).value }) });
      if (!r.ok) throw new Error();
      setMsg("You're on the list. Watch for one email when early access opens."); f.reset();
    } catch { setMsg("That didn't go through. Check your connection and try again."); }
  };
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="space-y-1.5"><Label htmlFor="email">Work or personal email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required aria-invalid={err || undefined} aria-describedby="formmsg" className="h-11" /></div>
      <div className="space-y-1.5"><Label htmlFor="role">Where are you now?</Label>
        <select id="role" name="role" className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
          {["Career changer into IAM", "Help desk / IT support", "IAM or security analyst", "Auditor / GRC", "Hiring manager or team lead", "Educator or bootcamp"].map(o => <option key={o}>{o}</option>)}
        </select></div>
      <Button type="submit" size="lg" className="w-full">Join the waitlist</Button>
      <p id="formmsg" role="status" className={cn("min-h-6 text-sm", err ? "text-bad" : "text-muted-foreground")}>{msg}</p>
    </form>
  );
}

function Landing() {
  return (
    <div id="top">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2">Skip to content</a>
      <HeroFinancial
        logo={<Brand />}
        nav={[{ href: "#how", label: "How it works" }, { href: "#tracks", label: "Tracks" }, { href: "#founder", label: "Founder" }, { href: "#faq", label: "FAQ" }]}
        cta={{ href: "/app/", label: "Try the free Monday shift" }}
        secondary={{ href: "#waitlist", label: "Join the waitlist" }}
        pill={{ tag: "Free", text: "The Monday shift runs in your browser. No sign-up." }}
        title={<>Work a real IAM shift <br className="hidden sm:block" />before your first day.</>}
        lead="Take the ticket queue at a 150-person company. Onboard, offboard, reset, deny, escalate. Then audit your own work. What you miss on Monday comes back on Thursday."
        proof={<ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">{[["20", "Monday tickets"], ["13", "consequences that can hit Thursday"], ["10", "audit tasks"]].map(([n, l]) => <li key={l}><b className="font-mono font-medium text-foreground">{n}</b> {l}</li>)}</ul>}
        image={{ src: "/img/app-queue.jpg", width: 2160, height: 1350, alt: "The ShiftReady ticket queue: a fake-CFO ticket graded 10 out of 10 because the caller's employee ID didn't match the directory, no credentials were changed, and it was escalated to Security." }}
      />

      <main id="main" tabIndex={-1} className="mx-auto max-w-7xl px-4 outline-none md:px-6">
        <section id="different" className="scroll-mt-20 border-b py-20">
          <Eyebrow>Why it's different</Eyebrow><H2>Other labs teach features. This teaches the job.</H2>
          <p className="mt-4 max-w-[62ch] text-lg text-muted-foreground">Most IAM training walks you through one setting at a time. Real IAM work is a queue: messy requests, approvals, people in a hurry, and decisions that have consequences.</p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[[Inbox, "A real queue", "Tickets, not tutorials", "Joiners, movers, leavers, lockouts, access requests, SoD conflicts, a fake CFO on the phone, and an MFA-fatigue attack, all at one company with 131 accounts."],
              [Repeat2, "Consequences", "Monday comes back Thursday", "Leave a stale account enabled and an attacker uses it. Disable the wrong service account and backups fail. Your next shift is built from your last one."],
              [ClipboardCheck, "Do it, then audit it", "Audit your own work", "Switch to the GRC desk and test the controls you just operated, including the audit log of your own shift. No other platform makes you do both sides."]]
              .map(([Icon, k, t, d]: any) => (
                <div key={t} className="rounded-xl border bg-card p-6">
                  <Icon className="size-5 text-primary" aria-hidden />
                  <p className="mt-4 font-mono text-xs text-primary">{k}</p>
                  <h3 className="mt-1 text-xl font-semibold">{t}</h3>
                  <p className="mt-2 text-muted-foreground">{d}</p>
                </div>))}
          </div>
        </section>

        <section id="how" className="scroll-mt-20 border-b py-20">
          <Eyebrow>How it works</Eyebrow><H2>One company. A full week.</H2>
          <ol className="mt-10 grid gap-px overflow-hidden rounded-xl border bg-border md:grid-cols-4">
            {[["Take a ticket", "Pick up requests from HR feeds, phone calls, alerts and access reviews."],
              ["Work the console", "Enable, disable, reset, change groups and job info, set expiry, revoke sessions, escalate."],
              ["Get graded", "Scored on the result and the process, with the NIST control behind each decision. Hints help, and cost points."],
              ["Live with it", "Thursday's queue is built from your Monday. Then audit the whole week as the GRC tester."]]
              .map(([t, d], i) => (
                <li key={t} className="bg-card p-6">
                  <span className="font-mono text-sm text-primary">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-2 text-lg font-semibold">{t}</h3>
                  <p className="mt-1 text-muted-foreground">{d}</p>
                </li>))}
          </ol>
        </section>

        <section id="tracks" className="scroll-mt-20 border-b py-20">
          <Eyebrow>Tracks</Eyebrow><H2>Start with IAM. Grow into the roles around it.</H2>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {[["IAM Ops", true, "Service desk IAM analyst. Two shifts, 20+ tickets, consequences between them.", ["JML", "MFA", "SoD", "Social engineering", "Incidents"]],
              ["GRC Audit", true, "IT auditor. Test controls, rate deficiencies, review a SOC 2 report, write the finding.", ["SOX ITGC", "Sampling", "SOC 2", "Risk"]],
              ["PAM", false, "Privileged access admin. Just-in-time admin requests, the vault, emergency accounts, session review.", ["JIT", "Break-glass", "Rotation"]],
              ["Platform packs", false, "Run the same scenarios in your own Entra ID, Active Directory, Okta and AWS labs, with scripts that load the company and grade your work.", ["Entra ID", "AD", "Okta", "AWS"]]]
              .map(([t, live, d, tags]: any) => (
                <div key={t} className="flex flex-col gap-3 rounded-xl border bg-card p-6">
                  <div className="flex items-center justify-between"><h3 className="text-xl font-semibold">{t}</h3><Chip live={live}>{live ? "Live" : "Coming"}</Chip></div>
                  <p className="text-muted-foreground">{d}</p>
                  <div className="flex flex-wrap gap-1.5">{tags.map((x: string) => <Chip key={x}>{x}</Chip>)}</div>
                </div>))}
          </div>
        </section>

        <section id="founder" className="scroll-mt-20 grid gap-8 border-b py-20 md:grid-cols-[1fr_1.3fr]">
          <div><Eyebrow>Founder</Eyebrow><p className="mt-4 font-display text-3xl font-semibold leading-tight">"I spent 16 years auditing access. I built the simulator I wish new analysts had."</p></div>
          <div className="space-y-4 text-muted-foreground">
            <p><b className="text-foreground">Christopher Ashley</b> has 16 years in audit and compliance, testing the controls that decide who gets access to what. Every ticket in ShiftReady is modeled on the failures auditors find in real companies: late terminations, copied access, approvals that shouldn't count.</p>
            <div className="flex flex-wrap gap-1.5">{["16 years audit & compliance", "CompTIA Security+", "B.S. Cybersecurity", "Entra ID · AWS IAM labs"].map(x => <Chip key={x}>{x}</Chip>)}</div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-20 border-b py-20">
          <Eyebrow>Questions</Eyebrow><H2>Before you start</H2>
          <Accordion type="single" collapsible className="mt-8 max-w-3xl">
            {[["Who is this for?", "Career changers and help desk techs moving into IAM, current analysts who want reps, and hiring managers who want to see how someone handles a real queue."],
              ["Do I need my own lab tenant?", "No. The simulator runs in your browser. Platform packs for your own Entra, Okta and AWS labs are coming for people who want to practice in the real consoles."],
              ["What does it cost?", "The Monday shift is free. Pricing for the full tracks goes to the waitlist first, with a founding-member price for early signups."],
              ["Is Pacific Crest a real company?", "No. Pacific Crest Logistics and everyone in it are fictional."]]
              .map(([q, a]) => <AccordionItem key={q} value={q}><AccordionTrigger className="text-base">{q}</AccordionTrigger><AccordionContent className="text-base text-muted-foreground">{a}</AccordionContent></AccordionItem>)}
          </Accordion>
        </section>

        <section id="waitlist" className="scroll-mt-20 py-20">
          <div className="grid gap-10 rounded-2xl border bg-card p-6 md:grid-cols-2 md:p-10">
            <div><Eyebrow>Early access</Eyebrow><H2>Get the full week when it opens.</H2>
              <p className="mt-4 text-muted-foreground">Join the waitlist for the PAM track, platform packs and founding-member pricing. One email when it's ready. No spam.</p></div>
            <Waitlist />
          </div>
        </section>
      </main>
      <footer className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 border-t px-4 py-8 text-sm text-muted-foreground md:px-6">
        <span>© 2026 ShiftReady. Pacific Crest Logistics is a fictional company.</span><span>Built for people breaking into IAM.</span>
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><Landing /></StrictMode>);
