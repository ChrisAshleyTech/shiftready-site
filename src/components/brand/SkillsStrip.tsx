// Scrolling strip of skills, platforms and frameworks, on the 21st Logo Marquee. Text labels, not
// vendor logos. Only items that exist or are in active development; the latter are marked
// "early access" in text and for screen readers.
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
  return (
    <div className="space-y-3">
      <LogoMarquee items={items} label="Skills, platforms and frameworks covered" speed={40} gap={28} paused={still} />
      <div className="flex justify-end"><PauseButton /></div>
    </div>
  );
}
