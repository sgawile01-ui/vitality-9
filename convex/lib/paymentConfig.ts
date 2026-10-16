import { ConvexError } from "convex/values";

export function paymentConfig() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (process.env.PAYMENTS_MODE !== "test" || !key || !/^(?:rk|sk)_test_/.test(key))
    throw new ConvexError({
      code: "PAYMENTS_DISABLED",
      message: "Payments are disabled. Only sandbox payments are supported.",
    });
  const origin = process.env.APP_ORIGIN;
  let validOrigin = false;
  try {
    validOrigin = Boolean(
      origin && new URL(origin).origin === origin && origin.startsWith("https://"),
    );
  } catch {
    /* Configuration errors must not expose their input. */
  }
  if (!origin || !validOrigin)
    throw new ConvexError({
      code: "NOT_CONFIGURED",
      message: "Sandbox billing is not configured.",
    });
  return { key, origin };
}

export function paymentReturnUrl(value: string, origin: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ConvexError({ code: "INVALID_INPUT", message: "Invalid return address." });
  }
  if (url.origin !== origin || url.username || url.password)
    throw new ConvexError({ code: "INVALID_INPUT", message: "Invalid return address." });
  return url.href;
}
