/**
 * Ephemeral setup page — shows the signed-in user's OIDC subject so the
 * Founder can populate BETA_ALLOWED_SUBJECTS in the Convex deployment.
 *
 * Security properties:
 * - Requires a valid Convex-authenticated session (useConvexAuth).
 * - Returns only the subject claim — no tokens, no credentials.
 * - The subject is a non-sensitive opaque identifier (public within the tenant).
 * - Remove this page and its route once BETA_ALLOWED_SUBJECTS is configured.
 */
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function IdentityView() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const result = useQuery(
    api.beta.whoami,
    isAuthenticated ? {} : "skip",
  );

  if (isLoading) {
    return (
      <main className="max-w-lg mx-auto p-6 space-y-3">
        <p role="status">Checking session…</p>
      </main>
    );
  }

  if (!isAuthenticated || result === null) {
    return (
      <main className="max-w-lg mx-auto p-6 space-y-3">
        <h1 className="text-xl font-semibold">Beta setup — identity view</h1>
        <p>
          You must sign in through the beta before your subject can be
          displayed. Return to{" "}
          <a href="/" className="underline">
            home
          </a>{" "}
          and sign in first.
        </p>
      </main>
    );
  }

  if (result === undefined) {
    return (
      <main className="max-w-lg mx-auto p-6 space-y-3">
        <p role="status">Loading identity…</p>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Beta setup — your OIDC subject</h1>
      <p className="text-sm text-muted-foreground">
        Copy the value below and provide it to the engineering assistant so it
        can be added to <code>BETA_ALLOWED_SUBJECTS</code> in the Convex
        deployment. Do not share it publicly. This page will be removed once
        the allowlist is configured.
      </p>
      <div
        className="font-mono text-sm break-all rounded border p-3 select-all"
        role="status"
        aria-label="Your OIDC subject identifier"
      >
        {result.subject}
      </div>
      <p className="text-xs text-muted-foreground">
        This is your OIDC <code>sub</code> claim — an opaque, non-sensitive
        identifier. No token or credential is shown here.
      </p>
    </main>
  );
}
