"use node";
import { requireBetaAccess } from "./lib/betaAccess";

import { v } from "convex/values";
import Stripe from "stripe";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { ConvexError } from "convex/values";
import { paymentConfig, paymentReturnUrl } from "./lib/paymentConfig";
import { createHash } from "node:crypto";

function getStripe() {
  return new Stripe(paymentConfig().key, { maxNetworkRetries: 2, timeout: 10000 });
}

export const createProCheckoutSession = action({
  args: {
    successUrl: v.string(),
    cancelUrl: v.string(),
    requestId: v.string(),
  },
  handler: async (ctx, args): Promise<{ url: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    requireBetaAccess(identity);
    if (!/^[A-Za-z0-9_-]{8,128}$/.test(args.requestId))
      throw new ConvexError({ code: "INVALID_INPUT", message: "Invalid checkout request." });

    const user = await ctx.runQuery(internal.paymentsDb.getUserForPayment, {
      tokenIdentifier: identity.tokenIdentifier,
    });

    if (!user) throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });
    if (user.isPro) throw new ConvexError({ message: "Already a Pro member", code: "CONFLICT" });

    const stripe = getStripe();
    const { origin } = paymentConfig();
    const successUrl = paymentReturnUrl(args.successUrl, origin);
    const cancelUrl = paymentReturnUrl(args.cancelUrl, origin);
    const price = process.env.STRIPE_PRO_PRICE_ID;
    if (!price)
      throw new ConvexError({
        code: "NOT_CONFIGURED",
        message: "Sandbox price is not configured.",
      });
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create(
        {
          email: user.email ?? undefined,
          name: user.name ?? undefined,
          metadata: { convexUserId: user._id },
        },
        { idempotencyKey: `vitality9-customer-${user._id}` },
      );
      customerId = customer.id;
      await ctx.runMutation(internal.paymentsDb.saveStripeCustomer, {
        tokenIdentifier: identity.tokenIdentifier,
        stripeCustomerId: customer.id,
      });
    }

    const parameters: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      integration_identifier: "vitality9_betatests",
      subscription_data: { metadata: { convexUserId: user._id, application: "vitality9" } },
    };
    // Same logical attempt + identical parameters => same key, even across
    // clock boundaries. Different routes, prices or customers cannot collide.
    const fingerprint = createHash("sha256")
      .update(JSON.stringify({ userId: user._id, requestId: args.requestId, parameters }))
      .digest("hex");
    const session = await stripe.checkout.sessions.create(parameters, {
      idempotencyKey: `vitality9-checkout-${fingerprint}`,
    });

    return { url: session.url! };
  },
});

export const createBillingPortalSession = action({
  args: { returnUrl: v.string() },
  handler: async (ctx, args): Promise<{ url: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    requireBetaAccess(identity);

    const user = await ctx.runQuery(internal.paymentsDb.getUserForPayment, {
      tokenIdentifier: identity.tokenIdentifier,
    });

    if (!user?.stripeCustomerId)
      throw new ConvexError({ message: "No billing account found", code: "NOT_FOUND" });

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: paymentReturnUrl(args.returnUrl, paymentConfig().origin),
    });

    return { url: session.url };
  },
});
