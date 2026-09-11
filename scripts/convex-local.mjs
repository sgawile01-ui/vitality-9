// Force an anonymous local backend. Never selects an existing cloud deployment.
import { spawn } from "node:child_process";
import process from "node:process";
import { mkdirSync, writeFileSync } from "node:fs";
const args = process.argv.slice(2);
if (args.some((arg) => !["--once", "--tail-logs", "disable"].includes(arg)))
  throw new Error("Only local run options --once and --tail-logs disable are supported.");
mkdirSync(".convex", { recursive: true });
// This file contains a public selector only; no existing environment file is read.
writeFileSync(".convex/local-selector.env", "CONVEX_DEPLOYMENT=anonymous:anonymous-agent\n");
const child = spawn(
  process.execPath,
  ["node_modules/convex/bin/main.js", "dev", "--env-file", ".convex/local-selector.env", ...args],
  { env: { ...process.env, CONVEX_AGENT_MODE: "anonymous" }, stdio: "inherit" },
);
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
