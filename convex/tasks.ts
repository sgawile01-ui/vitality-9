import { requireBetaAccess } from "./lib/betaAccess";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { CHALLENGE_DAYS } from "./challengeData";
function validateDay(day: number) {
  if (!Number.isInteger(day) || day < 1 || day > 9)
    throw new ConvexError({ code: "INVALID_INPUT", message: "Choose a valid challenge day." });
}

async function getAuthUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
  requireBetaAccess(identity);
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });
  return user;
}

export const getTasksForDay = query({
  args: { dayNumber: v.number() },
  handler: async (ctx, args) => {
    validateDay(args.dayNumber);
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    requireBetaAccess(identity);
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return [];
    const saved = await ctx.db
      .query("dailyTasks")
      .withIndex("by_user_and_day", (q) => q.eq("userId", user._id).eq("dayNumber", args.dayNumber))
      .collect();
    const dayTasks = CHALLENGE_DAYS[args.dayNumber - 1]?.tasks ?? [];
    return dayTasks.map((taskText, taskIndex) => {
      const found = saved.find((t) => t.taskIndex === taskIndex);
      return {
        _id: found?._id ?? null,
        taskText,
        taskIndex,
        dayNumber: args.dayNumber,
        isCompleted: found?.isCompleted ?? false,
        completedAt: found?.completedAt ?? null,
      };
    });
  },
});

export const getAllUserTasks = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    requireBetaAccess(identity);
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return [];
    return await ctx.db
      .query("dailyTasks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const toggleTask = mutation({
  args: { dayNumber: v.number(), taskIndex: v.number(), isCompleted: v.boolean() },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    validateDay(args.dayNumber);
    if (!Number.isInteger(args.taskIndex) || args.taskIndex < 0 || args.taskIndex >= 9)
      throw new ConvexError({ code: "INVALID_INPUT", message: "Choose a valid activity." });
    if (args.dayNumber > user.currentChallengeDay)
      throw new ConvexError({ code: "FORBIDDEN", message: "Complete the current day first." });
    const dayTasks = CHALLENGE_DAYS[args.dayNumber - 1]?.tasks ?? [];
    const taskText = dayTasks[args.taskIndex] ?? "";
    const dayTasksInDb = await ctx.db
      .query("dailyTasks")
      .withIndex("by_user_and_day", (q) => q.eq("userId", user._id).eq("dayNumber", args.dayNumber))
      .collect();
    const existing = dayTasksInDb.find((t) => t.taskIndex === args.taskIndex);
    if (existing) {
      await ctx.db.patch(existing._id, {
        isCompleted: args.isCompleted,
        completedAt: args.isCompleted ? new Date().toISOString() : undefined,
      });
    } else {
      await ctx.db.insert("dailyTasks", {
        userId: user._id,
        dayNumber: args.dayNumber,
        taskIndex: args.taskIndex,
        taskText,
        isCompleted: args.isCompleted,
        completedAt: args.isCompleted ? new Date().toISOString() : undefined,
      });
    }
    const allTasks = await ctx.db
      .query("dailyTasks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const completedDays = CHALLENGE_DAYS.filter(
      (day) =>
        new Set(
          allTasks.filter((t) => t.dayNumber === day.day && t.isCompleted).map((t) => t.taskIndex),
        ).size === day.tasks.length,
    );
    const firstIncomplete = CHALLENGE_DAYS.find(
      (day) => !completedDays.some((done) => done.day === day.day),
    );
    await ctx.db.patch(user._id, {
      currentChallengeDay: firstIncomplete?.day ?? 9,
      streakCount: completedDays.length,
    });
    return null;
  },
});

export const resetChallenge = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    const tasks = await ctx.db
      .query("dailyTasks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const task of tasks) await ctx.db.delete(task._id);
    if (!user.isPro)
      throw new ConvexError({ code: "FORBIDDEN", message: "Journey resets require Pro access." });
    await ctx.db.patch(user._id, {
      currentChallengeDay: 1,
      streakCount: 0,
      challengeStartedAt: new Date().toISOString(),
    });
    return null;
  },
});
