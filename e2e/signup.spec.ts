// Sign-up before the simulator, and the Home button back to the site.
import { test, expect } from "@playwright/test";

test.describe("new visitor", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("must sign up before the simulator opens, and stays signed up", async ({ page }) => {
    await page.goto("/app/#/queue");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Create your free account");
    await expect(page.getByRole("navigation", { name: "Rolevara navigation" })).toHaveCount(0);

    await page.getByRole("button", { name: "Sign up and start" }).click();
    await expect(page.getByText("Enter your name.")).toBeVisible();
    await page.getByLabel("Name").fill("Sam Lee");
    await page.getByLabel("Email").fill("sam@example");
    await page.getByRole("button", { name: "Sign up and start" }).click();
    await expect(page.getByText("Enter an email address in the format name@example.com.")).toBeVisible();
    await page.getByLabel("Email").fill("sam@example.com");
    await page.getByRole("button", { name: "Sign up and start" }).click();

    await expect(page.getByRole("link", { name: "Home page" })).toBeVisible();
    // Reset progress clears local storage; the sign-up is still remembered.
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.getByRole("link", { name: "Home page" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Create your free account" })).toHaveCount(0);
  });
});

test("Home button in the top bar goes to the homepage", async ({ page }) => {
  await page.goto("/app/#/directory");
  const home = page.getByRole("link", { name: "Home page" });
  await expect(home).toHaveAttribute("href", "/");
  await home.click();
  await expect(page).toHaveURL(/localhost:4173\/$/);
});

for (const [day, text] of [[9, null], [10, "Your free trial ends in 4 days."], [13, "Your free trial ends in 1 day."], [15, "Your free trial has ended."]] as const) {
  test(`trial notice on day ${day}`, async ({ page, context }) => {
    await context.addCookies([{ name: "rolevara-member", value: String(Date.now() - day * 864e5 - 60e3), domain: "localhost", path: "/" }]);
    await page.goto("/app/#/home");
    await expect(page.getByRole("link", { name: "Home page" })).toBeVisible();
    const notice = page.getByText(/Your free trial/);
    if (!text) { await expect(notice).toHaveCount(0); return; }
    await expect(notice).toContainText(text);
    await expect(page.getByRole("link", { name: "See plans" })).toHaveAttribute("href", "/pricing/");
    await page.getByRole("button", { name: "Dismiss notice" }).click();
    await page.reload();
    await expect(page.getByRole("link", { name: "Home page" })).toBeVisible();
    await expect(notice).toHaveCount(0);
  });
}

// Pro + Labs offer: 30 days after the 14-day trial (day 44), reminder 45 days after (day 59).
for (const [day, text] of [[43, null], [44, "As a Pro member, add Platform Labs for $25 a month for your first 12 months"], [59, "Reminder: as a Pro member"]] as const) {
  test(`upgrade offer on day ${day}`, async ({ page, context }) => {
    await context.addCookies([{ name: "rolevara-member", value: String(Date.now() - day * 864e5 - 60e3), domain: "localhost", path: "/" }]);
    await page.goto("/app/#/home");
    await expect(page.getByRole("link", { name: "Home page" })).toBeVisible();
    const offer = page.getByText(/add Platform Labs/);
    if (!text) { await expect(offer).toHaveCount(0); await expect(page.getByText(/Your free trial has ended/)).toBeVisible(); return; }
    await expect(offer).toContainText(text);
    await expect(page.getByRole("link", { name: "See Pro + Labs" })).toHaveAttribute("href", "/labs/");
    await page.getByRole("button", { name: "Dismiss notice" }).click();
    await page.reload();
    await expect(page.getByRole("link", { name: "Home page" })).toBeVisible();
    await expect(offer).toHaveCount(0);
  });
}
