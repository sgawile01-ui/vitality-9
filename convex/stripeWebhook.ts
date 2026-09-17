"use node";
import Stripe from "stripe";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { paymentConfig } from "./lib/paymentConfig";

export const handleStripeEvent = internalAction({
  args: { body: v.string(), sig: v.string() },
  handler: async (ctx, args): Promise<null> => {
    const stripe = new Stripe(paymentConfig().key, { maxNetworkRetries: 2, timeout: 10000 });
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error("Webhook unavailable");
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(args.body, args.sig, secret);
    } catch {
      throw new Error("Webhook verification failed");
    }
    if (event.livemode) throw new Error("Live payments are disabled");
    let subscriptionId: string | undefined;
    if (
      [
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
      ].includes(event.type)
    ) {
      subscriptionId = (event.data.object as Stripe.Subscription).id;
    } else if (["invoice.paid", "invoice.payment_failed"].includes(event.type)) {
      const subscription = (event.data.object as Stripe.Invoice).parent?.subscription_details
        ?.subscription;
      subscriptionId = typeof subscription === "string" ? subscription : subscription?.id;
    } else return null;
    if (!subscriptionId) return null;
    // Retrieve current state: Stripe delivery order is not guaranteed.
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (subscription.livemode) throw new Error("Live payments are disabled");
    if (subscription.metadata.application !== "vitality9") return null;
    if (
      !process.env.STRIPE_PRO_PRICE_ID ||
      !subscription.items.data.some((item) => item.price.id === process.env.STRIPE_PRO_PRICE_ID)
    )
      return null;
    const customerId =
      typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
    await ctx.runMutation(internal.paymentsDb.applyStripeSubscription, {
      eventId: event.id,
      eventCreated: event.created,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      active: subscription.status === "active" || subscription.status === "trialing",
    });
    return null;
  },
});
