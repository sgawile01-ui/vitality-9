import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    streakCount: v.number(),
    isPro: v.boolean(),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    currentChallengeDay: v.number(),
    challengeStartedAt: v.optional(v.string()),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_stripe_customer", ["stripeCustomerId"])
    .index("by_stripe_subscription", ["stripeSubscriptionId"]),

  dailyTasks: defineTable({
    userId: v.id("users"),
    dayNumber: v.number(),
    taskIndex: v.number(),
    taskText: v.string(),
    isCompleted: v.boolean(),
    completedAt: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_day", ["userId", "dayNumber"]),
});
