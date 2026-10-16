// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it.each([
  [undefined, undefined],
  ["https://synthetic.invalid", undefined],
  [undefined, "synthetic-client"],
])("incomplete OIDC configuration accepts no provider", async (issuer, clientId) => {
  vi.stubEnv("HERCULES_OIDC_AUTHORITY", issuer);
  vi.stubEnv("HERCULES_OIDC_CLIENT_ID", clientId);
  vi.resetModules();
  expect((await import("../convex/auth.config")).default.providers).toEqual([]);
});
it("configures both issuer and audience for Convex verification, with no custom-token fallback", async () => {
  vi.stubEnv("HERCULES_OIDC_AUTHORITY", "https://synthetic.invalid");
  vi.stubEnv("HERCULES_OIDC_CLIENT_ID", "synthetic-client");
  vi.resetModules();
  expect((await import("../convex/auth.config")).default.providers).toEqual([
    { domain: "https://synthetic.invalid", applicationID: "synthetic-client" },
  ]);
});
