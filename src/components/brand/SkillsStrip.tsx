// Scrolling strip of skills, platforms and frameworks, on the 21st Logo Marquee. Text labels, not
// vendor logos. Only items that exist or are in active development; the latter are marked
// "early access" in text and for screen readers.
import { useEffect, useState } from "react";
import { LogoMarquee, type LogoMarqueeItem } from "@/components/ui/logo-marquee";
import { useStill, PauseButton } from "./motion";

const dot = (c: string) => <span className="size-2 rounded-full" style={{ background: c }} />;
const ITEMS: (LogoMarqueeItem & { early?: boolean })[] = [
  { id: "jml", label: "Joiner / mover / leaver" },
  { id: "reviews", label: "Access reviews" },
  { id: "sod", label: "Separation of duties" },
  { id: "ir", label: "Incident response" },
  { id: "pam", label: "Privileged access", early: true },
  { id: "entra", label: "Microsoft Entra ID", early: true },
  { id: "sox", label: "SOX ITGC" },
  { id: "nist", label: "NIST 800-53" },
  { id: "soc2", label: "SOC 2" },
  { id: "iso", label: "ISO 27001" },
  { id: "cmmc", label: "CMMC", early: true },
  { id: "hipaa", label: "HIPAA", early: true },
  { id: "glba", label: "GLBA", early: true },
  { id: "pci", label: "PCI DSS", early: true },
];
const HUES = ["var(--hue-blue)", "var(--hue-violet)", "var(--hue-amber)", "var(--hue-pink)", "var(--hue-green)", "var(--hue-sky)"];

export function SkillsStrip() {
  const still = useStill();
  const items = ITEMS.map((it, i) => ({
    ...it,
    label: it.early ? `${it.label} (early access)` : it.label,
    mark: <>{dot(HUES[i % HUES.length])}<span className="text-[15px] font-semibold text-foreground/80">{it.label}</span>
      {it.early && <span className="rounded-full border border-primary/30 px-1.5 text-[10px] font-semibold text-primary-strong">Early access</span>}</>,
  }));
  // The vendored marquee reads reduced-motion during render, so it can't be pre-rendered
  // consistently. Server and first client render show the same static list; the marquee mounts after.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div className="space-y-3">
      {mounted
        ? <LogoMarquee items={items} label="Skills, platforms and frameworks covered" speed={40} gap={28} paused={still} />
        : <section aria-label="Skills, platforms and frameworks covered" className="overflow-hidden rounded-[14px] border bg-card py-2">
            <ul className="flex w-max items-center gap-7 px-3">{items.map(it => <li key={it.id} className="inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap"><span className="sr-only">{it.label}</span><span aria-hidden className="inline-flex items-center gap-2">{it.mark}</span></li>)}</ul>
          </section>}
      <div className="flex justify-end"><PauseButton /></div>
    </div>
  );
}
