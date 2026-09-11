"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { coach, fail, validateInput } from "./lib/coach";
import { geminiProvider } from "./lib/gemini";
export const chat = action({
  args: {
    message: v.string(),
    history: v.array(
      v.object({ role: v.union(v.literal("user"), v.literal("model")), text: v.string() }),
    ),
  },
  handler: async (ctx, args): Promise<{ reply: string; responseClass: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) fail("UNAUTHENTICATED");
    const user = await ctx.runQuery(internal.paymentsDb.getUserForPayment, {
      tokenIdentifier: identity.tokenIdentifier,
    });
    if (!user?.isPro) fail("FORBIDDEN");
    const input = validateInput(args);
    await ctx.runMutation(internal.coachLimits.consume, { userId: user._id });
    return coach(input, geminiProvider());
  },
});
