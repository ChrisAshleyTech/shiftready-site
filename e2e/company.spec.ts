// Company switcher, company logos and app icons.
import { test, expect } from "@playwright/test";

test("the header shows the company and its switcher; the report shows the company logo", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/app/#/home");
  const sw = page.getByRole("combobox", { name: "Company" });
  await expect(sw).toContainText("Pacific Crest Logistics");
  await sw.click();
  await expect(page.getByRole("option", { name: /Pacific Crest Logistics/ })).toBeVisible();
  await expect(page.getByText("More industry companies are in development.")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sw).toBeFocused();

  await page.goto("/app/#/groups");
  await expect(page.locator("tbody tr").first().locator("svg")).toHaveCount(1);

  await page.goto("/app/#/report");
  await expect(page.getByText(/IAM Ops track · Pacific Crest Logistics simulation/).locator("svg")).toHaveCount(1);
});

test("on a phone, the company switcher is in the navigation drawer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app/#/home");
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  const drawer = page.getByRole("dialog", { name: "ShiftReady navigation" });
  await expect(drawer.getByRole("combobox", { name: "Company" })).toContainText("Pacific Crest Logistics");
});
