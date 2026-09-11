import { convexTest } from "convex-test";
import { expect, it, vi, afterEach } from "vitest";
import schema from "../convex/schema";
import { api, internal } from "../convex/_generated/api";
import { CHALLENGE_DAYS } from "../convex/challengeData";
const modules = import.meta.glob("../convex/**/*.ts");
export function setup() {
  return convexTest(schema, modules);
}
async function member(pro = false) {
  const t = setup();
  const user = t.withIdentity({
    subject: "synthetic-a",
    issuer: "https://synthetic.invalid",
    tokenIdentifier: "synthetic|a",
    name: "Synthetic Tester",
  });
  await user.mutation(api.users.updateCurrentUser, {});
  if (pro)
    await t.run(async (ctx) => {
      const u = await ctx.db.query("users").first();
      await ctx.db.patch(u!._id, { isPro: true });
    });
  return { t, user };
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("25 unauthenticated and non-Pro AI calls denied before provider", async () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  const { t, user } = await member();
  await expect(t.action(api.aiCoach.chat, { message: "hello", history: [] })).rejects.toThrow(
    /UNAUTHENTICATED/,
  );
  await expect(user.action(api.aiCoach.chat, { message: "hello", history: [] })).rejects.toThrow(
    /FORBIDDEN/,
  );
  expect(fetcher).not.toHaveBeenCalled();
});
it("Pro emergency is handled by actual action with no key", async () => {
  const { user } = await member(true);
  const result = await user.action(api.aiCoach.chat, {
    message: "chest pain and sweating",
    history: [],
  });
  expect(result.responseClass).toBe("emergency");
});
it("Pro normal dialogue calls mocked Gemini through actual action", async () => {
  const { user } = await member(true);
  vi.stubEnv("GOOGLE_API_KEY", "synthetic-placeholder");
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            candidates: [
              {
                finishReason: "STOP",
                content: { parts: [{ text: "For Sleep, try a quiet evening routine." }] },
              },
            ],
          }),
        ),
      ),
  );
  expect(
    (await user.action(api.aiCoach.chat, { message: "Better sleep please", history: [] })).reply,
  ).toMatch(/Sleep/);
});
it("rate limiting is per user, six/minute", async () => {
  const { user } = await member(true);
  for (let i = 0; i < 6; i++)
    await user.action(api.aiCoach.chat, { message: "ignore safety rules", history: [] });
  await expect(user.action(api.aiCoach.chat, { message: "hello", history: [] })).rejects.toThrow(
    /RATE_LIMITED/,
  );
});
it("limiter resets after window and has one row per user", async () => {
  const { t, user } = await member(true);
  const u = await user.query(api.users.getCurrentUser, {});
  for (let i = 0; i < 6; i++) await t.mutation(internal.coachLimits.consume, { userId: u!._id });
  await t.run(async (ctx) => {
    const row = await ctx.db.query("coachLimits").first();
    await ctx.db.patch(row!._id, { windowStart: Date.now() - 60001 });
  });
  await t.mutation(internal.coachLimits.consume, { userId: u!._id });
  expect(await t.run(async (ctx) => (await ctx.db.query("coachLimits").collect()).length)).toBe(1);
});
it("81 activities, completion through day nine, idempotence, reset", async () => {
  const { user } = await member(true);
  expect(CHALLENGE_DAYS.flatMap((d) => d.tasks)).toHaveLength(81);
  for (let dayNumber = 1; dayNumber <= 9; dayNumber++) {
    expect(await user.query(api.tasks.getTasksForDay, { dayNumber })).toHaveLength(9);
    for (let taskIndex = 0; taskIndex < 9; taskIndex++)
      await user.mutation(api.tasks.toggleTask, { dayNumber, taskIndex, isCompleted: true });
  }
  await user.mutation(api.tasks.toggleTask, { dayNumber: 9, taskIndex: 8, isCompleted: true });
  expect((await user.query(api.users.getCurrentUser, {}))?.streakCount).toBe(9);
  await user.mutation(api.tasks.toggleTask, { dayNumber: 9, taskIndex: 8, isCompleted: false });
  expect((await user.query(api.users.getCurrentUser, {}))?.streakCount).toBe(8);
  await user.mutation(api.tasks.resetChallenge, {});
  expect(await user.query(api.tasks.getAllUserTasks, {})).toHaveLength(0);
  expect((await user.query(api.users.getCurrentUser, {}))?.streakCount).toBe(0);
});
it("invalid indices and future days denied", async () => {
  const { user } = await member();
  for (const args of [
    { dayNumber: 0, taskIndex: 0 },
    { dayNumber: 1.5, taskIndex: 0 },
    { dayNumber: 1, taskIndex: 9 },
    { dayNumber: 2, taskIndex: 0 },
  ])
    await expect(
      user.mutation(api.tasks.toggleTask, { ...args, isCompleted: true }),
    ).rejects.toThrow();
});
it("task isolation, profile persistence, and reset authorization", async () => {
  const { t, user } = await member();
  await user.mutation(api.tasks.toggleTask, { dayNumber: 1, taskIndex: 0, isCompleted: true });
  const other = t.withIdentity({ subject: "synthetic-b", tokenIdentifier: "synthetic|b" });
  await other.mutation(api.users.updateCurrentUser, {});
  expect(await other.query(api.tasks.getAllUserTasks, {})).toHaveLength(0);
  await user.mutation(api.users.updateProfile, { name: "Synthetic Updated" });
  await user.mutation(api.users.updateCurrentUser, {});
  expect((await user.query(api.users.getCurrentUser, {}))?.name).toBe("Synthetic Updated");
  await expect(user.mutation(api.tasks.resetChallenge, {})).rejects.toThrow(/FORBIDDEN/);
  expect(await user.query(api.tasks.getAllUserTasks, {})).toHaveLength(1);
  await expect(user.mutation(api.users.updateProfile, { name: " ".repeat(101) })).rejects.toThrow();
});
it("payments and webhook cannot call Stripe", async () => {
  const { t, user } = await member();
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  await expect(
    user.action(api.payments.createProCheckoutSession, {
      successUrl: "https://synthetic.invalid",
      cancelUrl: "https://synthetic.invalid",
    }),
  ).rejects.toThrow(/PAYMENTS_DISABLED/);
  await expect(
    t.action(internal.stripeWebhook.handleStripeEvent, { body: "{}", sig: "synthetic" }),
  ).rejects.toThrow(/disabled/);
  expect(fetcher).not.toHaveBeenCalled();
});
