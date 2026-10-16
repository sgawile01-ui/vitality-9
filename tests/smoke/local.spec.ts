import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("local setup loads on mobile and desktop without crashes", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.name));
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Vitality 9", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Local setup required" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
  expect(errors).toEqual([]);
});
