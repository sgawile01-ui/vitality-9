import { query, internalQuery } from "./_generated/server";
import { hasBetaAccess } from "./lib/betaAccess";

// Returns only the OIDC subject of the signed-in user so the Founder can
// configure BETA_ALLOWED_SUBJECTS without exposing tokens or other credentials.
// Remove this query once the allowlist is configured.
export const whoami = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return { subject: identity.subject };
  },
});

export const access = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return {
      restricted: true,
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
    restrictedBeta: true,
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
