// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import Stripe from "stripe";
import { convexTest } from "convex-test";
import schema from "../convex/schema";
import { api, internal } from "../convex/_generated/api";
import { paymentConfig, paymentReturnUrl } from "../convex/lib/paymentConfig";
const mocks = vi.hoisted(() => ({ retrieve: vi.fn(), checkout: vi.fn(), customer: vi.fn() }));
vi.mock("stripe", async (original) => {
  const actual = await original<typeof import("stripe")>();
  return {
    default: class extends actual.default {
      constructor(...args: ConstructorParameters<typeof actual.default>) {
        super(...args);
        this.subscriptions.retrieve = mocks.retrieve;
        this.checkout.sessions.create = mocks.checkout;
        this.customers.create = mocks.customer;
      }
    },
  };
});
const modules = import.meta.glob("../convex/**/*.ts");
const secret = "synthetic-signing-secret-for-local-verification";
const key = "sk_test_" + "synthetic";
beforeEach(() => {
  vi.stubEnv("PAYMENTS_MODE", "test");
  vi.stubEnv("STRIPE_SECRET_KEY", key);
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", secret);
  vi.stubEnv("STRIPE_PRO_PRICE_ID", "price_synthetic");
  vi.stubEnv("APP_ORIGIN", "https://beta.example.invalid");
  mocks.retrieve.mockResolvedValue({
    id: "sub_synthetic",
    customer: "cus_synthetic",
    livemode: false,
    status: "active",
    metadata: { application: "vitality9" },
    items: { data: [{ price: { id: "price_synthetic" } }] },
  });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
async function setup() {
  const t = convexTest(schema, modules);
  const user = t.withIdentity({
    subject: "synthetic-billing",
    tokenIdentifier: "synthetic|billing",
  });
  await user.mutation(api.users.updateCurrentUser, {});
  await t.mutation(internal.paymentsDb.saveStripeCustomer, {
    tokenIdentifier: "synthetic|billing",
    stripeCustomerId: "cus_synthetic",
  });
  return { t, user };
}
function signed(overrides: Record<string, unknown> = {}, timestamp?: number) {
  const body = JSON.stringify({
    id: "evt_synthetic",
    created: 100,
    type: "customer.subscription.updated",
    livemode: false,
    data: { object: { id: "sub_synthetic" } },
    ...overrides,
  });
  const sig = Stripe.webhooks.generateTestHeaderString({ payload: body, secret, timestamp });
  return { body, sig };
}
it("valid signed event grants Pro once; duplicate delivery is idempotent", async () => {
  const { t, user } = await setup();
  await t.action(internal.stripeWebhook.handleStripeEvent, signed());
  await t.action(internal.stripeWebhook.handleStripeEvent, signed());
  expect((await user.query(api.users.getCurrentUser, {}))?.isPro).toBe(true);
  expect(await t.run(async (ctx) => (await ctx.db.query("stripeEvents").collect()).length)).toBe(1);
});
it.each(["tampered", "missing", "expired"])(
  "rejects %s webhook signature before Stripe or database writes",
  async (mode) => {
    const { t, user } = await setup();
    const args = signed({}, mode === "expired" ? Math.floor(Date.now() / 1000) - 600 : undefined);
    if (mode === "tampered") args.body += " ";
    if (mode === "missing") args.sig = "";
    await expect(t.action(internal.stripeWebhook.handleStripeEvent, args)).rejects.toThrow(
      /verification/,
    );
    expect(mocks.retrieve).not.toHaveBeenCalled();
    expect((await user.query(api.users.getCurrentUser, {}))?.isPro).toBe(false);
  },
);
it("rejects signed live events", async () => {
  const { t } = await setup();
  await expect(
    t.action(internal.stripeWebhook.handleStripeEvent, signed({ livemode: true })),
  ).rejects.toThrow(/Live/);
  expect(mocks.retrieve).not.toHaveBeenCalled();
});
it("revokes access for past-due state and ignores stale event timestamps", async () => {
  const { t, user } = await setup();
  await t.action(internal.stripeWebhook.handleStripeEvent, signed());
  mocks.retrieve.mockResolvedValueOnce({ ...(await mocks.retrieve()), status: "past_due" });
  await t.action(internal.stripeWebhook.handleStripeEvent, signed({ id: "evt_new", created: 102 }));
  expect((await user.query(api.users.getCurrentUser, {}))?.isPro).toBe(false);
  await t.action(internal.stripeWebhook.handleStripeEvent, signed({ id: "evt_old", created: 101 }));
  expect((await user.query(api.users.getCurrentUser, {}))?.isPro).toBe(false);
});
it("current invoice parent subscription reference reconciles through Stripe", async () => {
  const { t, user } = await setup();
  await t.action(
    internal.stripeWebhook.handleStripeEvent,
    signed({
      type: "invoice.paid",
      data: { object: { parent: { subscription_details: { subscription: "sub_synthetic" } } } },
    }),
  );
  expect(mocks.retrieve).toHaveBeenCalledWith("sub_synthetic");
  expect((await user.query(api.users.getCurrentUser, {}))?.isPro).toBe(true);
});
it("wrong product cannot grant Pro", async () => {
  const { t, user } = await setup();
  mocks.retrieve.mockResolvedValueOnce({
    ...(await mocks.retrieve()),
    metadata: { application: "another-app" },
  });
  await t.action(internal.stripeWebhook.handleStripeEvent, signed());
  expect((await user.query(api.users.getCurrentUser, {}))?.isPro).toBe(false);
});
it("live key and disabled mode fail closed", () => {
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_" + "synthetic");
  expect(paymentConfig).toThrow(/PAYMENTS_DISABLED/);
  vi.stubEnv("STRIPE_SECRET_KEY", key);
  vi.stubEnv("PAYMENTS_MODE", "live");
  expect(paymentConfig).toThrow(/PAYMENTS_DISABLED/);
});
it("return URLs reject other origins and embedded credentials", () => {
  for (const url of [
    "https://attacker.invalid",
    "https://person@beta.example.invalid/",
    "javascript:alert(1)",
  ])
    expect(() => paymentReturnUrl(url, "https://beta.example.invalid")).toThrow(/INVALID_INPUT/);
  expect(
    paymentReturnUrl("https://beta.example.invalid/profile", "https://beta.example.invalid"),
  ).toBe("https://beta.example.invalid/profile");
});
it("checkout uses server price and idempotency, and never trusts the return URL for entitlement", async () => {
  const { user } = await setup();
  mocks.checkout.mockResolvedValue({ url: "https://checkout.stripe.com/c/pay/synthetic" });
  await user.action(api.payments.createProCheckoutSession, {
    requestId: "synthetic-request",
    successUrl: "https://beta.example.invalid/profile",
    cancelUrl: "https://beta.example.invalid/",
  });
  expect(mocks.checkout.mock.calls[0][0].line_items).toEqual([
    { price: "price_synthetic", quantity: 1 },
  ]);
  expect(mocks.checkout.mock.calls[0][1].idempotencyKey).toMatch(/^vitality9-checkout/);
  expect((await user.query(api.users.getCurrentUser, {}))?.isPro).toBe(false);
});

it("invalid origin configuration does not expose its value", () => {
  vi.stubEnv("APP_ORIGIN", "invented-confidential-invalid-origin");
  expect(paymentConfig).toThrow(/NOT_CONFIGURED/);
  try {
    paymentConfig();
  } catch (error) {
    expect(String(error)).not.toContain("invented-confidential-invalid-origin");
  }
});

it("same logical checkout retries keep identical parameters and keys across time boundaries", async () => {
  const { user } = await setup();
  mocks.checkout.mockResolvedValue({ url: "https://checkout.stripe.com/synthetic" });
  const args = {
    requestId: "retry-request-001",
    successUrl: "https://beta.example.invalid/?pro=success",
    cancelUrl: "https://beta.example.invalid/",
  };
  const clock = vi.spyOn(Date, "now");
  try {
    clock.mockReturnValue(1799999);
    await user.action(api.payments.createProCheckoutSession, args);
    clock.mockReturnValue(3600001);
    await user.action(api.payments.createProCheckoutSession, args);
    expect(mocks.checkout.mock.calls[1]).toEqual(mocks.checkout.mock.calls[0]);
  } finally {
    clock.mockRestore();
  }
});
it("Home and Profile cannot collide even if they reuse a request ID", async () => {
  const { user } = await setup();
  mocks.checkout.mockResolvedValue({ url: "https://checkout.stripe.com/synthetic" });
  const args = {
    requestId: "shared-request-001",
    successUrl: "https://beta.example.invalid/?pro=success",
    cancelUrl: "https://beta.example.invalid/",
  };
  await user.action(api.payments.createProCheckoutSession, args);
  await user.action(api.payments.createProCheckoutSession, {
    ...args,
    cancelUrl: "https://beta.example.invalid/profile",
  });
  expect(mocks.checkout.mock.calls[0][0]).not.toEqual(mocks.checkout.mock.calls[1][0]);
  expect(mocks.checkout.mock.calls[0][1].idempotencyKey).not.toBe(
    mocks.checkout.mock.calls[1][1].idempotencyKey,
  );
});
it("new logical attempts and price changes get different keys", async () => {
  const { user } = await setup();
  mocks.checkout.mockResolvedValue({ url: "https://checkout.stripe.com/synthetic" });
  const args = {
    requestId: "price-request-001",
    successUrl: "https://beta.example.invalid/?pro=success",
    cancelUrl: "https://beta.example.invalid/",
  };
  await user.action(api.payments.createProCheckoutSession, args);
  await user.action(api.payments.createProCheckoutSession, {
    ...args,
    requestId: "price-request-002",
  });
  vi.stubEnv("STRIPE_PRO_PRICE_ID", "price_synthetic_changed");
  await user.action(api.payments.createProCheckoutSession, args);
  expect(new Set(mocks.checkout.mock.calls.map((call) => call[1].idempotencyKey)).size).toBe(3);
});
it("invalid attempt IDs are rejected before contacting Stripe", async () => {
  const { user } = await setup();
  await expect(
    user.action(api.payments.createProCheckoutSession, {
      requestId: "",
      successUrl: "https://beta.example.invalid/",
      cancelUrl: "https://beta.example.invalid/",
    }),
  ).rejects.toThrow(/INVALID_INPUT/);
  expect(mocks.checkout).not.toHaveBeenCalled();
});
