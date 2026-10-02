// Paths: the first-visit picker, GRC only (auditing Jordan Reyes' shift), switching paths without
// losing progress, the optional self-audit, the shift summary, and framework panels.
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
// @ts-ignore: plain JS engine modules
import { S, setState } from "../src/engine/store.js";
// @ts-ignore
import * as st from "../src/engine/state.js";
// @ts-ignore
import { T, TK } from "../src/engine/tickets.js";
// @ts-ignore
import { queueTickets } from "../src/engine/followups.js";
// @ts-ignore
import { PLAYBOOK } from "../tests/playbook.js";

const go = (page: Page, hash: string) => page.evaluate(h => { location.hash = h; }, hash);
const axe = async (page: Page) => {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(r.violations.filter(v => v.impact === "serious" || v.impact === "critical").map(v => v.id)).toEqual([]);
};

// A finished shift, every ticket worked by the runbook, including whatever arrived.
function finishedShift() {
  setState(st.fresh());
  const work = (id: string) => { st.tact("start", id); let r = PLAYBOOK[id](id); if (!Array.isArray(r)) r = [r]; st.closeTicket(id, r[0], { answer: TK[id].question ? r[1] : undefined }); };
  T.forEach((t: any) => work(t.id));
  for (let i = 0; i < 100; i++) {
    const next = queueTickets().find((t: any) => !S.tickets[t.id].checks);
    if (!next) break;
    work(next.id);
  }
  return JSON.stringify(S);
}

test("first visit: choose GRC only and audit Jordan Reyes' shift", async ({ page }) => {
  await page.goto("/app/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/app/#/home");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Choose your path");
  await axe(page);
  await page.getByRole("button", { name: "Choose GRC only" }).click();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Audit Jordan Reyes' shift");
  const where = page.getByRole("region", { name: "Where you are" });
  await expect(where).toContainText("GRC only");
  await expect(where).toContainText("Pacific Crest Logistics");
  await expect(where).toContainText("Audit task 1: Walkthrough");
  await expect(page.getByRole("link", { name: "Audit Jordan's shift" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ticket queue" })).toHaveCount(0);

  // The queue belongs to the IAM paths; the directory is read-only evidence.
  await go(page, "#/queue");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ticket queue isn't part of the GRC only path");
  await go(page, "#/directory/marcus.bell");
  await expect(page.getByText("Read-only evidence.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Disable" })).toHaveCount(0);
  // Jordan's unticketed password reset is in the evidence.
  const panel = page.locator("[data-detail-panel]");
  await panel.getByRole("tab", { name: /Audit log/ }).click();
  await expect(panel).toContainText("no ticket");
  await page.keyboard.press("Escape");

  // Control testing shows Jordan's evidence; the walkthrough grades like a shift.
  await go(page, "#/audit/W3");
  await expect(page.locator("form")).toContainText("Temporary password issued");
  await axe(page);
  await go(page, "#/audit/W1");
  await page.getByRole("button", { name: "Submit workpaper" }).click();
  await expect(page.getByRole("alert")).toHaveText("Answer every item before submitting.");
  for (const [q, a] of [["Which step is the key control", /Comparing the caller's details/], ["What evidence shows", /entry in the audit log/], ["How do you describe APD-03", /Per event, manual, preventive/], ["What is a walkthrough for", /confirm you understand the process/]] as const)
    await page.getByRole("group", { name: new RegExp(q) }).getByLabel(a).check();
  await page.getByRole("button", { name: "Submit workpaper" }).click();
  await expect(page.locator("#wt-h")).toBeFocused();
  await expect(page.locator("div.text-3xl").filter({ hasText: "8/8" })).toBeVisible();
  // After grading, the framework panel quotes NIST and paraphrases ISO.
  const fw = page.locator("[data-framework-panel]");
  await expect(fw).toContainText("CA-2d");
  await expect(fw).toContainText("In plain English");

  // Switch to IAM only: the queue starts fresh there. Switch back: the audit is still in progress.
  await go(page, "#/settings");
  await axe(page);
  await page.getByRole("button", { name: "Switch to IAM only" }).click();
  await go(page, "#/home");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("20 tickets are waiting.");
  await expect(page.getByRole("link", { name: /Audit Jordan's shift|Audit your shift/ })).toHaveCount(0);
  await go(page, "#/settings");
  await page.getByRole("button", { name: "Switch to GRC only" }).click();
  await go(page, "#/home");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("1 of 7 tasks submitted");

  // The report is an audit report, and its link round-trips.
  await go(page, "#/report");
  await expect(page.getByText(/GRC only path · Pacific Crest Logistics simulation/)).toBeVisible();
  await expect(page.getByRole("table")).toContainText("Walkthrough");
});

test("IAM + GRC: the self-audit is optional, the shift summary follows, and tickets show framework panels", async ({ page }) => {
  const shift = finishedShift();
  await page.goto("/app/");
  await page.evaluate(w => { localStorage.clear(); localStorage.setItem("rolevara-path", "iam-grc"); localStorage.setItem("pcl-iam-sim-v1", w); }, shift);
  await page.goto("/app/#/home");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Now audit it/);
  await expect(page.getByRole("region", { name: "Where you are" })).toContainText("Audit your own shift (optional)");

  // A closed ticket's framework panel shows the requirement text.
  await go(page, "#/queue/INC0041207");
  const fw = page.locator("[data-framework-panel]");
  await expect(fw).toContainText("IA-5a");
  await expect(fw).toContainText("8.3.3");
  await axe(page);

  await go(page, "#/audit");
  await page.getByRole("button", { name: "Skip the audit" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Shift summary");
  await expect(page.getByText("Skipped").first()).toBeVisible();
  await axe(page);
  await page.getByRole("link", { name: "Audit your shift after all" }).click();
  await page.getByRole("button", { name: "Audit your shift after all" }).click();
  await page.getByRole("button", { name: "Start the audit" }).click();
  await expect(page.getByRole("heading", { name: "Walk through a caller reset" })).toBeVisible();
  await go(page, "#/audit/W7");
  await expect(page.getByRole("group", { name: /exceptions are in your own work/ })).toBeVisible();
});

test("IAM only: no audit screens and no framework panels", async ({ page }) => {
  const shift = finishedShift();
  await page.goto("/app/");
  await page.evaluate(w => { localStorage.clear(); localStorage.setItem("rolevara-path", "iam"); localStorage.setItem("pcl-iam-sim-v1:iam", w); }, shift);
  await page.goto("/app/#/queue/INC0041207");
  await page.reload();
  await expect(page.getByRole("heading", { name: /Forgot password/ })).toBeVisible();
  await expect(page.locator("[data-framework-panel]")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Audit your shift|SOX audit desk/ })).toHaveCount(0);
  await go(page, "#/home");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Shift score/);
  await go(page, "#/week");
  await expect(page.getByRole("heading", { name: "What came back to you" })).toBeVisible();
  await expect(page.getByText("every follow-up was prevented", { exact: false })).toBeVisible();
});
