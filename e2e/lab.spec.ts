// Platform lab guides: locked without tester access; a signed link unlocks the guides, the script
// downloads and in-browser grading for Entra ID, Okta and AWS.
import { test, expect, type Page } from "@playwright/test";
import { labSpec } from "../src/app/lab/core";
import { AWS_KEY_USERS } from "../src/app/lab/aws";
import { signToken } from "../api/_lib/labAccess.js";
import { E2E_LAB_SECRET } from "./labSecret";

const T0 = "2026-10-05T14:00:00Z";
const spec = labSpec();
const link = (days = 7) => `/labs/access?key=${signToken({ sub: "e2e@example.com", exp: Math.floor(Date.now() / 1000) + days * 86400 }, E2E_LAB_SECRET)}`;
const entraUntouched = {
  schema: "rolevara-entra-export/1", exportedAt: "2026-10-05T15:00:00Z", seededAt: T0,
  baseline: Object.fromEntries(spec.users.map(u => [u.key, { sessionsValidFrom: T0, passwordChanged: T0 }])),
  users: spec.users.map(u => ({ key: u.key, name: u.name, employeeId: u.empId, accountEnabled: u.enabled, department: u.dept,
    jobTitle: u.title, sessionsValidFrom: T0, passwordChanged: T0, groups: u.groups })),
};
const awsUntouched = {
  schema: "rolevara-aws-export/1", exportedAt: "2026-10-05T15:00:00Z", seededAt: T0,
  users: spec.users.map(u => ({ key: u.key, consoleAccess: u.enabled, loginProfileCreated: u.enabled ? T0 : null, activeAccessKeys: AWS_KEY_USERS.includes(u.key) ? 1 : 0,
    department: u.dept, jobTitle: u.title, groups: u.groups })),
};
const upload = (page: Page, name: string, body: string) =>
  page.getByLabel("Export file").setInputFiles({ name, mimeType: "application/json", buffer: Buffer.from(body) });

test("without access: the guide is locked and the scripts aren't served", async ({ page, request }) => {
  for (const f of ["entra/Seed-RolevaraLab.ps1", "okta/Seed-RolevaraOktaLab.ps1", "aws/seed_rolevara_lab.py"])
    expect((await request.get(`/lab-files/${f}`)).status(), f).toBe(401);
  // The old public path no longer serves the script.
  expect(await (await request.get("/lab/entra/Seed-RolevaraLab.ps1")).text()).not.toContain(".SYNOPSIS");
  await page.goto("/app/#/labs");
  await expect(page.getByRole("heading", { name: "Lab guides are part of Pro + Labs" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Run scripts" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Seed-RolevaraLab.ps1" })).toHaveCount(0);
});

test("an invalid or expired link goes back to /labs with a message", async ({ page }) => {
  await page.goto(link(-1));
  await expect(page).toHaveURL(/\/labs\/\?access=invalid$/);
  await expect(page.getByRole("alert")).toContainText("invalid or has expired");
});

test("with access: Entra scripts download, and an export is graded in the browser", async ({ page }) => {
  await page.goto(link());
  await expect(page).toHaveURL(/\/app\/#\/labs$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Connect your lab");
  await expect(page.getByRole("link", { name: "Seed-RolevaraLab.ps1" })).toHaveAttribute("download", "");
  for (const f of ["Seed-RolevaraLab.ps1", "Export-RolevaraLab.ps1", "Remove-RolevaraLab.ps1"]) {
    const r = await page.request.get(`/lab-files/entra/${f}`);
    expect(r.status(), f).toBe(200);
    expect(await r.text()).toContain(".SYNOPSIS");
  }

  await page.getByRole("tab", { name: "Run scripts" }).click();
  await expect(page.getByText("REQ0018850")).toBeVisible();
  await page.getByRole("tab", { name: "Upload results" }).click();
  await upload(page, "notes.json", '{"schema":"other"}');
  await expect(page.getByRole("alert")).toContainText("isn't a Rolevara lab export");
  await upload(page, "rolevara-lab-export.json", String.fromCharCode(0xfeff) + JSON.stringify(entraUntouched));
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Lab score" })).toBeFocused();
  const leaver = page.getByRole("article", { name: "Termination: Robert Hayes, effective noon" });
  await expect(leaver).toContainText("0/8");
  await expect(leaver).toContainText("Still in: GRP-All-Staff");
  const zip = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download portfolio project" }).click();
  expect((await zip).suggestedFilename()).toBe("rolevara-entra-lab-portfolio.zip");
});

test("with access: the Okta and AWS guides, and Active Directory coming soon", async ({ page }) => {
  await page.goto(link());
  const labs = page.getByRole("navigation", { name: "Labs" });
  await expect(labs).toContainText("Active DirectoryComing soon");
  await labs.getByRole("link", { name: "Okta" }).click();
  await expect(page).toHaveURL(/#\/labs\/okta$/);
  await expect(page.getByRole("link", { name: "Check-RolevaraOktaLab.ps1" })).toBeVisible();
  expect((await page.request.get("/lab-files/okta/Check-RolevaraOktaLab.ps1")).status()).toBe(200);
  await page.getByRole("tab", { name: "Run scripts" }).click();
  await expect(page.getByText("suspend her and keep her groups")).toBeVisible();

  await labs.getByRole("link", { name: "AWS" }).click();
  await expect(page.getByRole("link", { name: "rolevara-lab-aws.json" })).toBeVisible();
  const tpl = await page.request.get("/lab-files/aws/rolevara-lab-aws.json");
  expect(tpl.status()).toBe(200);
  expect((await tpl.json()).Resources).toBeTruthy();
  await page.getByRole("tab", { name: "Upload results" }).click();
  await upload(page, "rolevara-lab-export.json", JSON.stringify(entraUntouched));
  await expect(page.getByRole("alert")).toContainText("isn't a Rolevara AWS lab export");
  await upload(page, "rolevara-aws-export.json", JSON.stringify(awsUntouched));
  await expect(page.getByRole("article", { name: "Termination: Robert Hayes, effective noon" })).toContainText("0/8");
});

test("lab guides fit a 390px screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(link());
  for (const lab of ["entra", "okta", "aws"]) {
    await page.goto(`/app/#/labs/${lab}`);
    for (const tab of ["Setup", "Run scripts", "Upload results", "Troubleshooting"]) {
      await page.getByRole("tab", { name: tab }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), `${lab} ${tab}`).toBe(false);
    }
  }
});
