import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/smoke",
  timeout: 90000,
  use: {
    baseURL: "http://127.0.0.1:5173",
    browserName: "chromium",
    channel: process.env.PLAYWRIGHT_CHANNEL,
  },
  webServer: [
    {
      command: "npm run dev -- --port 5173 --strictPort",
      url: "http://127.0.0.1:5173",
      reuseExistingServer: false,
    },
    {
      command:
        "npx vite --config tests/smoke/vite.config.ts --host 127.0.0.1 --port 5174 --strictPort",
      url: "http://127.0.0.1:5174/tests/smoke/fixture.html",
      reuseExistingServer: false,
    },
  ],
  reporter: "list",
});
