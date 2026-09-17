import { spawn } from "node:child_process";
import { mkdirSync, openSync } from "node:fs";
import process from "node:process";
import console from "node:console";
import { setTimeout as delay } from "node:timers/promises";
const health = "http://127.0.0.1:5175/_testing/health";
async function status() {
  try {
    return await (
      await globalThis.fetch(health, { signal: globalThis.AbortSignal.timeout(15000) })
    ).json();
  } catch {
    return null;
  }
}
let current = await status();
if (!current) {
  mkdirSync(".convex", { recursive: true });
  const log = openSync(".convex/testing-server.log", "a");
  const child = spawn(
    process.execPath,
    ["node_modules/vite/bin/vite.js", "--config", "testing/vite.config.ts"],
    {
      cwd: process.cwd(),
      detached: true,
      windowsHide: true,
      stdio: ["ignore", log, log],
      env: { ...process.env, NODE_USE_SYSTEM_CA: "1" },
    },
  );
  child.unref();
}
for (let attempt = 0; attempt < 90; attempt++) {
  current = await status();
  if (current?.application === "vitality9-synthetic" && current.ready) {
    console.log("Vitality 9 testing is ready: http://127.0.0.1:5175/testing/index.html");
    process.exit(0);
  }
  if (current && current.application !== "vitality9-synthetic")
    throw new Error("Port 5175 is already in use by another app.");
  await delay(1000);
}
throw new Error(
  "Testing setup did not become ready. Run npm run convex:dev to check the local backend.",
);
