import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // TODO: Allow for multiple games to be going simultaneously eventually
  workers: 1,
  webServer: {
    command: "npm run dev",
    port: 5173,
    reuseExistingServer: true,
  },
  testDir: "tests",
  testMatch: /(.+\.)?(test|spec)\.[jt]s/,
  use: {
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
