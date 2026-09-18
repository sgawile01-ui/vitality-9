import type { IncomingMessage } from "node:http";

export function assertLocalTestingRuntime(env: NodeJS.ProcessEnv = process.env) {
  if (
    !["development", "test"].includes(env.NODE_ENV ?? "") ||
    [
      "VERCEL",
      "VERCEL_ENV",
      "NETLIFY",
      "CF_PAGES",
      "RENDER",
      "FLY_APP_NAME",
      "RAILWAY_ENVIRONMENT",
    ].some((name) => Boolean(env[name])) ||
    (env.CONVEX_DEPLOYMENT && !/^(anonymous|local):/.test(env.CONVEX_DEPLOYMENT))
  )
    throw new Error("LOCAL_TESTING_ONLY");
}

export function isDirectLoopbackRequest(req: IncomingMessage) {
  return (
    ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress ?? "") &&
    !["forwarded", "x-forwarded-for", "x-forwarded-host", "x-forwarded-proto"].some(
      (name) => req.headers[name],
    )
  );
}
