// Verdelit brand: storage migration from the old product name, logo and tagline, SEO tags, assets
// and level badges.
import { test, expect } from "@playwright/test";

const TAGLINE = "Prove you can do the job before day one.";

test("progress saved under the old product name carries over", async ({ page }) => {
  await page.goto("/404.html");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("shiftready-theme", "dark");
    localStorage.setItem("shiftready-company", "harbor-health");
    localStorage.setItem("shiftready-report-name", "Jordan");
    localStorage.setItem("shiftready-sim-harbor-health-v1", JSON.stringify({ users: {}, tickets: {}, log: [], active: null, clock: 612, grc: {} }));
    localStorage.setItem("pcl-iam-sim-v1", JSON.stringify({ marker: "kept" }));
  });
  await page.goto("/app/#/home");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("combobox", { name: "Company" }).first()).toContainText("Harbor Health Network");
  const keys = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)])));
  expect(Object.keys(keys).filter(k => k.startsWith("shiftready-"))).toEqual([]);
  expect(keys["verdelit-theme"]).toBe("dark");
  expect(keys["verdelit-report-name"]).toBe("Jordan");
  expect(JSON.parse(keys["verdelit-sim-harbor-health-v1"]).clock).toBe(612);
  expect(JSON.parse(keys["pcl-iam-sim-v1"]).marker).toBe("kept"); // Pacific Crest's key never had the brand in it
});

test("a newer value wins over a leftover old one", async ({ page }) => {
  await page.goto("/404.html");
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("verdelit-theme", "light"); localStorage.setItem("shiftready-theme", "dark"); });
  await page.goto("/");
  expect(await page.evaluate(() => [localStorage.getItem("verdelit-theme"), localStorage.getItem("shiftready-theme")])).toEqual(["light", null]);
});

test("header logo, tagline, and SEO tags use the Verdelit brand", async ({ page, request }) => {
  await page.goto("/");
  const header = page.locator("header").first();
  await expect(header.getByRole("img", { name: "Verdelit" })).toBeVisible();
  await expect(header.getByText(TAGLINE)).toBeVisible();
  await expect(page).toHaveTitle(/Verdelit/);
  for (const path of ["/", "/pricing/", "/tracks/", "/industries/", "/labs/", "/resources/", "/privacy/", "/terms/", "/app/"]) {
    const html = await (await request.get(path)).text();
    expect(html, path).toContain(`<meta name="description" content="`);
    expect(html.match(/<meta name="description" content="([^"]*)"/)![1], path).toContain(TAGLINE);
    expect(html.match(/<meta property="og:description" content="([^"]*)"/)![1], path).toContain(TAGLINE);
    expect(html, path).toContain('content="https://verdelit.com/og/verdelit-og.png"');
    expect(html, path).toContain('<link rel="canonical" href="https://verdelit.com');
    // The only mention left is the inline script that migrates old storage keys.
    expect(html.replace(/<script>try\{var s=localStorage[^<]*<\/script>/, "").toLowerCase(), path).not.toContain("shiftready");
  }
  expect(await (await request.get("/sitemap.xml")).text()).toContain("<loc>https://verdelit.com/</loc>");
  const manifest = await (await request.get("/site.webmanifest")).json();
  expect([manifest.name, manifest.description]).toEqual(["Verdelit", TAGLINE]);
});

test("brand, icon and badge assets are served", async ({ request }) => {
  const files = ["/favicon.svg", "/favicon.ico", "/apple-touch-icon.png", "/icon-192.png", "/icon-512.png", "/icon-maskable-512.png", "/og/verdelit-og.png",
    ...["horizontal", "stacked"].flatMap(k => [`/brand/verdelit-${k}.svg`, `/brand/verdelit-${k}.png`, `/brand/verdelit-${k}-dark.svg`, `/brand/verdelit-${k}-dark.png`]),
    ...["beginner", "intermediate", "pro"].map(l => `/badges/verdelit-level-${l}.png`)];
  for (const f of files) expect((await request.get(f)).status(), f).toBe(200);
  expect(await (await request.get("/favicon.svg")).text()).toContain("#3DDC97");
});

test("level badges light one, two or three lights", async ({ page }) => {
  await page.goto("/resources/#levels");
  for (const [label, n] of [["Beginner", 1], ["Intermediate", 2], ["Pro", 3]] as const)
    await expect(page.getByRole("img", { name: `${label} level: ${n} of 3 lights` })).toBeVisible();
  await expect(page.getByRole("link", { name: "LinkedIn image for the Pro badge" })).toHaveAttribute("href", "/badges/verdelit-level-pro.png");
});

// Short phones start with more of the landing page below the fold, where sideways reveals wait.
for (const [w, h] of [[320, 568], [390, 664]] as const) {
  test(`the landing page fits a ${w}x${h} screen`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto("/", { waitUntil: "load" }); await page.waitForTimeout(800);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
    await expect(page.getByRole("button", { name: "Open menu" })).toBeInViewport();
  });
}
