import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/stripe-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.text();
    const sig = request.headers.get("stripe-signature") ?? "";

    try {
      await ctx.runAction(internal.stripeWebhook.handleStripeEvent, { body, sig });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Webhook error";
      return new Response(message, { status: 400 });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
