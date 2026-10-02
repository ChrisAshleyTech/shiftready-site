// Account notices under the top bar: from day 10 of the free trial, the days left with a link to the
// plan options; later, the Pro + Labs upgrade offer for members who stayed on Pro.
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRICES } from "@/marketing/plans";
import { checkoutUrl } from "@/marketing/checkout";
import { TRIAL_DAYS, TRIAL_NOTICE_DAY, trialDaysLeft, upgradeOffer } from "../account";

const STORE = "rolevara-notice-dismissed";

function notice(): { key: string; text: string; cta: string; href: string } | null {
  const left = trialDaysLeft();
  if (left == null) return null;
  const offer = upgradeOffer(), u = PRICES.labsUpgrade;
  if (offer) return {
    key: `upgrade-${offer}`,
    text: `${offer === "reminder" ? "Reminder: as" : "As"} a Pro member, add Platform Labs for $${u.monthly} a month for your first ${u.months} months (usually $${PRICES.labs.monthly}). Practice in real Entra ID, Okta and AWS tenants.`,
    // Straight to the discounted Stripe checkout once its Payment Link is set.
    ...(checkoutUrl("labs-upgrade") ? { cta: `Add Labs for $${u.monthly}/mo`, href: checkoutUrl("labs-upgrade")! } : { cta: "See Pro + Labs", href: "/labs/" }),
  };
  if (left > TRIAL_DAYS - TRIAL_NOTICE_DAY) return null;
  return {
    // Dismissing a trial notice hides it until the count changes the next day.
    key: `trial-${left}`,
    text: left === 0 ? "Your free trial has ended. Choose a plan to keep going."
      : `Your free trial ends in ${left} ${left === 1 ? "day" : "days"}. See your plan options.`,
    cta: "See plans", href: "/pricing/",
  };
}

export function TrialNotice() {
  const n = notice();
  const [dismissed, setDismissed] = useState(() => { try { return localStorage.getItem(STORE); } catch { return null; } });
  if (!n || dismissed === n.key) return null;
  const dismiss = () => { try { localStorage.setItem(STORE, n.key); } catch { /* storage blocked */ } setDismissed(n.key); };
  return (
    <div role="status" className="border-b bg-primary/10 px-4 py-2.5 md:px-6">
      <div className="mx-auto flex max-w-[1480px] flex-wrap items-center gap-x-4 gap-y-2">
        <p className="min-w-0 flex-1 text-sm font-semibold">{n.text}</p>
        <Button asChild size="sm"><a href={n.href}>{n.cta}</a></Button>
        <Button variant="ghost" size="icon" className="size-8" aria-label="Dismiss notice" onClick={dismiss}><X className="size-4" aria-hidden /></Button>
      </div>
    </div>
  );
}
