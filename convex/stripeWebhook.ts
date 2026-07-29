"use node";

import Stripe from "stripe";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-06-24.dahlia",
  });
}

export const handleStripeEvent = internalAction({
  args: { body: v.string(), sig: v.string() },
  handler: async (ctx, args): Promise<null> => {
    const stripe = getStripe();
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(args.body, args.sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      throw new Error(`Webhook verification failed: ${message}`);
    }

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        if (sub.status === "active") {
          await ctx.runMutation(internal.paymentsDb.activatePro, {
            stripeCustomerId: sub.customer as string,
            stripeSubscriptionId: sub.id,
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await ctx.runMutation(internal.paymentsDb.deactivatePro, { stripeSubscriptionId: sub.id });
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string };
        if (invoice.subscription) {
          await ctx.runMutation(internal.paymentsDb.deactivatePro, { stripeSubscriptionId: invoice.subscription });
        }
        break;
      }
    }
    return null;
  },
});
