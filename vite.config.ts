import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Multi-page build keeps the public URLs: / (landing), /app/ (simulator), /report/ (shared report).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": r("./src") } },
  build: {
    rollupOptions: {
      input: { landing: r("./index.html"), app: r("./app/index.html"), report: r("./report/index.html"), pricing: r("./pricing/index.html"), tracks: r("./tracks/index.html"), industries: r("./industries/index.html"), labs: r("./labs/index.html"), resources: r("./resources/index.html") },
    },
  },
  test: { environment: "jsdom", include: ["tests/**/*.test.{js,ts}"] },
});
