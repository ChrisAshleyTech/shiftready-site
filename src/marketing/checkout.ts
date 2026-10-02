// Stripe checkout through Payment Links: a plan with a link opens Stripe's hosted page; a plan
// without one falls back to the waitlist. The learner's email (from sign-up, if any) is prefilled.
// TODO(accounts): a paid plan unlocks nothing yet. Real gating needs server accounts plus a Stripe
// webhook (checkout.session.completed / customer.subscription.*) that records who has paid.
import { PAYMENT_LINKS } from "./config";
import { chooseTier } from "./plans";

export type CheckoutPlan = keyof typeof PAYMENT_LINKS;

const STORE = "rolevara-account";

function email(): string | null {
  try { return JSON.parse(localStorage.getItem(STORE) ?? "null")?.email || null; } catch { return null; }
}

/** The Stripe checkout URL for a plan, or null when no link is set for it. */
export function checkoutUrl(plan: CheckoutPlan, links: Record<string, string> = PAYMENT_LINKS, mail = email()): string | null {
  const link = links[plan];
  if (!link) return null;
  try {
    const u = new URL(link);
    if (mail) u.searchParams.set("prefilled_email", mail);
    return u.toString();
  } catch { return null; }
}

export const hasCheckout = (plan: CheckoutPlan) => checkoutUrl(plan, PAYMENT_LINKS, null) != null;

/** Opens Stripe checkout for the plan, or picks it on the waitlist form when it has no link yet. */
export function choosePlan(plan: Exclude<CheckoutPlan, "labs-upgrade">) {
  const url = checkoutUrl(plan);
  if (url) location.assign(url);
  else chooseTier(plan);
}

/** Paid plans are on sale once every plan button has a link. */
export const PAYMENTS_LIVE = (["pro-monthly", "pro-yearly", "labs-monthly", "labs-yearly"] as const).every(hasCheckout);
