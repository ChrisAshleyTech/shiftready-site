// Looping demo of a ticket being worked (INC0041207, forgot password), built from real engine data.
// Pauses with the shared Pause button; shows the finished state under reduced motion. Screen
// readers get one description instead of a stream of changing text.
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, KeyRound, MousePointer2, Phone, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStill } from "@/components/brand/motion";
import { DEMO_CHECKS, DEMO_DIRECTORY, DEMO_LOG, DEMO_STEPS, DEMO_TICKET } from "./demoScript";

const DURATION = [1600, 1500, 2200, 1500, 1800, 1500, 3800];

function Btn({ on, children, primary }: { on: boolean; children: React.ReactNode; primary?: boolean }) {
  return (
    <span className={cn("relative inline-flex h-8 items-center rounded-lg border px-3 text-xs font-semibold transition-all duration-300",
      primary ? "border-primary bg-primary text-primary-foreground" : "border-input/50 bg-card", on && "scale-95 ring-4 ring-primary/30")}>
      {children}
      {on && <MousePointer2 className="absolute -bottom-3 -right-3 size-5 fill-foreground text-card drop-shadow" aria-hidden />}
    </span>
  );
}

export function TicketDemo() {
  const still = useStill();
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (still) return;
    const t = setTimeout(() => setStep(s => (s + 1) % DEMO_STEPS.length), DURATION[step]);
    return () => clearTimeout(t);
  }, [step, still]);
  const s = still ? DEMO_STEPS.length - 1 : step;
  const status = s >= 5 ? ["Resolved", "bg-ok/12 text-ok"] : s >= 1 ? ["In progress", "bg-primary/12 text-primary"] : ["New", "bg-muted text-muted-foreground"];
  const t = DEMO_TICKET;

  return (
    <figure className="relative">
      <figcaption className="sr-only">Demo: an analyst takes ticket {t.id} ({t.title}), checks the caller's employee ID and manager against the directory, marks identity verified, resets the password, resolves the ticket and scores 8 out of 8.</figcaption>
      <div aria-hidden className="overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-primary/15">
        <div className="flex items-center gap-1.5 border-b bg-muted/60 px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-hue-pink" /><span className="size-2.5 rounded-full bg-hue-amber" /><span className="size-2.5 rounded-full bg-hue-green" />
          <span className="ml-3 truncate font-mono text-[11px] text-muted-foreground">shiftready / queue / {t.id}</span>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">P{t.pri}</span>
            <span className="font-mono text-xs text-muted-foreground">{t.id}</span>
            <motion.span key={status[0]} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", status[1])}>{status[0]}</motion.span>
          </div>
          <p className="text-lg font-bold leading-snug">{t.title}</p>

          <div className={cn("grid gap-2 rounded-xl border p-3 text-xs transition-colors duration-500 sm:grid-cols-2", s === 2 && "border-primary bg-primary/5")}>
            <div><p className="mb-1 flex items-center gap-1 font-semibold text-muted-foreground"><Phone className="size-3" />Caller says</p>
              <p>Employee ID <b className="font-mono">{t.caller.empId}</b></p><p>Manager {t.caller.mgr}</p></div>
            <div><p className="mb-1 flex items-center gap-1 font-semibold text-muted-foreground"><ShieldCheck className="size-3" />Directory</p>
              {[["Employee ID", DEMO_DIRECTORY.empId], ["Manager", DEMO_DIRECTORY.mgr]].map(([k, v]) => (
                <p key={k} className="flex items-center gap-1">{k} <b className={k === "Employee ID" ? "font-mono" : ""}>{v}</b>
                  {s >= 2 && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}><Check className="size-3.5 text-ok" strokeWidth={3} /></motion.span>}</p>))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Btn on={s === 1} primary={s === 0}>Start work</Btn>
            <Btn on={s === 3}>Mark identity verified</Btn>
            <Btn on={s === 4}><KeyRound className="mr-1 size-3" />Reset password</Btn>
            <Btn on={s === 5} primary={s >= 3 && s < 6}>Resolve</Btn>
          </div>

          <div className="min-h-[4.5rem] space-y-1 rounded-xl bg-muted/50 p-3 font-mono text-[11px]">
            <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Audit log</p>
            <AnimatePresence initial={false}>
              {DEMO_LOG.filter(l => s >= l.at).map(l => (
                <motion.p key={l.text} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="truncate">
                  <span className="text-muted-foreground">{l.t}</span> {t.id} · {l.text}</motion.p>))}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {s === 6 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl border-2 border-ok/40 bg-ok/8 p-3">
                <div className="mb-1 flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-ok">Grade</span><span className="font-mono text-2xl font-bold">8/8</span></div>
                {DEMO_CHECKS.map((c, i) => (
                  <motion.p key={c.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 * i }} className="flex items-center gap-1.5 text-xs">
                    <Check className="size-3.5 text-ok" strokeWidth={3} />{c.label}<span className="ml-auto font-mono text-muted-foreground">{c.pts}/{c.pts}</span></motion.p>))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div aria-hidden className="mt-3 flex items-center gap-1.5">
        {DEMO_STEPS.map((label, i) => <span key={label} title={label} className={cn("h-1.5 flex-1 rounded-full bg-primary/15 transition-colors", i <= s && "bg-primary")} />)}
      </div>
      <p aria-hidden className="mt-2 text-sm font-medium text-muted-foreground">Step {s + 1} of {DEMO_STEPS.length}: {DEMO_STEPS[s]}</p>
    </figure>
  );
}
