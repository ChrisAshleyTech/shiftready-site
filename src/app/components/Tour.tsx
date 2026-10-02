// The guided walkthrough: dims the screen, highlights one part of it and explains it in a card.
// Steps open their own screen, so the tour follows the real workflow from the queue to closing.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { endTour, goStep, shouldAutoStart, startTour, tourSteps, useTourStep, type TourStep } from "../tour";

type Box = { top: number; left: number; width: number; height: number };
const PAD = 8, GAP = 14, CARD_W = 360;

const find = (t: string) => document.querySelector<HTMLElement>(t === "page-title" ? "[data-page-title]" : t.startsWith("[") ? t : `[data-tour="${t}"]`);
const visible = (el: HTMLElement) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };

export function Tour({ route }: { route: string }) {
  const i = useTourStep();
  const steps = useRef<TourStep[]>([]);
  const [box, setBox] = useState<Box | null>(null);
  const [ready, setReady] = useState(false);
  const card = useRef<HTMLDivElement>(null);
  const [cardH, setCardH] = useState(260);

  // Run once on the first visit, after the home screen has rendered.
  useEffect(() => {
    if (route !== "home" || !shouldAutoStart()) return;
    const t = setTimeout(() => { if (shouldAutoStart()) startTour(); }, 600);
    return () => clearTimeout(t);
  }, [route]);

  if (i === 0 && !steps.current.length) steps.current = tourSteps();
  if (i === null && steps.current.length) steps.current = [];
  const s = i === null ? null : steps.current[i];

  // Open the step's screen, wait for its target (screens load on demand), then measure it.
  useEffect(() => {
    if (!s) return;
    setReady(false); setBox(null);
    if (location.hash.split("?")[0] !== s.hash) location.hash = s.hash;
    let tries = 0, raf = 0, el: HTMLElement | null = null;
    const measure = () => {
      if (!el || !visible(el)) { setBox(null); return; }
      const r = el.getBoundingClientRect();
      // Clip very tall targets to the viewport so the card still fits beside them.
      const top = Math.max(r.top, 8), bottom = Math.min(r.bottom, innerHeight - 8);
      setBox({ top: top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: Math.max(bottom - top, 24) + PAD * 2 });
    };
    const wait = () => {
      el = s.target ? find(s.target) : null;
      if (s.target && (!el || !visible(el)) && ++tries < 50) { raf = requestAnimationFrame(wait); return; }
      // Phones show the card as a bottom sheet, so the target goes near the top of the screen.
      if (el && visible(el)) {
        const narrow = innerWidth < 640, margin = el.style.scrollMarginTop;
        if (narrow) el.style.scrollMarginTop = "72px";
        el.scrollIntoView({ block: narrow ? "start" : "center", behavior: "instant" as ScrollBehavior });
        el.style.scrollMarginTop = margin;
      }
      else el = null;
      raf = requestAnimationFrame(() => { measure(); setReady(true); });
    };
    // Let the route change render before looking for the target.
    raf = requestAnimationFrame(() => requestAnimationFrame(wait));
    addEventListener("resize", measure); addEventListener("scroll", measure, true);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", measure); removeEventListener("scroll", measure, true); };
  }, [s]);

  // On phones the bottom sheet covers the lower half, so give short screens room to scroll a
  // target near the bottom up above it.
  const on = i !== null;
  useEffect(() => {
    if (!on) return;
    const pad = document.body.style.paddingBottom;
    document.body.style.paddingBottom = "60svh";
    return () => { document.body.style.paddingBottom = pad; };
  }, [on]);

  useLayoutEffect(() => { if (card.current) setCardH(card.current.offsetHeight); }, [s, ready, box]);
  useEffect(() => { if (ready) card.current?.focus({ preventScroll: true }); }, [ready, i]);
  useEffect(() => {
    if (!s) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); endTour(); }
      else if (e.key === "ArrowRight" && i! < steps.current.length - 1) goStep(i! + 1);
      else if (e.key === "ArrowLeft" && i! > 0) goStep(i! - 1);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [s, i]);

  if (!s || i === null) return null;
  const n = steps.current.length, last = i === n - 1;

  // Card beside the highlight: below it, else above it, else centred. Phones get a bottom sheet.
  const narrow = innerWidth < 640;
  let pos: React.CSSProperties;
  if (narrow) pos = { left: 12, right: 12, bottom: 12 };
  else if (!box) pos = { left: "50%", top: "50%", width: CARD_W, transform: "translate(-50%, -50%)" };
  else {
    const left = Math.min(Math.max(box.left, 12), innerWidth - CARD_W - 12);
    if (box.top + box.height + GAP + cardH < innerHeight - 12) pos = { left, top: box.top + box.height + GAP, width: CARD_W };
    else if (box.top - GAP - cardH > 12) pos = { left, top: box.top - GAP - cardH, width: CARD_W };
    else if (box.left + box.width + GAP + CARD_W < innerWidth - 12) pos = { left: box.left + box.width + GAP, top: Math.max(12, Math.min(box.top, innerHeight - cardH - 12)), width: CARD_W };
    else pos = { left: "50%", top: "50%", width: CARD_W, transform: "translate(-50%, -50%)" };
  }

  return (
    <div className="fixed inset-0 z-[70]" data-tour-overlay>
      {/* The highlight cuts a hole in the dimmed screen with an outsized shadow. */}
      {box ? <div aria-hidden className="pointer-events-none fixed rounded-xl ring-2 ring-primary transition-all duration-200"
        style={{ ...box, boxShadow: "0 0 0 9999px rgb(5 15 35 / 0.6)" }} />
        : <div aria-hidden className="fixed inset-0 bg-[rgb(5_15_35/0.6)]" />}
      <div ref={card} role="dialog" aria-modal="true" aria-labelledby="tour-h" aria-describedby="tour-b" tabIndex={-1}
        className="fixed rounded-2xl border bg-card p-5 text-card-foreground shadow-2xl outline-none" style={{ ...pos, visibility: ready ? "visible" : "hidden" }}>
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">How it works · {i + 1} of {n}</p>
          <button type="button" onClick={endTour} aria-label="Close the tour" className="-m-1 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="size-4" /></button>
        </div>
        <h2 id="tour-h" className="mt-1 font-sans text-lg font-semibold">{s.title}</h2>
        <p id="tour-b" className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">{s.body}</p>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-muted" aria-hidden><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((i + 1) / n) * 100}%` }} /></div>
        <div className="mt-4 flex items-center justify-between gap-2">
          {last ? <span /> : <Button variant="ghost" size="sm" onClick={endTour}>Skip tour</Button>}
          <div className="flex gap-2">
            {i > 0 && <Button variant="outline" size="sm" onClick={() => goStep(i - 1)}>Back</Button>}
            <Button size="sm" onClick={() => (last ? endTour() : goStep(i + 1))}>{last ? "Got it, let's work" : i === 0 ? "Show me" : "Next"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
