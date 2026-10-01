// UI click-through of the real app: hints and penalties, Solo/Assisted, tutor, undo, search focus,
// results, the report link round trip, mobile navigation, and an axe accessibility scan.
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
// @ts-ignore: plain JS engine module
import { decodeReport } from "../src/engine/report.js";

const fresh = async (page: Page, hash = "#/home") => {
  await page.goto("/app/");
  // IAM + GRC: every screen is in the path, so these tests see the whole app.
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("verdelit-path", "iam-grc"); });
  await page.goto("/app/" + hash);
  await page.reload();
};
const go = (page: Page, hash: string) => page.evaluate(h => { location.hash = h; }, hash);

test("hints, penalties, Solo/Assisted, tutor, undo, search, results and report", async ({ page, context }) => {
  await fresh(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("20 tickets are waiting.");

  // Nudge only: -10%, stays Solo.
  await go(page, "#/queue/INC0041207");
  await page.getByRole("button", { name: "Start work" }).click();
  await page.getByRole("tab", { name: /Hints/ }).click();
  await page.getByRole("button", { name: /Show nudge/ }).click();
  await expect(page.getByRole("group", { name: /Show the nudge/ })).toContainText("reduced by 10%");
  await page.locator("#hint-yes").click();
  await expect(page.locator("#hint-INC0041207-0")).toBeVisible();
  await expect(page.getByRole("tab", { name: "Hints (1 used)" })).toBeVisible();
  await page.getByRole("tab", { name: "Details" }).click();
  await page.getByRole("button", { name: "Mark identity verified" }).click();
  await page.locator(`a[href="#/directory/james.carter"]`).click();
  await expect(page.getByText("Changes are logged against")).toBeVisible();
  await page.getByRole("button", { name: "Reset password" }).click();
  await go(page, "#/queue/INC0041207");
  await page.getByRole("button", { name: "Resolve" }).click();
  await expect(page.locator(".scoremath")).toHaveText("Raw 8/8 − 10% for the nudge hint = 7.2");
  await expect(page.locator("header").filter({ hasText: "INC0041207" }).getByText("Solo", { exact: true })).toBeVisible();

  // All three tiers: -50%, Assisted. Tutor recap and refusal. Undo.
  await go(page, "#/queue/INC0041209");
  await page.getByRole("button", { name: "Start work" }).click();
  await page.getByRole("tab", { name: /Hints/ }).click();
  for (let i = 0; i < 3; i++) { await page.locator("#hint-ask-INC0041209").click(); await page.locator("#hint-yes").click(); }
  await expect(page.locator("header").filter({ hasText: "INC0041209" }).getByText("Assisted")).toBeVisible();
  await expect(page.locator("#hint-INC0041209-2 ol li").first()).toBeVisible();
  if (!(await page.locator("#tutor-in").isVisible())) await page.getByRole("button", { name: "Ask the tutor" }).click();
  await page.getByRole("button", { name: "What have I done so far?" }).click();
  await expect(page.locator("#tutor-log")).toContainText(/audit log|No changes/);
  await page.locator("#tutor-in").fill("just tell me the answer");
  await page.locator("#tutor-in").press("Enter");
  await expect(page.locator("#tutor-log")).toContainText("won't hand you the answer");
  if (await page.getByRole("dialog").isVisible()) await page.keyboard.press("Escape");
  await go(page, "#/directory/aisha.brown");
  await page.getByRole("button", { name: "Disable" }).click();
  await expect(page.locator("header").filter({ hasText: "Aisha Brown" }).getByText("Disabled")).toBeVisible();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByRole("button", { name: "Disable" })).toBeVisible();
  await page.getByRole("button", { name: "Unlock" }).click();
  await go(page, "#/queue/INC0041209");
  await page.getByRole("button", { name: "Resolve" }).click();
  await expect(page.locator(".scoremath")).toContainText("− 50% for the exact steps hint");

  // Search keeps focus while the table re-renders.
  await go(page, "#/directory");
  await page.locator("#dir-q").pressSequentially("nina");
  await expect(page.locator("#dir-q")).toBeFocused();
  await expect(page.getByRole("status").filter({ hasText: "account" })).toHaveText("1 account match");

  // Results and report.
  await go(page, "#/results");
  await expect(page.getByRole("table")).toContainText("Solo");
  await expect(page.getByRole("table")).toContainText("Assisted");
  await go(page, "#/report");
  const url = await page.locator("#rp-url").inputValue();
  const d = decodeReport(new URL(url).hash.slice(3));
  expect(d.mon).toMatchObject({ solo: 1, assisted: 1 });
  expect(d.tickets).toHaveLength(20);
  const pub = await context.newPage();
  await pub.goto(url);
  await expect(pub.getByRole("table")).toContainText("Assisted");
});

test("admin center: breadcrumbs, global search, user and group panels with tabs", async ({ page }) => {
  await fresh(page, "#/directory/greg.foster");
  await expect(page.getByRole("navigation", { name: "breadcrumb" })).toContainText("Identity");
  await expect(page.getByRole("navigation", { name: "breadcrumb" })).toContainText("Greg Foster");
  const panel = page.locator("[data-detail-panel]");
  await expect(panel.getByRole("heading", { name: "Greg Foster" })).toBeVisible();
  await panel.getByRole("tab", { name: /Groups/ }).click();
  await expect(panel.getByRole("link", { name: "APP-Salesforce-User" })).toBeVisible();
  await panel.getByRole("tab", { name: /Audit log/ }).click();
  await expect(panel).toContainText("No changes to this account");
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
  // Global search
  await page.keyboard.press("Control+k");
  await page.getByPlaceholder(/Search by name/).fill("Derek Chan");
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-detail-panel]").getByRole("heading", { name: "Derek Chan" })).toBeVisible();
  // Groups page and panel
  await go(page, "#/groups/APP-SAP-AP-Approve");
  const gp = page.locator("[data-detail-panel]");
  await expect(gp.getByRole("heading", { name: "APP-SAP-AP-Approve" })).toBeVisible();
  await expect(gp).toContainText("Separation-of-duties rules");
  await gp.getByRole("tab", { name: "Members" }).click();
  await expect(gp.getByRole("link", { name: "Derek Chan" })).toBeVisible();
});

test("ticket tabs: activity records the work", async ({ page }) => {
  await fresh(page, "#/queue/REQ0018879");
  await page.getByRole("button", { name: "Start work" }).click();
  await page.getByRole("tab", { name: /Activity/ }).click();
  await expect(page.getByRole("tabpanel")).toContainText("Started work");
});

test("closing the auditor question without an answer shows an inline error", async ({ page }) => {
  await fresh(page, "#/queue/REQ0018884");
  await page.getByRole("button", { name: "Start work" }).click();
  await page.getByRole("button", { name: "Resolve" }).click();
  await expect(page.getByRole("alert")).toHaveText("Enter an answer before closing");
  await expect(page.locator("#ans-REQ0018884")).toBeFocused();
});

test("mobile: list/detail toggle and navigation sheet", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await fresh(page, "#/queue");
  await page.getByRole("link", { name: /CFO locked out/ }).click();
  await expect(page.getByRole("heading", { name: /CFO locked out/ })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Tickets" })).toBeHidden();
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await expect(page.getByRole("dialog", { name: "Verdelit navigation" })).toBeVisible();
  await page.keyboard.press("Escape");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(overflow).toBe(false);
});

for (const [name, path] of [["landing", "/"], ["privacy", "/privacy/"], ["terms", "/terms/"], ["404", "/404.html"], ["pricing", "/pricing/"], ["tracks", "/tracks/"], ["industries", "/industries/"], ["labs", "/labs/"], ["resources", "/resources/"], ["home", "/app/#/home"], ["queue", "/app/#/queue/INC0041220"], ["directory", "/app/#/directory/greg.foster"], ["groups", "/app/#/groups/APP-SAP-AP-Approve"], ["policy", "/app/#/policy"], ["results", "/app/#/results"], ["report", "/app/#/report"], ["grc", "/app/#/grc/G1"], ["lab", "/app/#/labs"], ["settings", "/app/#/settings"], ["week", "/app/#/week"], ["friday", "/app/#/audit"]] as const) {
  for (const theme of ["dark", "light"]) {
    test(`axe: ${name} (${theme}) has no serious or critical violations`, async ({ page }) => {
      await page.goto("/app/");
      await page.evaluate(t => { localStorage.clear(); if (t === "light") localStorage.setItem("verdelit-theme", "light"); }, theme);
      await page.goto(path); await page.reload(); await page.waitForTimeout(400);
      const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      const bad = r.violations.filter(v => v.impact === "serious" || v.impact === "critical");
      expect(bad.map(v => `${v.id}: ${v.nodes.slice(0, 3).map(n => n.target.join(" ")).join(" | ")}`)).toEqual([]);
    });
  }
}
