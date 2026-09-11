import { defineConfig, mergeConfig } from "vite";
import base from "../../vite.config.ts";
import { fileURLToPath, URL } from "node:url";
export default mergeConfig(
  base,
  defineConfig({
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
