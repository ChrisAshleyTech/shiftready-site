// Landing and pricing: pricing display and waitlist tier selection, motion controls, reduced motion.
import { test, expect } from "@playwright/test";

test("pricing: toggle, badges, coming-soon labels and waitlist tier selection", async ({ page }) => {
  await page.goto("/pricing/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Start free. Upgrade for every company, track and lab.");
  await expect(page.getByText("Most complete")).toBeVisible();
  await expect(page.getByText("$15", { exact: true })).toBeVisible();
  await page.getByRole("radio", { name: /Yearly/ }).click();
  await expect(page.getByRole("radio", { name: /Yearly/ })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText("$129", { exact: true })).toBeVisible();
  await expect(page.getByText("save 28%")).toBeVisible();
  await expect(page.getByText("$169", { exact: true })).toBeVisible();
  await expect(page.getByText("save 30%")).toBeVisible();
  await expect(page.getByText("Pro features are included free during early access.")).toBeVisible();
  expect(await page.getByText("Early access", { exact: true }).count()).toBeGreaterThanOrEqual(3);
  await expect(page.getByText(/Okta|AWS|Active Directory/)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Start free" }).last()).toHaveAttribute("href", "/app/");
  await page.getByRole("button", { name: "Join Pro + Labs waitlist" }).click();
  await expect(page.locator("#tier")).toHaveValue("labs-yearly");
  await expect(page.locator("#email")).toBeFocused();
  await page.getByRole("button", { name: "Join the lab pack waitlist" }).click();
  await expect(page.locator("#tier")).toHaveValue("pack");
  await page.locator("#email").fill("not-an-email");
  await page.getByRole("button", { name: "Join the waitlist" }).click();
  await expect(page.locator("#formmsg")).toContainText("valid email");
});

test.describe("with motion", () => {
  test.use({ reducedMotion: "no-preference" });
  test("hero video autoplays muted and looping, and the pause button stops it", async ({ page }) => {
    await page.goto("/");
    const v = page.locator("[data-hero-video]");
    await expect(v).toHaveJSProperty("muted", true);
    await expect(v).toHaveJSProperty("loop", true);
    await expect.poll(() => v.evaluate((el: HTMLVideoElement) => !el.paused)).toBe(true);
    await page.getByRole("button", { name: "Pause animations" }).first().click();
    await expect.poll(() => v.evaluate((el: HTMLVideoElement) => el.paused)).toBe(true);
    await page.getByRole("button", { name: "Play animations" }).first().click();
    await expect.poll(() => v.evaluate((el: HTMLVideoElement) => !el.paused)).toBe(true);
  });
});

test("reduced motion: a still image replaces the video, with an opt-in play button and a text description", async ({ page }) => {
  await page.goto("/"); // config sets reducedMotion: "reduce"
  await expect(page.locator("[data-hero-still]")).toBeVisible();
  await expect(page.locator("[data-hero-video]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Pause animations/ })).toHaveCount(0);
  await expect(page.locator("dd").filter({ hasText: "131" }).first()).toBeVisible();
  await page.getByText("Video description").click();
  await expect(page.locator("#demo-desc")).toContainText("Caused by your Monday shift");
  await page.getByRole("button", { name: "Play the walkthrough" }).click();
  await expect(page.locator("[data-hero-video]")).toHaveJSProperty("controls", true);
});

test("demo video files stay under 5 MB", async ({ request }) => {
  for (const f of ["/video/demo.mp4", "/video/demo.webm", "/video/demo-poster.webp", "/video/demo-poster.jpg"]) {
    const r = await request.get(f); expect(r.ok(), f).toBe(true);
    expect((await r.body()).length, f).toBeLessThan(5 * 1024 * 1024);
  }
});

test("landing: sections in order and photo credits", async ({ page }) => {
  await page.goto("/");
  const ids = await page.locator("main section[id], main section[aria-labelledby]").evaluateAll(els => els.map(e => e.id || e.getAttribute("aria-labelledby")));
  expect(ids).toEqual(["hero-h", "capabilities", "aud-h", "industries", "how", "pricing", "faq", "waitlist"]);
  await expect(page.locator("figcaption").filter({ hasText: "Unsplash" })).toHaveCount(4);
  const overflow = await page.setViewportSize({ width: 390, height: 844 }).then(() => page.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  expect(overflow).toBe(false);
});

// Enterprise copy rules for every marketing page: third person, no personal content or
// testimonials, no "Coming soon" (early access only), no unlisted platforms.
const PAGES: [string, RegExp][] = [["/", /Identity and access skills/], ["/pricing/", /Start free. Upgrade/], ["/tracks/", /Role-based tracks/], ["/industries/", /Six industries/], ["/labs/", /real identity platform/], ["/resources/", /How ShiftReady works/]];
for (const [path, h1] of PAGES) {
  test(`copy rules: ${path}`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(h1);
    const text = await page.locator("body").innerText();
    expect(text).not.toMatch(/(We|we|We're|we're|We'll|we'll|Our|our|I|I'm|I've|me|my)/);
    expect(text).not.toMatch(/founder|Christopher|Ashley|testimonial|learner stories|built by/i);
    expect(text).not.toMatch(/coming soon/i);
    expect(text).not.toMatch(/Okta|AWS|Active Directory/);
  });
}

test("mega-nav: dropdowns open, arrow keys move, Escape closes and returns focus", async ({ page }) => {
  await page.goto("/");
  const tracks = page.getByRole("button", { name: "Tracks" });
  await tracks.click();
  await expect(tracks).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("link", { name: /GRC Audit/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /PAM/ }).first()).toContainText("Early access");
  await page.keyboard.press("ArrowDown");
  await expect(page.locator("[data-menu-item]").first()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(tracks).toHaveAttribute("aria-expanded", "false");
  await expect(tracks).toBeFocused();
  await page.getByRole("button", { name: "Platform labs" }).click();
  await expect(page.locator("[data-menu-item]")).toHaveCount(1);
  await page.getByRole("button", { name: "Industries" }).click();
  await expect(page.locator("[data-menu-item]")).toHaveCount(6);
  await page.mouse.click(5, 600);
  await expect(page.locator("[data-menu-item]")).toHaveCount(0);
});

test("resources: the sample report link opens a decoded report", async ({ page, context }) => {
  await page.goto("/resources/");
  const href = await page.getByRole("link", { name: /View the sample report/ }).getAttribute("href");
  const p = await context.newPage(); await p.goto(href!);
  await expect(p.getByRole("heading", { level: 1 })).toHaveText("Sample learner");
});
