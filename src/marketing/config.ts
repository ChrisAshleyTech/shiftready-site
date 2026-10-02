// Formspree form ("Rolevara Sign-ups") that receives simulator sign-ups and waitlist entries. Empty =
// preview mode: forms validate but don't send. Sign-ups carry source "simulator sign-up".
export const FORM_ENDPOINT = "https://formspree.io/f/xwlpdjpq";

// Stripe Payment Links (https://buy.stripe.com/...), made in the Stripe dashboard. These are public
// checkout pages, not secrets. Empty = that plan button joins the waitlist instead of opening checkout.
// Stripe collects card details on its own page; nothing about payment touches this site.
export const PAYMENT_LINKS = {
  "pro-monthly": "",
  "pro-yearly": "",
  "labs-monthly": "",
  "labs-yearly": "",
  // Pro + Labs at the retention price (PRICES.labsUpgrade) for Pro members.
  "labs-upgrade": "",
};
