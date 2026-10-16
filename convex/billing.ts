import { query } from "./_generated/server";

export const status = query({
  args: {},
  handler: async () => ({
    testOnly:
      process.env.PAYMENTS_MODE === "test" &&
      /^(?:rk|sk)_test_/.test(process.env.STRIPE_SECRET_KEY ?? "") &&
      Boolean(process.env.STRIPE_PRO_PRICE_ID && process.env.APP_ORIGIN?.startsWith("https://")),
  }),
});
