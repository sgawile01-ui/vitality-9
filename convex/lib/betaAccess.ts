import { ConvexError } from "convex/values";
import type { UserIdentity } from "convex/server";

export function hasBetaAccess(identity: UserIdentity) {
  // Every runtime, including local tests, requires an explicit invitation.
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
