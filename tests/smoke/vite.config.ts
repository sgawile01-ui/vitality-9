import { defineConfig, mergeConfig } from "vite";
import base from "../../vite.config.ts";
import { fileURLToPath, URL } from "node:url";
import { assertLocalTestingRuntime } from "../../testing/isolation";
export default mergeConfig(
  base,
  defineConfig({
    plugins: [
      {
        name: "local-smoke-fixture-only",
        configResolved(config) {
          assertLocalTestingRuntime();
          if (
            config.command !== "serve" ||
            config.isProduction ||
            config.server.host !== "127.0.0.1"
          )
            throw new Error("LOCAL_TESTING_ONLY");
        },
      },
    ],
    resolve: {
      alias: [
        {
          find: "convex/react",
          replacement: fileURLToPath(new URL("./mock-convex.tsx", import.meta.url)),
        },
        {
          find: "@usehercules/auth/react",
          replacement: fileURLToPath(new URL("./mock-auth.ts", import.meta.url)),
        },
      ],
    },
  }),
);
