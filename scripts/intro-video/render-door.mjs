// Renders the 3D door R sequence (door3d.html) to PNG frames: 120 frames, 4 seconds at 30 fps, 1920x1080
// (set W for another width).
// Uses the installed Chrome, or the browser at CHROME_PATH. Run from the repo root:
//   node scripts/intro-video/render-door.mjs   ->   scripts/intro-video/out/frames/f0000.png ...
import { createServer } from "node:http";
import { mkdirSync, readFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright";

const ROOT = process.cwd(), OUT = "scripts/intro-video/out/frames", FRAMES = 120;
const W = +(process.env.W || 1920), H = Math.round(W * 9 / 16);
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".svg": "image/svg+xml" };
const server = createServer((req, res) => {
  try { const f = join(ROOT, normalize(decodeURIComponent(new URL(req.url, "http://x").pathname))); res.setHeader("content-type", TYPES[extname(f)] ?? "application/octet-stream"); res.end(readFileSync(f)); }
  catch { res.statusCode = 404; res.end(); }
}).listen(0);
mkdirSync(OUT, { recursive: true });

const b = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" }), args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: W, height: H } });
p.on("pageerror", e => { console.error(e); process.exit(1); });
await p.goto(`http://localhost:${server.address().port}/scripts/intro-video/door3d.html?w=${W}`);
await p.waitForFunction(() => window.ready, null, { timeout: 120_000 });
for (let i = 0; i < FRAMES; i++) {
  await p.evaluate(t => window.renderAt(t), i / (FRAMES - 1));
  await p.locator("canvas").screenshot({ path: `${OUT}/f${String(i).padStart(4, "0")}.png` });
}
await b.close(); server.close();
console.log(`${FRAMES} frames in ${OUT}`);
