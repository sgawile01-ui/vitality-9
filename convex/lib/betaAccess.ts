import { ConvexError } from "convex/values";
import type { UserIdentity } from "convex/server";

export function localBetaBypassAllowed() {
  if (process.env.BETA_MODE !== "local") return false;
  // Production signals always win, including conflicting local selectors.
  if (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.CONVEX_DEPLOYMENT_TYPE === "production" ||
    /^(prod|production)(:|$)/i.test(process.env.CONVEX_DEPLOYMENT ?? "")
  )
    return false;
  const cloudUrl = process.env.CONVEX_CLOUD_URL;
  if (cloudUrl) {
    try {
      const url = new URL(cloudUrl);
      return (
        url.protocol === "http:" &&
        ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) &&
        !url.username &&
        !url.password
      );
    } catch {
      return false;
    }
  }
  // Unknown environments fail closed. Tests and explicit local selectors are
  // allowed only when no production signal or remote cloud URL is present.
  return (
    process.env.NODE_ENV === "test" ||
    /^(anonymous|local):/.test(process.env.CONVEX_DEPLOYMENT ?? "")
  );
}

export function hasBetaAccess(identity: UserIdentity) {
  if (localBetaBypassAllowed()) return true;
  const allowed = (process.env.BETA_ALLOWED_SUBJECTS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return allowed.includes(identity.subject);
}
export function requireBetaAccess(identity: UserIdentity) {
  if (!hasBetaAccess(identity))
    throw new ConvexError({
      code: "BETA_RESTRICTED",
      message: "This beta is invitation-only. Please contact the organizer for access.",
    });
}
