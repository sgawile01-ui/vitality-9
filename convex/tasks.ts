import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { CHALLENGE_DAYS } from "./challengeData";

async function getAuthUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) return [];
    const saved = await ctx.db.query("dailyTasks").withIndex("by_user_and_day", (q) => q.eq("userId", user._id).eq("dayNumber", args.dayNumber)).collect();
    const dayTasks = CHALLENGE_DAYS[args.dayNumber - 1]?.tasks ?? [];
    return dayTasks.map((taskText, taskIndex) => {
      const found = saved.find((t) => t.taskIndex === taskIndex);
      return { _id: found?._id ?? null, taskText, taskIndex, dayNumber: args.dayNumber, isCompleted: found?.isCompleted ?? false, completedAt: found?.completedAt ?? null };
    });
  },
});

export const getAllUserTasks = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) return [];
    return await ctx.db.query("dailyTasks").withIndex("by_user", (q) => q.eq("userId", user._id)).collect();
  },
});

export const toggleTask = mutation({
  args: { dayNumber: v.number(), taskIndex: v.number(), isCompleted: v.boolean() },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    const dayTasks = CHALLENGE_DAYS[args.dayNumber - 1]?.tasks ?? [];
    const taskText = dayTasks[args.taskIndex] ?? "";
    const dayTasksInDb = await ctx.db.query("dailyTasks").withIndex("by_user_and_day", (q) => q.eq("userId", user._id).eq("dayNumber", args.dayNumber)).collect();
    const existing = dayTasksInDb.find((t) => t.taskIndex === args.taskIndex);
    if (existing) {
      await ctx.db.patch(existing._id, { isCompleted: args.isCompleted, completedAt: args.isCompleted ? new Date().toISOString() : undefined });
    } else {
      await ctx.db.insert("dailyTasks", { userId: user._id, dayNumber: args.dayNumber, taskIndex: args.taskIndex, taskText, isCompleted: args.isCompleted, completedAt: args.isCompleted ? new Date().toISOString() : undefined });
    }
    const updatedTasks = await ctx.db.query("dailyTasks").withIndex("by_user_and_day", (q) => q.eq("userId", user._id).eq("dayNumber", args.dayNumber)).collect();
    const totalTasksForDay = CHALLENGE_DAYS[args.dayNumber - 1]?.tasks.length ?? 3;
    const completedCount = updatedTasks.filter((t) => { if (t.taskIndex === args.taskIndex) return args.isCompleted; return t.isCompleted; }).length;
    if (completedCount >= totalTasksForDay && user.currentChallengeDay === args.dayNumber && args.dayNumber < 9) {
      await ctx.db.patch(user._id, { currentChallengeDay: args.dayNumber + 1, streakCount: user.streakCount + 1 });
    }
    return null;
  },
});

export const resetChallenge = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    const tasks = await ctx.db.query("dailyTasks").withIndex("by_user", (q) => q.eq("userId", user._id)).collect();
    for (const task of tasks) await ctx.db.delete(task._id);
    await ctx.db.patch(user._id, { currentChallengeDay: 1, challengeStartedAt: new Date().toISOString() });
    return null;
  },
});
