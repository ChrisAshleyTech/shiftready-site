// Real downloads: access review, a GRC sample and the audit populations, as CSV and Excel.
import { test, expect, type Page, type Download } from "@playwright/test";
import { readFileSync } from "node:fs";

const grab = async (page: Page, click: () => Promise<void>) => {
  const [d] = await Promise.all([page.waitForEvent("download"), click()]);
  return d as Download;
};
const text = async (d: Download) => readFileSync((await d.path())!, "utf8");
const isXlsx = async (d: Download) => readFileSync((await d.path())!).subarray(0, 2).toString() === "PK";

test("access review, GRC sample and audit populations download as CSV and Excel", async ({ page }) => {
  await page.goto("/app/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/app/#/directory");

  let d = await grab(page, () => page.getByRole("button", { name: "Access review, CSV" }).click());
  expect(d.suggestedFilename()).toMatch(/^pacific-crest-access-review-\d{4}-\d{2}-\d{2}\.csv$/);
  const csv = await text(d);
  expect(csv.split("\r\n")[0]).toContain("Username,Name,Employee ID");
  expect(csv).toContain("derek.chan,Derek Chan,10047");
  d = await grab(page, () => page.getByRole("button", { name: "Access review, Excel" }).click());
  expect(d.suggestedFilename()).toMatch(/\.xlsx$/);
  expect(await isXlsx(d)).toBe(true);

  await page.goto("/app/#/grc/G2");
  d = await grab(page, () => page.getByRole("button", { name: "Download the sample, CSV" }).click());
  const sample = await text(d);
  expect(sample).toContain("Brian Walsh");
  expect(sample).not.toContain("Still enabled at extract and signing in"); // the answer stays out

  await page.getByLabel("Population", { exact: true }).selectOption("Invoices");
  d = await grab(page, () => page.getByRole("button", { name: "Download, CSV" }).click());
  expect(d.suggestedFilename()).toMatch(/^pacific-crest-invoices-/);
  expect((await text(d)).split("\r\n")[0]).toContain("AP document,Vendor invoice no.");
  d = await grab(page, () => page.getByRole("button", { name: "Download, Excel" }).click());
  expect(await isXlsx(d)).toBe(true);
});
