// Link integrity and mobile layout across the whole site.
import { test, expect, type Page } from "@playwright/test";
import { GUIDES, guideHref } from "../src/guides/data";

const PAGES = ["/", "/pricing/", "/tracks/", "/industries/", "/labs/", "/resources/", "/privacy/", "/terms/", "/404.html", "/guides/", ...GUIDES.map(guideHref)];
const APP_ROUTES = ["home", "queue", "directory", "groups", "policy", "hr", "log", "results", "report", "grc", "labs"];
// Sites that refuse automated requests (bot protection) but were checked by hand.
const BOT_BLOCKED = /^https:\/\/(unsplash\.com|entra\.microsoft\.com)\//;

async function linksOn(page: Page) {
  const hrefs = new Set<string>();
  const grab = async () => (await page.locator("a[href]").evaluateAll(as => as.map(a => (a as HTMLAnchorElement).href))).forEach(h => hrefs.add(h));
  await grab();
  for (const menu of ["Tracks", "Industries", "Platform labs", "Resources"]) {
    const b = page.getByRole("button", { name: menu });
    if (await b.count()) { await b.click(); await grab(); await page.keyboard.press("Escape"); }
  }
  return [...hrefs];
}

test("no broken links: internal pages, anchors, app routes and external sites", async ({ page, request, baseURL }) => {
  test.setTimeout(240_000);
  const all = new Map<string, string>(); // href -> first page it appeared on
  for (const p of PAGES) { await page.goto(p); for (const h of await linksOn(page)) if (!all.has(h)) all.set(h, p); }
  const broken: string[] = [];
  for (const [href, from] of all) {
    if (href.startsWith("mailto:")) continue;
    const u = new URL(href);
    if (u.origin === new URL(baseURL!).origin) {
      if (u.hash.startsWith("#/")) { // in-app route
        const name = u.hash.slice(2).split(/[/?]/)[0];
        if (!APP_ROUTES.includes(name)) broken.push(`${href} (unknown app route, on ${from})`);
        continue;
      }
      if (u.pathname.startsWith("/report/")) continue; // report data lives in the fragment
      const res = await request.get(u.pathname + u.search);
      if (res.status() !== 200) { broken.push(`${href} -> ${res.status()} (on ${from})`); continue; }
      if (u.hash && u.hash.length > 1) {
        await page.goto(u.pathname); const id = decodeURIComponent(u.hash.slice(1));
        if (!(await page.locator(`[id="${id}"]`).count())) broken.push(`${href} (missing #${id}, on ${from})`);
      }
    } else {
      if (BOT_BLOCKED.test(href)) continue;
      const res = await request.get(href, { maxRedirects: 5, timeout: 20_000, failOnStatusCode: false }).catch(e => ({ status: () => `error ${e.message}` }));
      const st = res.status();
      if (typeof st !== "number" || st >= 400) broken.push(`${href} -> ${st} (on ${from})`);
    }
  }
  console.log(`checked ${all.size} unique links`);
  expect(broken).toEqual([]);
});

test.describe("390px wide", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  for (const p of [...PAGES, "/app/#/home", "/app/#/queue/INC0041220", "/app/#/directory/greg.foster", "/app/#/groups", "/app/#/results", "/app/#/report", "/app/#/grc/G1", "/report/#r=x"]) {
    test(`no horizontal overflow: ${p}`, async ({ page }) => {
      // After load, so late swaps (the hero video replaces its poster on load) are measured too.
      await page.goto(p, { waitUntil: "load" }); await page.waitForTimeout(600);
      const { sw, w } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: innerWidth }));
      expect(sw, `${p} is ${sw}px wide at 390px`).toBeLessThanOrEqual(w);
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    });
  }
});
