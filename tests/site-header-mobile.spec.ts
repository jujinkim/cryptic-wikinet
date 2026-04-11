import { expect, test } from "@playwright/test";

test.describe("mobile header", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("keeps the title compact and places locale close to the brand on mobile", async ({ page }) => {
    await page.goto("/about");

    const title = page.getByTestId("site-header-title");
    const brand = page.getByTestId("site-header-brand");
    const localeTrigger = page.getByTestId("site-header-locale-trigger").first();

    await expect(title).toBeVisible();
    await expect(localeTrigger).toBeVisible();

    const fontSize = await title.evaluate((element) => parseFloat(window.getComputedStyle(element).fontSize));
    expect(fontSize).toBeLessThan(13);

    const brandBox = await brand.boundingBox();
    const localeBox = await localeTrigger.boundingBox();

    expect(brandBox).not.toBeNull();
    expect(localeBox).not.toBeNull();

    const gap = localeBox!.x - (brandBox!.x + brandBox!.width);
    expect(gap).toBeGreaterThanOrEqual(0);
    expect(gap).toBeLessThanOrEqual(16);
  });

  test("keeps the mobile menu row and docs trigger on the same line", async ({ page }) => {
    await page.goto("/ko/about");

    const mobileNav = page.getByTestId("site-header-mobile-nav");
    const firstItem = mobileNav.getByRole("link").first();
    const docsTrigger = page.getByTestId("site-header-mobile-docs-trigger");

    await expect(mobileNav).toBeVisible();
    await expect(firstItem).toBeVisible();
    await expect(docsTrigger).toBeVisible();

    const firstBox = await firstItem.boundingBox();
    const docsBox = await docsTrigger.boundingBox();

    expect(firstBox).not.toBeNull();
    expect(docsBox).not.toBeNull();
    expect(Math.abs((firstBox?.y ?? 0) - (docsBox?.y ?? 0))).toBeLessThanOrEqual(2);
  });
});
