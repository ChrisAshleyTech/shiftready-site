// Company switcher, company logos and app icons.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("the header shows the company and its switcher; the report shows the company logo", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/app/#/home");
  const sw = page.getByRole("combobox", { name: "Company" });
  await expect(sw).toContainText("Pacific Crest Logistics");
  await sw.click();
  await expect(page.getByRole("option", { name: /Pacific Crest Logistics/ })).toBeVisible();
  // All six companies on the site are listed, each with its logo.
  const options = page.getByRole("option");
  await expect(options).toHaveCount(6);
  for (const n of ["Harbor Health Network", "Meridian Aerospace", "Coastline Credit Union", "Brightpath SaaS", "Sunset Retail Group"])
    await expect(page.getByRole("option", { name: new RegExp(n) }).locator("svg")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(sw).toBeFocused();

  await page.goto("/app/#/groups");
  await expect(page.locator("tbody tr").first().locator("svg")).toHaveCount(1);

  await page.goto("/app/#/report");
  await expect(page.getByText(/IAM \+ GRC path · Pacific Crest Logistics simulation/).locator("svg")).toHaveCount(1);
});

test("on a phone, the company switcher is in the navigation drawer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app/#/home");
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  const drawer = page.getByRole("dialog", { name: "Rolevara navigation" });
  await expect(drawer.getByRole("combobox", { name: "Company" })).toContainText("Pacific Crest Logistics");
});

// Companies whose tickets are still being written. Extended as each pack lands.
const NEW = [
  { name: "Harbor Health Network", group: "APP-EHR-Clinical", note: /Epic or Oracle Health/, source: /45 CFR 164/ },
  { name: "Meridian Aerospace", group: "APP-PLM-CUI", note: /Teamcenter/, source: /NIST SP 800-171 Rev. 2/ },
  { name: "Coastline Credit Union", group: "APP-Core-Teller", note: /Symitar/, source: /12 CFR/ },
  { name: "Brightpath SaaS", group: "APP-CI-CD-Deploy-Prod", note: /GitHub Actions/, source: /SOC 2 CC/ },
  { name: "Sunset Retail Group", group: "APP-POS-Cashier", note: /Xstore/, source: /PCI DSS v4.0.1/ },
];
for (const c of NEW) {
  test(`${c.name}: switch, explore, and switch back without losing progress`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/app/");
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem("rolevara-path", "iam-grc"); });
    await page.goto("/app/#/queue/INC0041220");
    await page.reload(); // a hash-only goto doesn't reload, and the path is read on load
    await page.getByRole("button", { name: "Start work" }).click();

    await page.getByRole("combobox", { name: "Company" }).click();
    await page.getByRole("option", { name: new RegExp(c.name) }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(c.name);
    await expect(page.getByRole("combobox", { name: "Company" })).toContainText(c.name);
    await expect(page.getByText(/Tickets for .* are in development/).first()).toBeVisible();
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(axe.violations.filter(v => v.impact === "serious" || v.impact === "critical").map(v => v.id)).toEqual([]);

    await page.goto("/app/#/queue");
    await expect(page.getByText(`Tickets for ${c.name} are in development`)).toBeVisible();
    await page.goto(`/app/#/groups/${c.group}`);
    await expect(page.getByText(c.note)).toBeVisible();
    await page.goto("/app/#/policy");
    await expect(page.getByRole("link", { name: c.source }).first()).toBeVisible();

    // The choice survives a reload.
    await page.reload();
    await expect(page.getByRole("combobox", { name: "Company" })).toContainText(c.name);

    await page.getByRole("combobox", { name: "Company" }).click();
    await page.getByRole("option", { name: /Pacific Crest Logistics/ }).click();
    await expect(page.getByRole("combobox", { name: "Company" })).toContainText("Pacific Crest Logistics");
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("pcl-iam-sim-v1")!));
    expect(saved.active).toBe("INC0041220");
    expect(saved.tickets.INC0041220.status).toBe("working");
  });
}
