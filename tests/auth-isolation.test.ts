// @vitest-environment node
import { expect, it } from "vitest";
import type { IncomingMessage } from "node:http";
import { assertLocalTestingRuntime, isDirectLoopbackRequest } from "../testing/isolation";

it.each([
  {},
  { NODE_ENV: "production" },
  { NODE_ENV: "development", VERCEL_ENV: "preview" },
  { NODE_ENV: "test", NETLIFY: "true" },
  { NODE_ENV: "development", CONVEX_DEPLOYMENT: "dev:remote" },
  { NODE_ENV: "test", CONVEX_DEPLOYMENT: "prod:remote" },
])("synthetic administrative adapter rejects nonlocal runtime %j", (env) => {
  expect(() => assertLocalTestingRuntime(env)).toThrow("LOCAL_TESTING_ONLY");
});
it("permits explicit development against an anonymous local selector", () => {
  expect(() =>
    assertLocalTestingRuntime({
      NODE_ENV: "development",
      CONVEX_DEPLOYMENT: "anonymous:anonymous-agent",
    }),
  ).not.toThrow();
});
it.each([
  ["127.0.0.1", {}, true],
  ["::ffff:127.0.0.1", {}, true],
  ["192.0.2.1", {}, false],
  ["127.0.0.1", { "x-forwarded-for": "192.0.2.1" }, false],
  ["127.0.0.1", { forwarded: "for=192.0.2.1" }, false],
])("testing requests must be direct loopback (%s, %j)", (remoteAddress, headers, expected) => {
  expect(isDirectLoopbackRequest({ socket: { remoteAddress }, headers } as IncomingMessage)).toBe(
    expected,
  );
});
