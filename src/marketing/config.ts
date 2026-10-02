// Waitlist form endpoint (e.g. a Formspree or Tally URL). Empty = preview mode: the form validates
// but doesn't send. Submissions include the email, the chosen tier and the role.
export const FORM_ENDPOINT = "";

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
