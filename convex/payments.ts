"use node";

import { v } from "convex/values";
import Stripe from "stripe";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { ConvexError } from "convex/values";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-06-24.dahlia",
  });
}

export const createProCheckoutSession = action({
  args: {
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (ctx, args): Promise<{ url: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });

    const user = await ctx.runQuery(internal.paymentsDb.getUserForPayment, {
      tokenIdentifier: identity.tokenIdentifier,
    });

    if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });
    if (user.isPro) throw new ConvexError({ message: "Already a Pro member", code: "CONFLICT" });

    const stripe = getStripe();
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: user.name ?? undefined,
        metadata: { convexUserId: user._id },
      });
      customerId = customer.id;
      await ctx.runMutation(internal.paymentsDb.saveStripeCustomer, {
        tokenIdentifier: identity.tokenIdentifier,
        stripeCustomerId: customer.id,
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: "Vitality 9 Pro",
            description: "Unlimited journeys + AI Health Coaching powered by Gemini",
          },
          unit_amount: 499,
          recurring: { interval: "month" },
        },
        quantity: 1,
      }],
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      allow_promotion_codes: true,
      subscription_data: { metadata: { convexUserId: user._id } },
    });

    return { url: session.url! };
  },
});

export const createBillingPortalSession = action({
  args: { returnUrl: v.string() },
  handler: async (ctx, args): Promise<{ url: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });

    const user = await ctx.runQuery(internal.paymentsDb.getUserForPayment, {
      tokenIdentifier: identity.tokenIdentifier,
    });

    if (!user?.stripeCustomerId) throw new ConvexError({ message: "No billing account found", code: "NOT_FOUND" });

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: args.returnUrl,
    });

    return { url: session.url };
  },
});
