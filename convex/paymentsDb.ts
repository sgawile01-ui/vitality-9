// V8 runtime — queries and mutations only (no "use node")
import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const applyStripeSubscription = internalMutation({
  args: {
    eventId: v.string(),
    eventCreated: v.number(),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (
      await ctx.db
        .query("stripeEvents")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
        .unique()
    )
      return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_stripe_customer", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
      .unique();
    if (!user) throw new Error("Subscription customer not synchronized");
    if (
      (user.stripeEventCreated ?? 0) <= args.eventCreated &&
      (!user.stripeSubscriptionId ||
        user.stripeSubscriptionId === args.stripeSubscriptionId ||
        args.active)
    ) {
      await ctx.db.patch(user._id, {
        isPro: args.active,
        stripeSubscriptionId: args.stripeSubscriptionId,
        stripeEventCreated: args.eventCreated,
      });
    }
    await ctx.db.insert("stripeEvents", { eventId: args.eventId, processedAt: Date.now() });
    return null;
  },
});

export const getUserForPayment = internalQuery({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .unique();
  },
});

export const saveStripeCustomer = internalMutation({
  args: { tokenIdentifier: v.string(), stripeCustomerId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .unique();
    if (user) await ctx.db.patch(user._id, { stripeCustomerId: args.stripeCustomerId });
  },
});

export const activatePro = internalMutation({
  args: { stripeCustomerId: v.string(), stripeSubscriptionId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_stripe_customer", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
      .unique();
    if (user)
      await ctx.db.patch(user._id, {
        isPro: true,
        stripeSubscriptionId: args.stripeSubscriptionId,
      });
  },
});

export const deactivatePro = internalMutation({
  args: { stripeSubscriptionId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_stripe_subscription", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId),
      )
      .unique();
    if (user) await ctx.db.patch(user._id, { isPro: false, stripeSubscriptionId: undefined });
  },
});
