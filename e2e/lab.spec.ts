// Entra ID lab page: script downloads, tabs, and grading an uploaded export in the browser.
import { test, expect } from "@playwright/test";
import { labSpec } from "../src/app/lab/entra";

const T0 = "2026-10-05T14:00:00Z";
const spec = labSpec();
const untouched = {
  schema: "verdelit-entra-export/1", exportedAt: "2026-10-05T15:00:00Z", seededAt: T0,
  baseline: Object.fromEntries(spec.users.map(u => [u.key, { sessionsValidFrom: T0, passwordChanged: T0 }])),
  users: spec.users.map(u => ({ key: u.key, name: u.name, employeeId: u.empId, accountEnabled: u.enabled, department: u.dept,
    jobTitle: u.title, sessionsValidFrom: T0, passwordChanged: T0, groups: u.groups })),
};

test("lab guide: scripts download, and an export is graded in the browser", async ({ page, request }) => {
  for (const f of ["Seed-VerdelitLab.ps1", "Export-VerdelitLab.ps1", "Remove-VerdelitLab.ps1"]) {
    const r = await request.get(`/lab/entra/${f}`);
    expect(r.status(), f).toBe(200);
    expect(await r.text()).toContain(".SYNOPSIS");
  }

  await page.goto("/app/#/labs");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Connect your lab");
  await expect(page.getByRole("link", { name: "Seed-VerdelitLab.ps1" })).toHaveAttribute("download", "");

  await page.getByRole("tab", { name: "Run scripts" }).click();
  await expect(page.getByText("REQ0018850")).toBeVisible();

  await page.getByRole("tab", { name: "Upload results" }).click();
  const file = page.getByLabel("Export file");

  await file.setInputFiles({ name: "notes.json", mimeType: "application/json", buffer: Buffer.from('{"schema":"other"}') });
  await expect(page.getByRole("alert")).toContainText("isn't a Verdelit lab export");

  await file.setInputFiles({ name: "verdelit-lab-export.json", mimeType: "application/json", buffer: Buffer.from(String.fromCharCode(0xfeff) + JSON.stringify(untouched)) });
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Lab score" })).toBeFocused();
  const leaver = page.getByRole("article", { name: "Termination: Robert Hayes, effective noon" });
  await expect(leaver).toContainText("0/8");
  await expect(leaver).toContainText("Still in: GRP-All-Staff");
});

test("lab guide fits a 390px screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app/#/labs");
  for (const tab of ["Setup", "Run scripts", "Upload results", "Troubleshooting"]) {
    await page.getByRole("tab", { name: tab }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), tab).toBe(false);
  }
});
