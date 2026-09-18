import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { assertLocalTestingRuntime } from "./isolation";
const execute = promisify(execFile);
const identity = {
  subject: "founder-testing",
  issuer: "https://synthetic.invalid",
  tokenIdentifier: "vitality9|founder-testing",
  name: "Synthetic Tester",
  email: "synthetic-testing@example.invalid",
};
export const allowed = new Set([
  "billing:status",
  "users:getCurrentUser",
  "users:updateProfile",
  "tasks:getTasksForDay",
  "tasks:getAllUserTasks",
  "tasks:toggleTask",
  "tasks:resetChallenge",
  "aiCoach:chat",
]);
let queue: Promise<unknown> = Promise.resolve();
export function callLocal(name: string, args: unknown = {}, asUser = true): Promise<unknown> {
  const run = async () => {
    assertLocalTestingRuntime();
    // Reject a replaced selector before invoking any administrative CLI command.
    if (
      (await readFile(".convex/local-selector.env", "utf8")).trim() !==
      "CONVEX_DEPLOYMENT=anonymous:anonymous-agent"
    )
      throw new Error("LOCAL_TESTING_ONLY");
    const command = [
      "node_modules/convex/bin/main.js",
      "run",
      name,
      JSON.stringify(args),
      "--env-file",
      ".convex/local-selector.env",
    ];
    if (asUser) command.push("--identity", JSON.stringify(identity));
    try {
      const { stdout } = await execute(process.execPath, command, {
        timeout: 45000,
        windowsHide: true,
        maxBuffer: 100000,
      });
      return stdout.trim() ? JSON.parse(stdout) : null;
    } catch (error) {
      const output =
        typeof error === "object" && error && "stderr" in error ? String(error.stderr) : "";
      const codes = [
        "UNAUTHENTICATED",
        "FORBIDDEN",
        "INVALID_INPUT",
        "RATE_LIMITED",
        "NOT_CONFIGURED",
        "PROVIDER_TIMEOUT",
        "PROVIDER_UNAVAILABLE",
        "PROVIDER_BLOCKED",
        "PROVIDER_INVALID",
      ];
      const code = codes.find((c) => output.includes(c)) ?? "LOCAL_BACKEND_UNAVAILABLE";
      // eslint-disable-next-line preserve-caught-error -- Never attach raw CLI output or provider details to client-facing errors.
      throw new Error(code);
    }
  };
  const result = queue.then(run, run);
  queue = result.catch(() => {});
  return result;
}
export async function prepare() {
  assertLocalTestingRuntime();
  await mkdir(".convex", { recursive: true });
  await writeFile(".convex/local-selector.env", "CONVEX_DEPLOYMENT=anonymous:anonymous-agent\n");
  try {
    await execute(
      process.execPath,
      [
        "node_modules/convex/bin/main.js",
        "env",
        "set",
        "BETA_ALLOWED_SUBJECTS",
        "founder-testing,synthetic-local-check",
        "--env-file",
        ".convex/local-selector.env",
      ],
      { windowsHide: true, timeout: 45000 },
    );
  } catch {
    throw new Error("LOCAL_BACKEND_UNAVAILABLE");
  }
  await callLocal("users:updateCurrentUser");
  await callLocal(
    "paymentsDb:saveStripeCustomer",
    { tokenIdentifier: identity.tokenIdentifier, stripeCustomerId: "synthetic-founder-testing" },
    false,
  );
  await callLocal(
    "paymentsDb:activatePro",
    {
      stripeCustomerId: "synthetic-founder-testing",
      stripeSubscriptionId: "synthetic-founder-testing",
    },
    false,
  );
}
