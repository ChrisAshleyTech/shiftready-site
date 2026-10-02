// Opening film for the landing page: real stock footage (someone working from home, people walking to
// the office), the 3D Rolevara door R, then a person in a suit at their desk. Built by
// scripts/intro-video/ (see its README for the footage and how to rebuild). Muted and looping; the shared
// Pause button stops it. The 1.4 MB file loads only after the page has, so it never competes with first
// paint. With reduced motion, the poster (the door R) is shown with an opt-in play button. The film is
// also described in text (WCAG 1.2.1: video-only content needs a text alternative).
import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { useStill, usePrefersReducedMotion } from "@/components/brand/motion";

const STEPS = [
  "A man works on his laptop on the sofa at home.",
  "A man walks between glass office buildings, then a woman with a coffee arrives at an office entrance and looks up.",
  "The camera circles the 3D Rolevara door R, with warm office light shining through the doorway, and pushes through it.",
  "Inside, a man in a suit works at his desk.",
];

export function IntroVideo() {
  const reduce = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
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
    <figure className="w-full space-y-2">
      <div className="relative aspect-video overflow-hidden rounded-3xl bg-black shadow-2xl shadow-black/40 ring-1 ring-white/15">
        {showVideo ? (
          <video ref={video} className="size-full object-cover" muted loop playsInline autoPlay={!reduce || optIn} controls={optIn}
            poster="/video/intro-poster.webp" preload="auto" aria-describedby="intro-desc" data-intro-video>
            <source src="/video/intro.webm" type="video/webm" />
            <source src="/video/intro.mp4" type="video/mp4" />
          </video>
        ) : (
          <>
            <picture>
              <source srcSet="/video/intro-poster.webp" type="image/webp" />
              <img src="/video/intro-poster.jpg" width={1280} height={720} className="size-full object-cover" data-intro-still
                alt="The Rolevara door R in 3D, with warm office light shining through the doorway." />
            </picture>
            {mounted && reduce && <button type="button" onClick={() => setOptIn(true)} className="absolute bottom-4 left-4 inline-flex h-11 items-center gap-2 rounded-full bg-card/95 px-4 font-display text-sm font-bold text-foreground shadow-lg ring-1 ring-border hover:bg-card">
              <Play className="size-4" aria-hidden />Play the film
            </button>}
          </>
        )}
      </div>
      <figcaption>
        <details className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-left text-[15px]">
          <summary className="cursor-pointer font-semibold">Film description</summary>
          <ol id="intro-desc" className="ml-5 list-decimal space-y-1 py-2 text-muted-foreground">{STEPS.map(s => <li key={s}>{s}</li>)}</ol>
        </details>
      </figcaption>
    </figure>
  );
}
