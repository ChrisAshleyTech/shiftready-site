import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));
// The local preview server applies the same site-wide security headers as Vercel (vercel.json), so
// end-to-end tests run under the production Content-Security-Policy.
const siteHeaders = Object.fromEntries(
  (JSON.parse(readFileSync(r("./vercel.json"), "utf8")).headers as { source: string; headers: { key: string; value: string }[] }[])
    .find(h => h.source === "/(.*)")!.headers.filter(h => h.key !== "Strict-Transport-Security").map(h => [h.key, h.value]),
);

// Multi-page build keeps the public URLs: / (landing), /app/ (simulator), /report/ (shared report).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": r("./src") } },
  build: {
    rollupOptions: {
      input: { landing: r("./index.html"), app: r("./app/index.html"), report: r("./report/index.html"), pricing: r("./pricing/index.html"), tracks: r("./tracks/index.html"), industries: r("./industries/index.html"), labs: r("./labs/index.html"), resources: r("./resources/index.html"), privacy: r("./privacy/index.html"), terms: r("./terms/index.html") },
    },
  },
  preview: { headers: siteHeaders },
  test: { environment: "jsdom", include: ["tests/**/*.test.{js,ts}"] },
});
