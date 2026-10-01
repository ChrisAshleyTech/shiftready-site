// Hero product video: a muted, looping walkthrough recorded from the real app
// (scripts/record-demo.mjs). The shared Pause button stops it. With reduced motion, a still image
// is shown instead, with an opt-in play button. The walkthrough is also described in text
// (WCAG 1.2.1: video-only content needs a text alternative).
import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";

import { useStill, usePrefersReducedMotion } from "@/components/brand/motion";

const STEPS = [
  "The queue has one ticket left: a caller claiming to be the CFO wants MFA moved to a new phone before a wire deadline.",
  "The analyst starts work and opens the first hint, which costs 10% of the ticket's score.",
  "The caller's employee ID (10020) doesn't match the directory (10002), so the ticket is escalated to the Security team and rejected.",
  "The ticket is graded 9 out of 10: every check passes, less the hint penalty.",
  "Later in the shift, a stale account left enabled earlier has been used in a password spray, and lands in the queue as a new incident traced back to that decision.",
];

export function HeroVideo() {
  const reduce = usePrefersReducedMotion();
  // Render the poster until mounted, so the pre-rendered HTML and first client render match.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Swap the poster for the 1 MB video only after the page has loaded, so it never competes with first paint.
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const go = () => setLoaded(true);
    if (document.readyState === "complete") go(); else addEventListener("load", go, { once: true });
    return () => removeEventListener("load", go);
  }, []);
  const still = useStill();
  const [optIn, setOptIn] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const showVideo = mounted && (optIn || (!reduce && loaded));
  useEffect(() => {
    const v = video.current; if (!v) return;
    if (still && !optIn) v.pause(); else v.play().catch(() => { /* autoplay blocked: poster stays */ });
  }, [still, optIn, showVideo]);

  return (
    <figure className="min-w-0 space-y-3">
      <div className="overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-primary/15">
        <div aria-hidden className="flex items-center gap-1.5 border-b bg-muted/60 px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-hue-pink" /><span className="size-2.5 rounded-full bg-hue-amber" /><span className="size-2.5 rounded-full bg-hue-green" />
          <span className="ml-3 truncate font-mono text-[11px] text-muted-foreground">verdelit / app / ticket queue</span>
        </div>
        <div className="relative aspect-[8/5] bg-muted">
          {showVideo ? (
            <video ref={video} className="size-full object-cover" muted loop playsInline autoPlay={!reduce || optIn} controls={optIn}
              poster="/video/demo-poster.webp" preload="metadata" aria-describedby="demo-desc" data-hero-video>
              <source src="/video/demo.webm" type="video/webm" />
              <source src="/video/demo.mp4" type="video/mp4" />
            </video>
          ) : (
            <>
              <picture>
                <source srcSet="/video/demo-poster.webp" type="image/webp" />
                <img src="/video/demo-poster.jpg" width={1280} height={800} className="size-full object-cover" data-hero-still
                  alt="The ticket queue showing a new incident, Dormant account signed in from unknown IP, traced back to an earlier decision." />
              </picture>
              {mounted && <button type="button" onClick={() => setOptIn(true)} className="absolute bottom-4 left-4 inline-flex h-11 items-center gap-2 rounded-full bg-card/95 px-4 font-display text-sm font-bold shadow-lg ring-1 ring-border hover:bg-card">
                <Play className="size-4" aria-hidden />Play the walkthrough
              </button>}
            </>
          )}
        </div>
      </div>
      <figcaption>
        <details className="rounded-xl border bg-card/80 px-4 py-2 text-[15px]">
          <summary className="cursor-pointer font-semibold">Video description</summary>
          <ol id="demo-desc" className="ml-5 list-decimal space-y-1 py-2 text-muted-foreground">{STEPS.map(s => <li key={s}>{s}</li>)}</ol>
        </details>
      </figcaption>
    </figure>
  );
}
