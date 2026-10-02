// Pricing (display only, no payments). Paid tiers join the waitlist with the chosen tier.
export type Billing = "monthly" | "yearly";
export type Status = "live" | "early";
export type Feature = { text: string; status: Status };
export type Tier = {
  id: "free" | "pro" | "labs";
  name: string;
  blurb: string;
  monthly: number;
  yearly: number;
  /** Free-trial length in days, if the plan has one. */
  trialDays?: number;
  cta: string;
  badge?: string;
  features: Feature[];
};

// Prices live here only: the cards, pricing questions and waitlist labels all read them.
export const PRICES = {
  pro: { monthly: 15, yearly: 129, trialDays: 14 },
  labs: { monthly: 29, yearly: 249 },
};
export const CANCEL_ANYTIME = "Cancel anytime";

// Only features that exist ("live") or are in active development ("early").
export const TIERS: Tier[] = [
  { id: "free", name: "Free", blurb: "The complete Pacific Crest Logistics scenario.", monthly: 0, yearly: 0, cta: "Start free",
    features: [
      { text: "Pacific Crest Logistics (logistics)", status: "live" },
      { text: "All three paths: IAM only, IAM + GRC, and GRC only", status: "live" },
      { text: "A live ticket queue: requesters reply when a fix fails, and missed work returns as incidents", status: "live" },
      { text: "Self-audit of your own shift, and a GRC-only audit of a simulated analyst", status: "live" },
      { text: "Framework panels: NIST, HIPAA, ISO 27001, SOC 2 and PCI DSS", status: "live" },
      { text: "Basic hints", status: "live" },
    ] },
  { id: "pro", name: "Pro", blurb: "The realistic simulator: every industry scenario, every track and full coaching.", ...PRICES.pro, cta: "Join Pro waitlist",
    features: [
      { text: "Everything in Free", status: "live" },
      { text: "Industry companies: Harbor Health Network, Meridian Aerospace, Coastline Credit Union, Brightpath SaaS, Sunset Retail Group", status: "early" },
      { text: "PAM track", status: "early" },
      { text: "Full hints and guided tutor", status: "live" },
      { text: "Shareable readiness report", status: "live" },
    ] },
  { id: "labs", name: "Pro + Labs", blurb: "The simulator plus real tenants. Practice in the consoles employers use.", ...PRICES.labs, cta: "Join Pro + Labs waitlist", badge: "Most complete",
    features: [
      { text: "Everything in Pro", status: "live" },
      { text: "Labs in Microsoft Entra ID, Okta and AWS, in free tenants you own", status: "early" },
      { text: "Your console work graded automatically, ticket by ticket", status: "early" },
      { text: "A GitHub portfolio project for every lab", status: "early" },
      { text: "Each lab added as a line on your readiness report", status: "early" },
      { text: "Aligned to SC-300, Okta and AWS Security certifications", status: "early" },
    ] },
];

export const PRO_FOOTNOTE = "Pro features are included free during early access.";

/** Whole-percent saving of yearly over 12 monthly payments. */
export const yearlySaving = (t: Tier) => (t.monthly ? Math.round((1 - t.yearly / (t.monthly * 12)) * 100) : 0);
export const perMonthYearly = (t: Tier) => Math.round((t.yearly / 12) * 100) / 100;
export const tier = (id: Tier["id"]) => TIERS.find(t => t.id === id)!;

// ---------- Waitlist tier selection (shared between the pricing buttons and the form) ----------
const paid = TIERS.filter(t => t.monthly > 0);
export const WAITLIST_OPTIONS: { value: string; label: string }[] = [
  { value: "updates", label: "Release updates only" },
  ...paid.flatMap(t => [
    { value: `${t.id}-monthly`, label: `${t.name}, monthly ($${t.monthly}/mo)` },
    { value: `${t.id}-yearly`, label: `${t.name}, yearly ($${t.yearly}/yr)` },
  ]),
];
export type WaitlistTier = "updates" | `${"pro" | "labs"}-${Billing}`;

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
