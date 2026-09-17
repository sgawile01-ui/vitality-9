import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function waitForEntranceAnimations(page: Page) {
  // Motion animates opacity via inline styles. Check the rendered state rather
  // than sleeping a fixed duration; WCAG contrast rules remain unchanged.
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll<HTMLElement>("[style]")).every(
      (element) => !element.style.opacity || Number(getComputedStyle(element).opacity) === 1,
    ),
  );
}
test("local testing journey persists, advances, edits profile and exercises offline coach", async ({
  page,
  request,
}) => {
  const reset = await request.post("/_testing/rpc", {
    headers: { Origin: "http://127.0.0.1:5175" },
    data: { name: "tasks:resetChallenge", args: {} },
  });
  expect(reset.ok()).toBe(true);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.name));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/testing/index.html");
  await expect(page.getByRole("heading", { name: "Hydration", exact: true })).toBeVisible({
    timeout: 45000,
  });
  const tasks = [
    "Notice when you feel thirsty.",
    "Place drinking water somewhere convenient.",
    "Choose a cup you enjoy using.",
    "Have water with a meal if comfortable.",
    "Check that your drinking water is safe.",
    "Plan water access for an outing.",
    "Notice which drinks you enjoy without judging yourself.",
    "Follow any fluid limits given by your care team.",
    "Reflect on one hydration habit to keep.",
  ];
  for (const text of tasks) {
    const button = page.getByRole("button", { name: text, exact: true });
    await expect(button).toBeVisible({ timeout: 30000 });
    await button.click();
    await expect(button)
      .toHaveAttribute("aria-pressed", "true", { timeout: 30000 })
      .catch(async () => {
        await expect(page.getByRole("heading", { name: "Movement", exact: true })).toBeVisible({
          timeout: 30000,
        });
      });
  }
  await expect(page.getByRole("heading", { name: "Movement", exact: true })).toBeVisible({
    timeout: 30000,
  });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Movement", exact: true })).toBeVisible({
    timeout: 30000,
  });
  await page.getByRole("button", { name: "Profile", exact: true }).click();
  await page.getByRole("button", { name: "Edit name" }).click();
  await page.getByRole("textbox", { name: "Your name" }).fill("Synthetic Tester");
  await page.getByRole("button", { name: "Save name" }).click();
  await expect(page.getByRole("heading", { name: "Synthetic Tester", exact: true })).toBeVisible({
    timeout: 30000,
  });
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page.getByRole("button", { name: /AI Wellness Coach/ }).click();
  await page
    .getByRole("textbox", { name: "Message to wellness coach" })
    .fill("Help me build a sleep routine");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText(/Offline practice response/)).toBeVisible({ timeout: 30000 });
  await page
    .getByRole("textbox", { name: "Message to wellness coach" })
    .fill("I have chest pain with sweating");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText(/^Contact your local emergency services now/)).toBeVisible({
    timeout: 30000,
  });
  await waitForEntranceAnimations(page);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/testing-app-mobile.png", fullPage: true });
  expect(errors).toEqual([]);
  const finalReset = await request.post("/_testing/rpc", {
    headers: { Origin: "http://127.0.0.1:5175" },
    data: { name: "tasks:resetChallenge", args: {} },
  });
  expect(finalReset.ok()).toBe(true);
});
test("testing API rejects foreign origins, privileged functions and private files", async ({
  request,
}) => {
  expect(
    (
      await request.post("/_testing/rpc", {
        headers: { Origin: "https://example.invalid" },
        data: { name: "users:getCurrentUser", args: {} },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/_testing/rpc", {
        headers: { Origin: "http://127.0.0.1:5175" },
        data: { name: "paymentsDb:activatePro", args: {} },
      })
    ).status(),
  ).toBe(403);
  for (const path of [
    "/.convex/local/default/config.json",
    "/convex/lib/coach.ts",
    "/testing/backend.ts",
  ]) {
    expect([403, 404]).toContain((await request.get(path)).status());
  }
});

for (const width of [320, 768, 1440]) {
  test(`responsive navigation and logout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/testing/index.html");
    await expect(page.getByRole("heading", { name: "Hydration", exact: true })).toBeVisible({
      timeout: 45000,
    });
    for (const name of ["Progress", "Profile", "Home"]) {
      await page.getByRole("button", { name, exact: true }).click();
      await expect(
        page.getByRole("heading", {
          name: name === "Home" ? "Hydration" : name === "Progress" ? "Your Progress" : name,
          exact: true,
        }),
      ).toBeVisible({ timeout: 30000 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    await page.getByRole("button", { name: "Profile", exact: true }).click();
    await page.getByRole("button", { name: /Sign out/i }).click();
    await expect(page.getByRole("button", { name: /Sign in/i })).toBeVisible();
    // This verifies only the synthetic testing adapter; real OIDC logout is a release gate.
    await page.getByRole("button", { name: /Sign in/i }).click();
    await page.getByRole("button", { name: "Profile", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Synthetic Tester", exact: true })).toBeVisible({
      timeout: 30000,
    });
    await waitForEntranceAnimations(page);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({ path: `test-results/responsive-${width}.png`, fullPage: true });
  });
}
