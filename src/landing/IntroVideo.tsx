// Opening film for the landing page: real stock footage (working from home, the commute, the office),
// then the 3D Rolevara door R and the logo end card. It plays over soft music, and the only voice is
// the closing line. Built by scripts/intro-video/ (see its README for the footage
// and how to rebuild). It autoplays muted and loops (browsers only autoplay silent video); "Sound on"
// unmutes it, and a caption carries the closing line. The shared Pause button stops it. The 2.3 MB file
// loads only after the page has, so it never competes with first paint. With reduced motion, the poster
// (the end card) is shown with an opt-in play button. The picture is also described in text.
import { useEffect, useRef, useState } from "react";
import { Play, Volume2, VolumeX } from "lucide-react";
import { useStill, usePrefersReducedMotion } from "@/components/brand/motion";

const STEPS = [
  "A woman works at a laptop at her desk at home, then a man works on his laptop on the sofa.",
  "A man walks between glass office buildings, then a woman with a coffee arrives at an office entrance and looks up.",
  "A team talks around a table in an office, a man smiles by an office window, and a woman in a blazer works at her laptop.",
  "A light sweeps across the 3D Rolevara door R, with warm light in the doorway, then the Rolevara logo and tagline.",
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
  const [sound, setSound] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const showVideo = mounted && (optIn || (!reduce && loaded));
  useEffect(() => {
    const v = video.current; if (!v) return;
    if (still && !optIn) v.pause(); else v.play().catch(() => { /* autoplay blocked: poster stays */ });
  }, [still, optIn, showVideo]);

  // Turning sound on starts the film again, so the music is heard from the start.
  const toggleSound = () => {
    const v = video.current; if (!v) return;
    v.muted = sound;
    if (!sound) { v.currentTime = 0; v.play().catch(() => {}); }
    setSound(!sound);
  };

  return (
    <figure className="w-full space-y-2">
      <div className="relative aspect-video overflow-hidden rounded-3xl bg-black shadow-2xl shadow-black/40 ring-1 ring-white/15">
        {showVideo ? (
          <video ref={video} className="size-full object-cover" muted={!sound} loop playsInline autoPlay={!reduce || optIn} controls={optIn}
            poster="/video/intro-poster.webp" preload="auto" aria-describedby="intro-desc" data-intro-video>
            <source src="/video/intro.webm" type="video/webm" />
            <source src="/video/intro.mp4" type="video/mp4" />
            <track kind="captions" src="/video/intro.vtt" srcLang="en" label="English" default />
          </video>
        ) : (
          <>
            <picture>
              <source srcSet="/video/intro-poster.webp" type="image/webp" />
              <img src="/video/intro-poster.jpg" width={1280} height={720} className="size-full object-cover" data-intro-still
                alt="The Rolevara logo with the tagline Experience the role. Master the work." />
            </picture>
            {mounted && reduce && <button type="button" onClick={() => setOptIn(true)} className="absolute bottom-4 left-4 inline-flex h-11 items-center gap-2 rounded-full bg-card/95 px-4 font-display text-sm font-bold text-foreground shadow-lg ring-1 ring-border hover:bg-card">
              <Play className="size-4" aria-hidden />Play the film
            </button>}
          </>
        )}
        {showVideo && !optIn && <button type="button" onClick={toggleSound} aria-pressed={sound}
          className="absolute bottom-3 right-3 inline-flex h-9 items-center gap-1.5 rounded-full border border-input/60 bg-card/90 px-3 text-xs font-semibold text-foreground hover:bg-card">
          {sound ? <Volume2 className="size-3.5" aria-hidden /> : <VolumeX className="size-3.5" aria-hidden />}{sound ? "Sound off" : "Sound on"}
        </button>}
      </div>
      <figcaption>
        <details className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-left text-[15px]">
          <summary className="cursor-pointer font-semibold">What the film shows</summary>
          <ol id="intro-desc" className="ml-5 list-decimal space-y-1 py-2 text-muted-foreground">{STEPS.map(s => <li key={s}>{s}</li>)}</ol>
        </details>
      </figcaption>
    </figure>
  );
}
