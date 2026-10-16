// Heuristic workspace scan. Never reads environment files or prints matching values.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import process from "node:process";
import console from "node:console";
const paths = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter(Boolean);
const patterns = [
  new RegExp("AI" + "za[0-9A-Za-z_-]{30,}"),
  new RegExp("s" + "k_(live|test)_[0-9A-Za-z]{16,}"),
  new RegExp("gh" + "[pousr]_[0-9A-Za-z]{30,}"),
  new RegExp("-----BEGIN " + "(?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
];
let scanned = 0;
const findings = [];
for (const path of paths) {
  if (path.split("/").some((part) => part.startsWith(".env") && part !== ".env.example")) continue;
  const data = readFileSync(path, "utf8");
  scanned++;
  if (patterns.some((pattern) => pattern.test(data))) findings.push(path);
}
console.log(JSON.stringify({ scanned, findings: findings.length, files: findings }));
if (findings.length) process.exitCode = 1;
