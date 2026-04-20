import { expect, test } from "@playwright/test";

test.describe("cookie consent", () => {
  test("clears optional preferences when switching back to essential only", async ({ context, page }) => {
    await context.addCookies([
      {
        name: "cw_cookie_notice",
        value: "preferences",
        url: "http://127.0.0.1:3000",
      },
    ]);

    await page.addInitScript(() => {
      window.localStorage.setItem("cw.localePrompt.dismissed", "1");
      window.localStorage.setItem("cw.sidebarSide", "right");

      Object.defineProperty(navigator, "languages", {
        configurable: true,
        get: () => ["ko-KR", "ko"],
      });
      Object.defineProperty(navigator, "language", {
        configurable: true,
        get: () => "ko-KR",
      });
    });

    await page.goto("/about");

    await expect(page.getByTestId("site-locale-prompt")).toHaveCount(0);

    await page.getByRole("button", { name: "Cookie settings" }).click();
    await expect(page.getByTestId("site-cookie-notice")).toBeVisible();
    await page.getByRole("button", { name: "Essential only" }).click();

    await expect(page.getByTestId("site-locale-prompt")).toBeVisible();
    await expect.poll(async () => {
      return page.evaluate(() => ({
        localePrompt: window.localStorage.getItem("cw.localePrompt.dismissed"),
        wikiSidebar: window.localStorage.getItem("cw.sidebarSide"),
      }));
    }).toEqual({ localePrompt: null, wikiSidebar: null });

    await page.getByRole("button", { name: "Cookie settings" }).click();
    await page.getByRole("button", { name: "Allow preferences" }).click();

    await expect(page.getByTestId("site-locale-prompt")).toBeVisible();
  });
});
