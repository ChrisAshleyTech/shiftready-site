import { defineConfig } from "@playwright/test";
import { E2E_LAB_SECRET } from "./e2e/labSecret";

// Runs against the production build. Uses the installed Chrome, so no browser download is needed.
export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  fullyParallel: false,
  use: { baseURL: "http://localhost:4173", channel: "chrome", reducedMotion: "reduce", viewport: { width: 1440, height: 900 } },
  webServer: { command: "npm run build && npx vite preview --port 4173 --strictPort", url: "http://localhost:4173", reuseExistingServer: true, timeout: 180_000,
    env: { LAB_ACCESS_SECRET: E2E_LAB_SECRET } },
});
