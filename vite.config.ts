import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { seo } from "./seo.plugin";
import { fileURLToPath } from "node:url";
import { readFileSync, readdirSync } from "node:fs";
import type { Connect } from "vite";
import { labAccess, labFile, labSession } from "./api/_lib/labApi.js";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));
// The local preview server applies the same site-wide security headers as Vercel (vercel.json), so
// end-to-end tests run under the production Content-Security-Policy.
const siteHeaders = Object.fromEntries(
  (JSON.parse(readFileSync(r("./vercel.json"), "utf8")).headers as { source: string; headers: { key: string; value: string }[] }[])
    .find(h => h.source === "/(.*)")!.headers.filter(h => h.key !== "Strict-Transport-Security").map(h => [h.key, h.value]),
);

// The lab access endpoints run as Vercel functions in production (api/, routed by vercel.json). The
// dev and preview servers mount the same handlers, so lab access works locally and in tests.
const labRoutes: [RegExp, (req: Request, m: RegExpMatchArray) => Response | Promise<Response>][] = [
  [/^\/labs\/access(\?|$)/, req => labAccess(req)],
  [/^\/api\/lab-session(\?|$)/, req => labSession(req)],
  [/^\/lab-files\/([^/?]+)\/([^/?]+)$/, (req, m) => labFile(new Request(`http://local/api/lab-file?lab=${m[1]}&file=${m[2]}`, { headers: req.headers }))],
];
const labApi: Connect.NextHandleFunction = async (req, res, next) => {
  const url = req.url ?? "/";
  const route = labRoutes.map(([re, h]) => [url.match(re), h] as const).find(([m]) => m);
  if (!route) return next();
  const headers = new Headers(Object.entries(req.headers).flatMap(([k, v]) => (v == null ? [] : [[k, String(v)]] as [string, string][])));
  const r = await route[1](new Request(`http://${req.headers.host ?? "localhost"}${url}`, { headers }), route[0]!);
  res.statusCode = r.status;
  r.headers.forEach((v, k) => res.setHeader(k, v));
  res.end(Buffer.from(await r.arrayBuffer()));
};
const labApiPlugin = { name: "lab-api", configureServer: (s: { middlewares: Connect.Server }) => { s.middlewares.use(labApi); }, configurePreviewServer: (s: { middlewares: Connect.Server }) => { s.middlewares.use(labApi); } };

// Every guide is its own page: guides/index.html and guides/<slug>/index.html.
const guideInputs = Object.fromEntries(readdirSync(r("./guides"), { withFileTypes: true }).filter(d => d.isDirectory()).map(d => [`guide-${d.name}`, r(`./guides/${d.name}/index.html`)]));

// Multi-page build keeps the public URLs: / (landing), /app/ (simulator), /report/ (shared report).
// The SSR build (for pre-rendering marketing pages) uses its own entry, so it skips the page inputs.
export default defineConfig(({ isSsrBuild }) => ({
  plugins: isSsrBuild ? [react()] : [react(), tailwindcss(), seo(), labApiPlugin],
  resolve: { alias: { "@": r("./src") } },
  build: isSsrBuild ? {} : {
    rollupOptions: {
      input: { landing: r("./index.html"), app: r("./app/index.html"), report: r("./report/index.html"), pricing: r("./pricing/index.html"), tracks: r("./tracks/index.html"), industries: r("./industries/index.html"), labs: r("./labs/index.html"), resources: r("./resources/index.html"), privacy: r("./privacy/index.html"), terms: r("./terms/index.html"), notfound: r("./404.html"), guides: r("./guides/index.html"), ...guideInputs },
    },
  },
  preview: { headers: siteHeaders },
  test: { environment: "jsdom", include: ["tests/**/*.test.{js,ts}"] },
}));
