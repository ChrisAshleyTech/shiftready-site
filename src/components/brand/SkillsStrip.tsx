// Scrolling strip of platforms and frameworks, on the 21st Logo Marquee. Text labels, not vendor
// logos (trademarks). Items marked `soon` are on the roadmap; the note under the strip says so.
import { LogoMarquee, type LogoMarqueeItem } from "@/components/ui/logo-marquee";
import { useStill, PauseButton } from "./motion";

const dot = (c: string) => <span className="size-2 rounded-full" style={{ background: c }} />;
const ITEMS: (LogoMarqueeItem & { soon?: boolean })[] = [
  { id: "entra", label: "Microsoft Entra ID", soon: true },
  { id: "okta", label: "Okta", soon: true },
  { id: "aws", label: "AWS IAM", soon: true },
  { id: "ad", label: "Active Directory", soon: true },
  { id: "sox", label: "SOX ITGC" },
  { id: "cmmc", label: "CMMC" },
  { id: "hipaa", label: "HIPAA", soon: true },
  { id: "nist", label: "NIST 800-53" },
  { id: "soc2", label: "SOC 2" },
  { id: "iso", label: "ISO 27001" },
  { id: "jml", label: "Joiner / mover / leaver" },
  { id: "pam", label: "Privileged access", soon: true },
];
const HUES = ["var(--hue-blue)", "var(--hue-violet)", "var(--hue-amber)", "var(--hue-pink)", "var(--hue-green)", "var(--hue-sky)"];

export function SkillsStrip() {
  const still = useStill();
  const items = ITEMS.map((it, i) => ({ ...it, label: it.soon ? `${it.label} (coming soon)` : it.label, mark: <>{dot(HUES[i % HUES.length])}<span className="text-sm font-semibold text-foreground/80">{ITEMS[i].label}{it.soon ? " *" : ""}</span></> }));
  return (
    <div className="space-y-3">
      <LogoMarquee items={items} label="Platforms and frameworks you practise" speed={40} gap={28} paused={still} />
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>* Coming soon: platform packs, the HIPAA scenarios (Healthcare company) and the PAM track.</span>
        <PauseButton />
      </div>
    </div>
  );
}
