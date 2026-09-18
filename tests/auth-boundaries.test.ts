import { afterEach, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "../convex/schema";
import { api } from "../convex/_generated/api";
const modules = import.meta.glob("../convex/**/*.ts");
afterEach(() => vi.unstubAllEnvs());

it("anonymous callers receive no private data and cannot mutate protected state", async () => {
  const t = convexTest(schema, modules);
  expect(await t.query(api.users.getCurrentUser, {})).toBeNull();
  expect(await t.mutation(api.users.updateCurrentUser, {})).toBeNull();
  expect(await t.query(api.tasks.getTasksForDay, { dayNumber: 1 })).toEqual([]);
  expect(await t.query(api.tasks.getAllUserTasks, {})).toEqual([]);
  expect(await t.query(api.beta.access, {})).toEqual({ restricted: true, allowed: false });
  for (const call of [
    () => t.mutation(api.users.updateProfile, { name: "Unauthorized" }),
    () => t.mutation(api.tasks.toggleTask, { dayNumber: 1, taskIndex: 0, isCompleted: true }),
    () => t.mutation(api.tasks.resetChallenge, {}),
    () => t.action(api.aiCoach.chat, { message: "hello", history: [] }),
  ])
    await expect(call()).rejects.toThrow(/UNAUTHENTICATED/);
  expect(await t.run((ctx) => ctx.db.query("users").collect())).toEqual([]);
});

it("two invited identities keep separate profiles and tasks across renewed identity contexts", async () => {
  vi.stubEnv("BETA_ALLOWED_SUBJECTS", "alpha,beta");
  const t = convexTest(schema, modules);
  const aIdentity = {
    issuer: "https://synthetic.invalid",
    subject: "alpha",
    tokenIdentifier: "synthetic|alpha",
  };
  const a = t.withIdentity(aIdentity);
  const b = t.withIdentity({
    issuer: "https://synthetic.invalid",
    subject: "beta",
    tokenIdentifier: "synthetic|beta",
  });
  const aId = await a.mutation(api.users.updateCurrentUser, {});
  const bId = await b.mutation(api.users.updateCurrentUser, {});
  expect(aId).not.toBe(bId);
  await a.mutation(api.users.updateProfile, { name: "Alpha" });
  await b.mutation(api.users.updateProfile, { name: "Beta" });
  await a.mutation(api.tasks.toggleTask, { dayNumber: 1, taskIndex: 0, isCompleted: true });
  await b.mutation(api.tasks.toggleTask, { dayNumber: 1, taskIndex: 1, isCompleted: true });
  const renewed = t.withIdentity({ ...aIdentity, email: "alpha@example.invalid" });
  expect(await renewed.mutation(api.users.updateCurrentUser, {})).toBe(aId);
  expect(await renewed.query(api.users.getCurrentUser, {})).toMatchObject({
    _id: aId,
    name: "Alpha",
  });
  expect(await renewed.query(api.tasks.getAllUserTasks, {})).toMatchObject([{ taskIndex: 0 }]);
  expect(await b.query(api.tasks.getAllUserTasks, {})).toMatchObject([{ taskIndex: 1 }]);
  expect(await b.query(api.users.getCurrentUser, {})).toMatchObject({ _id: bId, name: "Beta" });
  vi.stubEnv("BETA_ALLOWED_SUBJECTS", "beta");
  for (const call of [
    () => renewed.query(api.users.getCurrentUser, {}),
    () => renewed.mutation(api.users.updateProfile, { name: "Denied" }),
    () => renewed.query(api.tasks.getAllUserTasks, {}),
    () => renewed.mutation(api.tasks.resetChallenge, {}),
  ])
    await expect(call()).rejects.toThrow(/BETA_RESTRICTED/);
  expect(await b.query(api.users.getCurrentUser, {})).toMatchObject({ name: "Beta" });
});

it.each(["local", "restricted", "test", "production"])(
  "BETA_MODE=%s cannot grant invitations",
  async (mode) => {
    vi.stubEnv("BETA_MODE", mode);
    vi.stubEnv("BETA_ALLOWED_SUBJECTS", "");
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("CONVEX_CLOUD_URL", "http://127.0.0.1:3210");
    const user = convexTest(schema, modules).withIdentity({ subject: "uninvited" });
    await expect(user.mutation(api.users.updateCurrentUser, {})).rejects.toThrow(/BETA_RESTRICTED/);
  },
);
