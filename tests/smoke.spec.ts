import { expect, test } from "@playwright/test";

test("about page renders core header on default locale", async ({ page }) => {
  await page.goto("/about");

  await expect(page.getByRole("link", { name: /Cryptic WikiNet/i }).first()).toBeVisible();
  await expect(page).toHaveURL(/\/about$/);
});

test("localized about page renders on Korean route", async ({ page }) => {
  await page.goto("/ko/about");

  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await expect(page.getByRole("link", { name: /Cryptic WikiNet/i }).first()).toBeVisible();
});
