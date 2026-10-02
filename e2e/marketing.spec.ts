// Landing and pricing: pricing display and waitlist tier selection, motion controls, reduced motion.
import { test, expect } from "@playwright/test";
import { GUIDES, guideHref } from "../src/guides/data";

test("pricing: toggle, badges, coming-soon labels and waitlist tier selection", async ({ page }) => {
  await page.goto("/pricing/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Start free. Upgrade for every company, track and lab.");
  await expect(page.getByText("Most complete")).toBeVisible();
  await expect(page.getByText("$15", { exact: true })).toBeVisible();
  await page.getByRole("radio", { name: /Yearly/ }).click();
  await expect(page.getByRole("radio", { name: /Yearly/ })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText("$129", { exact: true })).toBeVisible();
  await expect(page.getByText("$249", { exact: true })).toBeVisible();
  await expect(page.getByText("save 28%")).toHaveCount(2);
  await page.getByRole("radio", { name: /Monthly/ }).click();
  await expect(page.getByText("$29", { exact: true })).toBeVisible();
  await expect(page.getByText("14-day free trial · Cancel anytime")).toBeVisible();
  await expect(page.locator("main").getByText("Cancel anytime", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/\$39|lab pack|one-time/i)).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Show the work in the real console." })).toBeVisible();
  await expect(page.getByRole("table", { name: "Pro compared with Pro + Labs" })).toContainText("Simulator + real tenants");
  await expect(page.getByText("Pro features are included free during early access.", { exact: true })).toBeVisible();
  expect(await page.getByText("Early access", { exact: true }).count()).toBeGreaterThanOrEqual(3);
  await expect(page.locator("main").getByText(/Active Directory/)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Start free" }).last()).toHaveAttribute("href", "/app/");
  await page.getByRole("button", { name: "Join Pro + Labs waitlist" }).click();
  await expect(page.locator("#tier")).toHaveValue("labs-monthly");
  await expect(page.locator("#email")).toBeFocused();
  await expect(page.locator("#tier option")).toHaveText(["Release updates only", "Pro, monthly ($15/mo)", "Pro, yearly ($129/yr)", "Pro + Labs, monthly ($29/mo)", "Pro + Labs, yearly ($249/yr)"]);
  await page.locator("#email").fill("not-an-email");
  await page.getByRole("button", { name: "Join the waitlist" }).click();
  await expect(page.locator("#email-error")).toHaveText("Enter an email address in the format name@example.com.");
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
  await expect(page.locator("#demo-desc")).toContainText("traced back to that decision");
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
  expect(ids).toEqual(["hero-h", "how", "paths", "capabilities", "industries", "aud-h", "pricing", "faq", "waitlist"]);
  await expect(page.locator("figcaption").filter({ hasText: "Unsplash" })).toHaveCount(3);
  const overflow = await page.setViewportSize({ width: 390, height: 844 }).then(() => page.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  expect(overflow).toBe(false);
});

// Copy rules for every marketing page: second person ("you") or third, never "we"; no personal content or
// testimonials, and "Coming soon" only for the Active Directory lab on /labs.
const PAGES: [string, RegExp][] = [["/", /Know you can do the job/], ["/pricing/", /Start free. Upgrade/], ["/tracks/", /Pick the role you want/], ["/industries/", /Six companies/], ["/labs/", /real identity platform/], ["/resources/", /How Rolevara works/], ["/privacy/", /Privacy policy/], ["/terms/", /Terms of use/],
  ["/guides/", /Guides to IAM, GRC and PAM work/], ...GUIDES.map(g => [guideHref(g), new RegExp(g.title.split(",")[0].replace(/[()]/g, "\\$&"))] as [string, RegExp])];
for (const [path, h1] of PAGES) {
  test(`copy rules: ${path}`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(h1);
    const text = (await page.locator("body").innerText()).replace(/Rolevara is not affiliated with[^\n]*/g, "");
    expect(text).not.toMatch(/\b(We|we|We're|we're|We'll|we'll|Our|our|I|I'm|I've|me|my)\b/);
    expect(text).not.toMatch(/founder|Christopher|Ashley|testimonial|learner stories|built by/i);
    if (path === "/labs/") expect(text.match(/coming soon/gi)).toHaveLength(1);
    else expect(text).not.toMatch(/coming soon|Active Directory/i);
  });
}

test("mega-nav: dropdowns open, arrow keys move, Escape closes and returns focus", async ({ page }) => {
  await page.goto("/");
  const tracks = page.getByRole("button", { name: "Tracks" });
  await tracks.click();
  await expect(tracks).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("link", { name: /GRC Audit/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /PAM/ }).first()).not.toContainText("Early access");
  await page.keyboard.press("ArrowDown");
  await expect(page.locator("[data-menu-item]").first()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(tracks).toHaveAttribute("aria-expanded", "false");
  await expect(tracks).toBeFocused();
  await page.getByRole("button", { name: "Platform labs" }).click();
  await expect(page.locator("[data-menu-item]")).toHaveCount(3);
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

// Security headers: every inline script is allowed by hash, and pages load with no CSP violations.
test("security headers and CSP: no violations, inline scripts hashed", async ({ page, request }) => {
  const res = await request.get("/");
  const csp = res.headers()["content-security-policy"];
  expect(csp).toContain("frame-ancestors 'none'");
  expect(res.headers()["x-content-type-options"]).toBe("nosniff");
  const { createHash } = await import("node:crypto");
  for (const p of ["/", "/app/", "/report/", "/pricing/", "/tracks/", "/industries/", "/labs/", "/resources/", "/sim.html"]) {
    const html = await (await request.get(p)).text();
    for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) expect(csp, `inline script on ${p}`).toContain("sha256-" + createHash("sha256").update(m[1]).digest("base64"));
  }
  const violations: string[] = [];
  page.on("console", m => { if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text()); });
  for (const p of ["/", "/pricing/", "/resources/", "/app/#/queue/INC0041220", "/app/#/report", "/report/#r=x"]) { await page.goto(p); await page.waitForTimeout(400); }
  expect(violations).toEqual([]);
});

test("footer: legal links and the non-affiliation disclaimer on every marketing page", async ({ page }) => {
  for (const p of ["/", "/pricing/", "/privacy/", "/terms/"]) {
    await page.goto(p);
    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy/");
    await expect(footer.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms/");
    await expect(footer).toContainText("Rolevara is not affiliated with or endorsed by NIST, ISO, AICPA, the PCI Security Standards Council, Microsoft, Okta or Amazon. Framework names are used for identification only.");
  }
});

const ALL_PAGES = ["/", "/app/", "/report/", "/pricing/", "/tracks/", "/industries/", "/labs/", "/resources/", "/privacy/", "/terms/", "/guides/", ...GUIDES.map(guideHref)];
test("meta: unique title and description, Open Graph, Twitter card, icons and manifest on every page", async ({ request }) => {
  const titles = new Set<string>(), descs = new Set<string>();
  for (const p of ALL_PAGES) {
    const html = await (await request.get(p)).text();
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
    const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "";
    expect(title, p).not.toBe(""); expect(desc.length, p).toBeGreaterThan(20);
    titles.add(title); descs.add(desc);
    for (const tag of ['rel="canonical"', 'property="og:title"', 'property="og:description"', 'property="og:image"', 'name="twitter:card" content="summary_large_image"', 'rel="apple-touch-icon"', 'rel="manifest"', 'rel="icon"'])
      expect(html, `${p}: ${tag}`).toContain(tag);
  }
  expect(titles.size).toBe(ALL_PAGES.length);
  expect(descs.size).toBe(ALL_PAGES.length);
  for (const f of ["/og/rolevara-og.png", "/favicon.ico", "/favicon.svg", "/apple-touch-icon.png", "/icon-192.png", "/icon-512.png", "/icon-maskable-512.png", "/site.webmanifest"])
    expect((await request.get(f)).ok(), f).toBe(true);
});

test("sitemap.xml and robots.txt: every listed page resolves", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toMatch(/Sitemap: https:\/\/.+\/sitemap\.xml/);
  expect(robots).toContain("Disallow: /report/");
  const xml = await (await request.get("/sitemap.xml")).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(m[1]).pathname);
  expect(locs.length).toBeGreaterThanOrEqual(9);
  expect(locs).not.toContain("/report/");
  for (const p of locs) expect((await request.get(p)).status(), p).toBe(200);
});

test("404 page: new style, noindex, and routes onward", async ({ page }) => {
  await page.goto("/404.html");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("This page doesn't exist.");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
  await expect(page.getByRole("link", { name: /Go to the home page/ })).toHaveAttribute("href", "/");
});

test("waitlist form: field-level errors on blur and submit, live re-validation, honeypot", async ({ page }) => {
  await page.goto("/pricing/");
  const email = page.locator("#email");
  await expect(page.getByText("Email (required)")).toBeVisible();
  await page.getByRole("button", { name: "Join the waitlist" }).click();
  await expect(page.locator("#email-error")).toHaveText("Enter an email address.");
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(email).toHaveAttribute("aria-describedby", "email-error");
  await expect(email).toBeFocused();
  await email.fill("jordan@example");
  await expect(page.locator("#email-error")).toHaveText("Enter an email address in the format name@example.com.");
  await email.fill("jordan@example.com");
  await expect(page.locator("#email-error")).toHaveCount(0);
  await expect(email).not.toHaveAttribute("aria-invalid", "true");
  // Blur validation on a fresh field
  await page.reload();
  await page.locator("#email").fill("not-an-email");
  await page.locator("#tier").focus();
  await expect(page.locator("#email-error")).toBeVisible();
  // Honeypot: hidden from people and assistive tech, not focusable
  const trap = page.locator('input[name="_gotcha"]');
  await expect(trap).toHaveAttribute("tabindex", "-1");
  await expect(page.locator('[aria-hidden="true"]:has(input[name="_gotcha"])')).toHaveCount(1);
  // A valid submission with the honeypot filled is dropped (success shown, nothing sent)
  await page.locator("#email").fill("jordan@example.com");
  await trap.evaluate((el: HTMLInputElement) => { el.value = "spam"; });
  await page.getByRole("button", { name: "Join the waitlist" }).click();
  await expect(page.locator("#formmsg")).toHaveText("Added to the waitlist. One notification per release.");
  // Without the honeypot, the entry is sent to the form endpoint (stubbed here)
  let sent: any = null;
  await page.route("https://formspree.io/**", r => { sent = r.request().postDataJSON(); return r.fulfill({ json: { ok: true } }); });
  await page.locator("#email").fill("jordan@example.com");
  await page.getByRole("button", { name: "Join the waitlist" }).click();
  await expect(page.locator("#formmsg")).toHaveText("Added to the waitlist. One notification per release.");
  expect(sent).toMatchObject({ email: "jordan@example.com" });
});

test("one primary call to action per section on every marketing page", async ({ page }) => {
  for (const p of ["/", "/pricing/", "/tracks/", "/industries/", "/labs/", "/resources/", "/privacy/", "/terms/", "/404.html", "/guides/", ...GUIDES.map(guideHref)]) {
    await page.goto(p);
    const counts = await page.locator("main section").evaluateAll(secs => secs.map(s => ({
      id: s.id || s.getAttribute("aria-labelledby") || s.getAttribute("aria-label") || "",
      n: [...s.querySelectorAll('[data-slot="button"]')].filter(b => !b.closest("section section") || b.closest("section") === s).filter(b => /(^|\s)bg-primary(\s|$)/.test(b.className)).length,
    })));
    for (const c of counts) expect(c.n, `${p} section ${c.id}`).toBeLessThanOrEqual(1);
    expect(await page.locator('header [data-slot="button"].bg-primary').count(), `${p} header`).toBe(1);
  }
});

// Pre-rendered pages must hydrate cleanly: no console errors (hydration mismatches included),
// with and without reduced motion, and the content is present before scripts run.
for (const rm of ["reduce", "no-preference"] as const) {
  test.describe(`hydration (${rm})`, () => {
    test.use({ reducedMotion: rm });
    test("marketing pages hydrate without console errors", async ({ page }) => {
      const errors: string[] = [];
      // Resource failures are tracked by URL; /_vercel/insights only exists on Vercel deployments.
      page.on("console", m => { if (m.type() === "error" && !m.text().startsWith("Failed to load resource")) errors.push(m.text()); });
      page.on("response", r => { if (r.status() >= 400 && !r.url().includes("/_vercel/insights")) errors.push(`${r.status()} ${r.url()}`); });
      page.on("pageerror", e => errors.push(e.message));
      for (const p of ["/", "/pricing/", "/tracks/", "/industries/", "/labs/", "/resources/", "/privacy/", "/terms/", "/404.html", "/guides/", GUIDES.map(guideHref)[0]]) {
        await page.goto(p); await page.waitForTimeout(500);
      }
      expect(errors.filter(e => !/_vercel\/insights/.test(e))).toEqual([]);
    });
  });
}
test("pre-rendered HTML contains the page content before JavaScript", async ({ request }) => {
  const html = await (await request.get("/")).text();
  expect(html).toContain('data-prerendered');
  expect(html).toContain("Know you can do the job");
});

test("landing and Tracks explain the paths: IAM, GRC and PAM", async ({ page }) => {
  for (const [p, link] of [["/", "/tracks/#grc"], ["/tracks/", "/app/"]] as const) {
    await page.goto(p);
    const s = page.getByRole("region", { name: "Choose your path" });
    await expect(s.getByRole("heading", { level: 3 })).toHaveText(["IAM", "GRC", "PAM"]);
    await expect(s).toContainText("IAM + GRC");
    await expect(s).toContainText("GRC only");
    await expect(s.locator(`a[href="${link}"]`).first()).toBeVisible();
  }
  // Every area is in the app now, so the Tracks page links each one there.
  await expect(page.getByRole("region", { name: "Choose your path" }).getByRole("link")).toHaveCount(3);
});

test("intro film: 1080p for larger screens, 720p for phones, each under 8 MB", async ({ request }) => {
  for (const f of ["/video/intro.mp4", "/video/intro.webm", "/video/intro-720.mp4", "/video/intro-720.webm", "/video/intro-poster.webp", "/video/intro-poster.jpg"]) {
    const r = await request.get(f); expect(r.ok(), f).toBe(true);
    expect((await r.body()).length, f).toBeLessThan(8 * 1024 * 1024);
  }
});
