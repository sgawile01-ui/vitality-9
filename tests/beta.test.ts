import { afterEach, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "../convex/schema";
import { api } from "../convex/_generated/api";
const modules = import.meta.glob("../convex/**/*.ts");
afterEach(() => vi.unstubAllEnvs());
it("fresh invited CLI identities remain non-Pro and isolated; invitation denial is distinct", async () => {
  vi.stubEnv("BETA_MODE", "restricted");
  vi.stubEnv("BETA_ALLOWED_SUBJECTS", "synthetic-local-check");
  const t = convexTest(schema, modules);
  const identity = {
    subject: "synthetic-local-check",
    issuer: "https://synthetic.invalid",
    tokenIdentifier: "synthetic-local|previous-run",
  };
  const previous = t.withIdentity(identity);
  await previous.mutation(api.users.updateCurrentUser, {});
  const oldUser = await previous.query(api.users.getCurrentUser, {});
  await t.run(async (ctx) => ctx.db.patch(oldUser!._id, { isPro: true }));
  await previous.mutation(api.tasks.toggleTask, { dayNumber: 1, taskIndex: 0, isCompleted: true });
  const freshIdentity = { ...identity, tokenIdentifier: "synthetic-local|fresh-run" };
  const fresh = t.withIdentity(freshIdentity);
  const id = await fresh.mutation(api.users.updateCurrentUser, {});
  expect(await fresh.mutation(api.users.updateCurrentUser, {})).toBe(id);
  expect(id).not.toBe(oldUser!._id);
  expect(await fresh.query(api.users.getCurrentUser, {})).toMatchObject({
    tokenIdentifier: freshIdentity.tokenIdentifier,
    isPro: false,
  });
  expect(await fresh.query(api.tasks.getAllUserTasks, {})).toEqual([]);
  const args = { message: "Synthetic wellness request", history: [] };
  await expect(fresh.action(api.aiCoach.chat, args)).rejects.toThrow(/FORBIDDEN/);
  const outsider = t.withIdentity({ subject: "synthetic-uninvited" });
  await expect(outsider.mutation(api.users.updateCurrentUser, {})).rejects.toThrow(
    /BETA_RESTRICTED/,
  );
  await expect(outsider.action(api.aiCoach.chat, args)).rejects.toThrow(/BETA_RESTRICTED/);
  vi.stubEnv("BETA_ALLOWED_SUBJECTS", "");
  await expect(previous.action(api.aiCoach.chat, args)).rejects.toThrow(/BETA_RESTRICTED/);
});
it("restricted beta denies non-invited users across profile, tasks, coach and payments", async () => {
  const t = convexTest(schema, modules);
  const user = t.withIdentity({ subject: "synthetic-invite", tokenIdentifier: "synthetic|invite" });
  await user.mutation(api.users.updateCurrentUser, {});
  vi.stubEnv("BETA_MODE", "restricted");
  vi.stubEnv("BETA_ALLOWED_SUBJECTS", "another-subject");
  expect((await user.query(api.beta.access, {})).allowed).toBe(false);
  for (const run of [
    () => user.mutation(api.users.updateCurrentUser, {}),
    () => user.query(api.users.getCurrentUser, {}),
    () => user.query(api.tasks.getAllUserTasks, {}),
    () => user.query(api.tasks.getTasksForDay, { dayNumber: 1 }),
    () => user.mutation(api.tasks.toggleTask, { dayNumber: 1, taskIndex: 0, isCompleted: true }),
    () => user.action(api.aiCoach.chat, { message: "sleep please", history: [] }),
    () =>
      user.action(api.payments.createProCheckoutSession, {
        requestId: "synthetic-request",
        successUrl: "https://example.invalid",
        cancelUrl: "https://example.invalid",
      }),
  ])
    await expect(run()).rejects.toThrow(/BETA_RESTRICTED/);
  vi.stubEnv("BETA_ALLOWED_SUBJECTS", "synthetic-invite");
  expect((await user.query(api.beta.access, {})).allowed).toBe(true);
  await user.mutation(api.tasks.toggleTask, { dayNumber: 1, taskIndex: 0, isCompleted: true });
  expect(await user.query(api.tasks.getAllUserTasks, {})).toHaveLength(1);
  vi.stubEnv("BETA_ALLOWED_SUBJECTS", "");
  await expect(user.query(api.tasks.getAllUserTasks, {})).rejects.toThrow(/BETA_RESTRICTED/);
});

it("missing beta mode fails closed", async () => {
  const t = convexTest(schema, modules);
  const user = t.withIdentity({ subject: "not-invited" });
  vi.stubEnv("BETA_MODE", undefined);
  vi.stubEnv("BETA_ALLOWED_SUBJECTS", "");
  expect(await user.query(api.beta.access, {})).toEqual({ restricted: true, allowed: false });
  await expect(user.mutation(api.users.updateCurrentUser, {})).rejects.toThrow(/BETA_RESTRICTED/);
});

it.each([
  { NODE_ENV: "production", CONVEX_DEPLOYMENT: "anonymous:synthetic" },
  { VERCEL_ENV: "production" },
  { CONVEX_DEPLOYMENT_TYPE: "production" },
  { CONVEX_DEPLOYMENT: "prod:synthetic" },
  { CONVEX_CLOUD_URL: "https://synthetic-review.convex.cloud" },
  { CONVEX_CLOUD_URL: "not-a-url" },
])("local flag cannot bypass production or remote deployment: %j", async (environment) => {
  for (const name of [
    "NODE_ENV",
    "VERCEL_ENV",
    "CONVEX_DEPLOYMENT_TYPE",
    "CONVEX_DEPLOYMENT",
    "CONVEX_CLOUD_URL",
  ])
    vi.stubEnv(name, undefined);
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("CONVEX_CLOUD_URL", "http://127.0.0.1:3210");
  vi.stubEnv("BETA_MODE", "local");
  vi.stubEnv("BETA_ALLOWED_SUBJECTS", "");
  for (const [name, value] of Object.entries(environment)) vi.stubEnv(name, value);
  const t = convexTest(schema, modules);
  const user = t.withIdentity({ subject: "uninvited-production-simulation" });
  expect(await user.query(api.beta.access, {})).toEqual({ restricted: true, allowed: false });
  await expect(user.mutation(api.users.updateCurrentUser, {})).rejects.toThrow(/BETA_RESTRICTED/);
  await expect(user.query(api.tasks.getAllUserTasks, {})).rejects.toThrow(/BETA_RESTRICTED/);
  await expect(
    user.action(api.aiCoach.chat, { message: "Synthetic sleep routine", history: [] }),
  ).rejects.toThrow(/BETA_RESTRICTED/);
  await expect(
    user.action(api.payments.createProCheckoutSession, {
      requestId: "synthetic-request",
      successUrl: "https://example.invalid",
      cancelUrl: "https://example.invalid",
    }),
  ).rejects.toThrow(/BETA_RESTRICTED/);
});
it("unknown and local runtimes fail closed; only explicit invitations work", async () => {
  for (const name of [
    "NODE_ENV",
    "VERCEL_ENV",
    "CONVEX_DEPLOYMENT_TYPE",
    "CONVEX_DEPLOYMENT",
    "CONVEX_CLOUD_URL",
  ])
    vi.stubEnv(name, undefined);
  vi.stubEnv("BETA_MODE", "local");
  vi.stubEnv("BETA_ALLOWED_SUBJECTS", "");
  const t = convexTest(schema, modules);
  const user = t.withIdentity({ subject: "synthetic-invited" });
  expect((await user.query(api.beta.access, {})).allowed).toBe(false);
  vi.stubEnv("CONVEX_CLOUD_URL", "http://127.0.0.1:3210");
  expect(await user.query(api.beta.access, {})).toEqual({ restricted: true, allowed: false });
  vi.stubEnv("NODE_ENV", "production");
  expect((await user.query(api.beta.access, {})).allowed).toBe(false);
  vi.stubEnv("BETA_ALLOWED_SUBJECTS", "synthetic-invited");
  expect(await user.query(api.beta.access, {})).toEqual({ restricted: true, allowed: true });
});
