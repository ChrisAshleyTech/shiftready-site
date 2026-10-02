import { describe, expect, it } from "vitest";
import { checkoutUrl } from "@/marketing/checkout";

const links = { "pro-monthly": "https://buy.stripe.com/test_abc", "pro-yearly": "", "labs-monthly": "nonsense", "labs-yearly": "", "labs-upgrade": "" };

describe("checkoutUrl", () => {
  it("returns null without a link, so the button falls back to the waitlist", () => {
    expect(checkoutUrl("pro-yearly", links, null)).toBeNull();
    expect(checkoutUrl("labs-monthly", links, null)).toBeNull();
  });
  it("prefills the signed-up email", () => {
    expect(checkoutUrl("pro-monthly", links, "a+b@x.com")).toBe("https://buy.stripe.com/test_abc?prefilled_email=a%2Bb%40x.com");
    expect(checkoutUrl("pro-monthly", links, null)).toBe("https://buy.stripe.com/test_abc");
  });
});
