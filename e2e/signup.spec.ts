// Sign-up before the simulator, and the Home button back to the site.
import { test, expect } from "@playwright/test";

test.describe("new visitor", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("must sign up before the simulator opens, and stays signed up", async ({ page }) => {
    await page.goto("/app/#/queue");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Create your free account");
    await expect(page.getByRole("navigation", { name: "Rolevara navigation" })).toHaveCount(0);

    await page.getByRole("button", { name: "Sign up and start" }).click();
    await expect(page.getByText("Enter your name.")).toBeVisible();
    await page.getByLabel("Name").fill("Sam Lee");
    await page.getByLabel("Email").fill("sam@example");
    await page.getByRole("button", { name: "Sign up and start" }).click();
    await expect(page.getByText("Enter an email address in the format name@example.com.")).toBeVisible();
    await page.getByLabel("Email").fill("sam@example.com");
    await page.getByRole("button", { name: "Sign up and start" }).click();

    await expect(page.getByRole("link", { name: "Home page" })).toBeVisible();
    // Reset progress clears local storage; the sign-up is still remembered.
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.getByRole("link", { name: "Home page" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Create your free account" })).toHaveCount(0);
  });
});

test("Home button in the top bar goes to the homepage", async ({ page }) => {
  await page.goto("/app/#/directory");
  const home = page.getByRole("link", { name: "Home page" });
  await expect(home).toHaveAttribute("href", "/");
  await home.click();
  await expect(page).toHaveURL(/localhost:4173\/$/);
});
