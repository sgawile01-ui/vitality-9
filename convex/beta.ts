import { query, internalQuery } from "./_generated/server";
import { hasBetaAccess, localBetaBypassAllowed } from "./lib/betaAccess";

export const access = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return {
      restricted: !localBetaBypassAllowed(),
      allowed: identity ? hasBetaAccess(identity) : false,
    };
  },
});

// Admin-only status; never returns configuration values or credentials.
export const readiness = internalQuery({
  args: {},
  handler: async () => ({
    authentication: Boolean(
      process.env.HERCULES_OIDC_AUTHORITY && process.env.HERCULES_OIDC_CLIENT_ID,
    ),
    restrictedBeta: !localBetaBypassAllowed(),
    invitedTesters: Boolean(process.env.BETA_ALLOWED_SUBJECTS?.trim()),
    ai: Boolean(process.env.GOOGLE_API_KEY),
    sandboxPayments:
      process.env.PAYMENTS_MODE === "test" &&
      /^(?:rk|sk)_test_/.test(process.env.STRIPE_SECRET_KEY ?? ""),
    webhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    price: Boolean(process.env.STRIPE_PRO_PRICE_ID),
    appOrigin: Boolean(process.env.APP_ORIGIN?.startsWith("https://")),
    livePayments: false,
  }),
});
