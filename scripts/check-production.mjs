// Reads process configuration only. Never loads environment files or prints values.
import process from "node:process";
import console from "node:console";
import { URL } from "node:url";
const names = ["VITE_CONVEX_URL", "VITE_HERCULES_OIDC_AUTHORITY", "VITE_HERCULES_OIDC_CLIENT_ID"];
const invalid = names.filter((name) => {
  const value = process.env[name];
  if (!value || /synthetic|placeholder|example\.invalid/i.test(value)) return true;
  if (name.endsWith("CLIENT_ID")) return !value.trim();
  try {
    const url = new URL(value);
    return (
      url.protocol !== "https:" ||
      Boolean(url.username || url.password) ||
      /localhost|127\.0\.0\.1|\.invalid$/.test(url.hostname)
    );
  } catch {
    return true;
  }
});
if (invalid.length) {
  console.error(`Production build blocked: missing or invalid ${invalid.join(", ")}`);
  process.exitCode = 1;
} else console.log("Production frontend configuration checks passed (values withheld).");
