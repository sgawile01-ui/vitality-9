import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";
export default defineConfig({
  envDir: false,
  resolve: {
    alias: [
      { find: "@/convex", replacement: fileURLToPath(new URL("./convex", import.meta.url)) },
      { find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
    ],
  },
  test: {
    env: { BETA_MODE: "local" },
    environment: "edge-runtime",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    server: { deps: { inline: ["convex-test"] } },
  },
});
