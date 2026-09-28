// Motion primitives for the Bright and Bold look. Every looping animation reads one shared pause
// state (WCAG 2.2.2: moving content that lasts more than 5 seconds needs a pause control), and
// everything is static when the user prefers reduced motion.
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const PauseCtx = createContext<{ paused: boolean; toggle: () => void }>({ paused: false, toggle: () => {} });

export function MotionPauseProvider({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(false);
  return <PauseCtx.Provider value={{ paused, toggle: () => setPaused(p => !p) }}>{children}</PauseCtx.Provider>;
}
/** True when looping animations should stand still (user paused them, or prefers reduced motion). */
export function useStill() {
  const reduce = useReducedMotion();
  return !!reduce || useContext(PauseCtx).paused;
}

export function PauseButton({ className }: { className?: string }) {
  const { paused, toggle } = useContext(PauseCtx);
  const reduce = useReducedMotion();
  if (reduce) return null; // nothing moves, so there's nothing to pause
  return (
    <button type="button" onClick={toggle} aria-pressed={paused}
      className={cn("inline-flex h-9 items-center gap-1.5 rounded-full border border-input/60 bg-card/90 px-3 text-xs font-semibold text-foreground backdrop-blur hover:bg-card", className)}>
      {paused ? <Play className="size-3.5" aria-hidden /> : <Pause className="size-3.5" aria-hidden />}
      {paused ? "Play animations" : "Pause animations"}
    </button>
  );
}

/** Fades and slides children in once, when they scroll into view. */
export function Reveal({ children, className, delay = 0, from = "up", as = "div" }:
  { children: ReactNode; className?: string; delay?: number; from?: "up" | "left" | "right"; as?: "div" | "section" | "li" }) {
  const reduce = useReducedMotion();
  if (reduce) { const Tag = as; return <Tag className={className}>{children}</Tag>; }
  const M = motion[as];
  const offset = from === "up" ? { y: 28 } : { x: from === "left" ? -36 : 36 };
  return (
    <M className={className} initial={{ opacity: 0, ...offset }} whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </M>
  );
}

/** Counts up to `value` when scrolled into view. Screen readers get the final value only. */
export function CountUp({ value, suffix = "", duration = 1.2, className }: { value: number; suffix?: string; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? value : 0);
  useEffect(() => {
    if (reduce || !inView) { if (reduce) setN(value); return; }
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / (duration * 1000));
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, value, duration]);
  return (
    <span ref={ref} className={className}>
      <span aria-hidden="true" className="tabular-nums">{n}{suffix}</span>
      <span className="sr-only">{value}{suffix}</span>
    </span>
  );
}

/** Slowly drifting blue gradient blobs behind the hero. Decorative. */
export function AnimatedBackdrop({ className }: { className?: string }) {
  const still = useStill();
  const blob = "absolute rounded-full blur-3xl opacity-60 dark:opacity-30 will-change-transform";
  const anim = still ? "" : "animate-[drift_18s_ease-in-out_infinite_alternate]";
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className={cn(blob, anim, "-left-24 -top-24 size-[34rem] bg-hue-sky/60")} />
      <div className={cn(blob, anim, "right-[-10rem] top-10 size-[30rem] bg-hue-blue/45 [animation-delay:-6s]")} />
      <div className={cn(blob, anim, "bottom-[-12rem] left-1/3 size-[28rem] bg-hue-violet/35 [animation-delay:-11s]")} />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(37_99_235/0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgb(37_99_235/0.07)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
    </div>
  );
}
