// Pricing (display only, no payments). Paid tiers join the waitlist with the chosen tier.
export type Billing = "monthly" | "yearly";
export type Status = "live" | "soon" | "early";
export type Feature = { text: string; status: Status };
export type Tier = {
  id: "free" | "pro" | "labs";
  name: string;
  blurb: string;
  monthly: number;
  yearly: number;
  cta: string;
  badge?: string;
  features: Feature[];
};

export const TIERS: Tier[] = [
  { id: "free", name: "Free", blurb: "Everything you need to work your first shift.", monthly: 0, yearly: 0, cta: "Start free",
    features: [
      { text: "Pacific Crest Logistics", status: "live" },
      { text: "Both shifts: Monday and Thursday, with consequences", status: "live" },
      { text: "GRC audit track", status: "live" },
      { text: "Basic hints", status: "live" },
    ] },
  { id: "pro", name: "Pro", blurb: "Every company, every track, and the full coaching layer.", monthly: 15, yearly: 129, cta: "Join Pro waitlist",
    features: [
      { text: "Everything in Free", status: "live" },
      { text: "All 5 industry companies: Healthcare, Aerospace/Defense, Banking, SaaS, Retail", status: "soon" },
      { text: "PAM track", status: "soon" },
      { text: "Full hints and tutor", status: "early" },
      { text: "Readiness report", status: "early" },
    ] },
  { id: "labs", name: "Pro + Labs", blurb: "Practise the same scenarios in real consoles.", monthly: 20, yearly: 169, cta: "Join Pro + Labs waitlist", badge: "Most complete",
    features: [
      { text: "Everything in Pro", status: "live" },
      { text: "Platform packs: Entra ID, Okta, AWS, Active Directory", status: "soon" },
    ] },
];

export const ADDON = { name: "Single platform pack", price: 39, blurb: "One platform pack (Entra ID, Okta, AWS or Active Directory), one-time purchase. Includes 12 months of updates.", cta: "Join the pack waitlist" };

export const STATUS_LABEL: Record<Status, string> = { live: "", soon: "Coming soon", early: "Included free during early access" };

/** Whole-percent saving of yearly over 12 monthly payments. */
export const yearlySaving = (t: Tier) => (t.monthly ? Math.round((1 - t.yearly / (t.monthly * 12)) * 100) : 0);
export const perMonthYearly = (t: Tier) => Math.round((t.yearly / 12) * 100) / 100;

// ---------- Waitlist tier selection (shared between the pricing buttons and the form) ----------
export const WAITLIST_OPTIONS = [
  { value: "updates", label: "Just updates about the free version" },
  { value: "pro-monthly", label: "Pro, monthly ($15/mo)" },
  { value: "pro-yearly", label: "Pro, yearly ($129/yr)" },
  { value: "labs-monthly", label: "Pro + Labs, monthly ($20/mo)" },
  { value: "labs-yearly", label: "Pro + Labs, yearly ($169/yr)" },
  { value: "pack", label: "Single platform pack ($39 one-time)" },
] as const;
export type WaitlistTier = (typeof WAITLIST_OPTIONS)[number]["value"];

let chosen: WaitlistTier = "updates";
const listeners = new Set<() => void>();
export const getChosenTier = () => chosen;
export const subscribeTier = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export function chooseTier(t: WaitlistTier) {
  chosen = t; listeners.forEach(l => l());
  const form = document.getElementById("waitlist");
  form?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  requestAnimationFrame(() => document.getElementById("email")?.focus({ preventScroll: true }));
}
