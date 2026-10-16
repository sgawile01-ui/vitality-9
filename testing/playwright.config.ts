import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./checks",
  timeout: 180000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:5175",
    browserName: "chromium",
    channel: process.env.PLAYWRIGHT_CHANNEL,
  },
  reporter: "list",
});
