// Motion primitives for the marketing pages, built on CSS and IntersectionObserver (no animation
// library), and safe to pre-render: the server output is the finished, fully visible state, and
// motion is only added on the client when it's wanted.
// - Every looping animation reads one shared pause state (WCAG 2.2.2), exposed to CSS as
//   html[data-motion="paused"], and everything is static when the user prefers reduced motion.
// - Only content below the fold is hidden for a scroll reveal, so first-screen text paints at once.
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode, type CSSProperties } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const RM = "(prefers-reduced-motion: reduce)";
const subscribeRM = (cb: () => void) => { const m = matchMedia(RM); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); };
/** True when the user prefers reduced motion. False on the server and during hydration. */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeRM, () => matchMedia(RM).matches, () => false);
}

const PauseCtx = createContext<{ paused: boolean; toggle: () => void }>({ paused: false, toggle: () => {} });

export function MotionPauseProvider({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) document.documentElement.dataset.motion = "paused";
    else delete document.documentElement.dataset.motion;
  }, [paused]);
  return <PauseCtx.Provider value={{ paused, toggle: () => setPaused(p => !p) }}>{children}</PauseCtx.Provider>;
}
/** True when looping animations should stand still (user paused them, or prefers reduced motion). */
export function useStill() {
  const reduce = usePrefersReducedMotion();
  return reduce || useContext(PauseCtx).paused;
}

export function PauseButton({ className }: { className?: string }) {
  const { paused, toggle } = useContext(PauseCtx);
  if (usePrefersReducedMotion()) return null; // nothing moves, so there's nothing to pause
  return (
    <button type="button" onClick={toggle} aria-pressed={paused}
      className={cn("inline-flex h-9 items-center gap-1.5 rounded-full border border-input/60 bg-card/90 px-3 text-xs font-semibold text-foreground hover:bg-card", className)}>
      {paused ? <Play className="size-3.5" aria-hidden /> : <Pause className="size-3.5" aria-hidden />}
      {paused ? "Play animations" : "Pause animations"}
    </button>
  );
}

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Fades and slides content in once when it scrolls into view. Content already on screen at load,
 *  and everything under reduced motion, is shown immediately. */
export function Reveal({ children, className, delay = 0, from = "up", as: Tag = "div" }:
  { children: ReactNode; className?: string; delay?: number; from?: "up" | "left" | "right"; as?: "div" | "section" | "li" }) {
  const ref = useRef<HTMLElement>(null);
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || matchMedia(RM).matches || typeof IntersectionObserver === "undefined") return;
    if (el.getBoundingClientRect().top < innerHeight) return; // on screen at load: never hide it
    el.dataset.reveal = from;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.dataset.reveal = "in"; io.disconnect(); } }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [from]);
  const style = { "--reveal-delay": `${delay}s` } as CSSProperties;
  return <Tag ref={ref as never} className={className} style={style}>{children}</Tag>;
}

/** Counts up to `value` when scrolled into view. The final value is rendered first (and is what
 *  screen readers get), so nothing is wrong before scripts run. */
export function CountUp({ value, suffix = "", duration = 1.2, className }: { value: number; suffix?: string; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(value);
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia(RM).matches || typeof IntersectionObserver === "undefined") return;
    let raf = 0;
    const run = () => {
      const t0 = performance.now();
      const tick = (t: number) => { const p = Math.min(1, (t - t0) / (duration * 1000)); setN(Math.round(value * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick);
    };
    setN(0);
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { run(); io.disconnect(); } }, { threshold: 0.6 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value, duration]);
  return (
    <span ref={ref} className={className}>
      <span aria-hidden="true" className="tabular-nums">{n}{suffix}</span>
      <span className="sr-only">{value}{suffix}</span>
    </span>
  );
}

/** Slowly drifting blue gradients behind the hero. Decorative and cheap: soft radial gradients
 *  moved with transforms (no blur filters), paused by the shared control or reduced motion. */
export function AnimatedBackdrop({ className }: { className?: string }) {
  const blob = "absolute rounded-full anim-drift";
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className={cn(blob, "-left-40 -top-40 size-[44rem] bg-[radial-gradient(circle,rgb(56_189_248/0.45),transparent_65%)] dark:opacity-40")} />
      <div className={cn(blob, "right-[-16rem] top-0 size-[40rem] bg-[radial-gradient(circle,rgb(37_99_235/0.32),transparent_65%)] [animation-delay:-6s] dark:opacity-40")} />
      <div className={cn(blob, "bottom-[-18rem] left-1/3 size-[38rem] bg-[radial-gradient(circle,rgb(124_58_237/0.25),transparent_65%)] [animation-delay:-11s] dark:opacity-40")} />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(37_99_235/0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgb(37_99_235/0.07)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
    </div>
  );
}
