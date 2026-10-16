import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("synthetic UI: keyboard completion, routes, profile, chat and mobile accessibility", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.name));
  await page.goto("http://127.0.0.1:5174/tests/smoke/fixture.html");
  const task = page.getByRole("button", { name: "Notice when you feel thirsty." });
  await task.focus();
  await page.keyboard.press("Enter");
  await expect(task).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Progress", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your Progress" })).toBeVisible();
  await page.waitForTimeout(1500); // Allow the existing entrance animations to settle before contrast checks.
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "Profile", exact: true }).click();
  await page.getByRole("button", { name: "Edit name" }).click();
  await page.getByRole("textbox", { name: "Your name" }).fill("Synthetic Updated");
  await page.getByRole("button", { name: "Save name" }).click();
  await expect(page.getByRole("heading", { name: "Synthetic Updated" })).toBeVisible();
  await page.waitForTimeout(1500); // Allow the existing entrance animations to settle before contrast checks.
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page.getByRole("button", { name: /AI Wellness Coach/ }).click();
  await page
    .getByRole("textbox", { name: "Message to wellness coach" })
    .fill("Synthetic sleep question");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText(/Synthetic provider fixture:/)).toBeVisible();
  await page.waitForTimeout(1500); // Allow the existing entrance animations to settle before contrast checks.
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/synthetic-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: "test-results/synthetic-desktop.png", fullPage: true });
  expect(errors).toEqual([]);
});
