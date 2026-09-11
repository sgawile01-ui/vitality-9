import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { fail } from "./lib/coach";
export const consume = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("coachLimits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (existing && now - existing.windowStart < 60000) {
      if (existing.count >= 6) fail("RATE_LIMITED");
      await ctx.db.patch(existing._id, { count: existing.count + 1 });
    } else if (existing) await ctx.db.patch(existing._id, { windowStart: now, count: 1 });
    else await ctx.db.insert("coachLimits", { userId, windowStart: now, count: 1 });
  },
});
