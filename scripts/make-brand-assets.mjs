// Renders brand assets with Playwright from our own logo and fonts:
//   public/og/shiftready-og.png (1200x630 social preview), public/apple-touch-icon.png (180),
//   public/icon-192.png, public/icon-512.png, public/icon-maskable-512.png, public/favicon-32.png
// Run: node scripts/make-brand-assets.mjs (needs the build's fonts; uses the installed Chrome).
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const font = p => readFileSync(new URL(`../node_modules/${p}`, import.meta.url)).toString("base64");
const figtree = font("@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2");
const sans = font("@fontsource-variable/source-sans-3/files/source-sans-3-latin-wght-normal.woff2");
const poster = readFileSync(new URL("../public/video/demo-poster.jpg", import.meta.url)).toString("base64");
const mark = (s, pad = 0) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${32 + 2 * pad} ${32 + 2 * pad}" width="${s}" height="${s}"><rect x="${-pad}" y="${-pad}" width="${32 + 2 * pad}" height="${32 + 2 * pad}" fill="${pad ? "#2563eb" : "none"}"/><rect width="32" height="32" rx="${pad ? 0 : 8}" fill="#2563eb"/><rect x="8" y="8.5" width="16" height="3.5" rx="1.75" fill="#fff"/><rect x="8" y="14.25" width="12" height="3.5" rx="1.75" fill="#fff" opacity=".7"/><rect x="8" y="20" width="8" height="3.5" rx="1.75" fill="#fff" opacity=".45"/></svg>`;
const css = `@font-face{font-family:F;src:url(data:font/woff2;base64,${figtree}) format("woff2");font-weight:100 900}
@font-face{font-family:S;src:url(data:font/woff2;base64,${sans}) format("woff2");font-weight:200 900}
*{margin:0;box-sizing:border-box}body{width:1200px;height:630px;font-family:S;background:#f6f8fc;color:#0f172a;overflow:hidden}`;
const og = `<style>${css}</style>
<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 10% 0%,#bae6fd 0,transparent 55%),radial-gradient(ellipse at 100% 100%,#c7d2fe 0,transparent 50%)"></div>
<div style="position:absolute;left:72px;top:64px;width:560px">
  <div style="display:flex;align-items:center;gap:14px;font:800 34px F">${mark(52)}ShiftReady</div>
  <div style="margin-top:56px;font:700 15px F;letter-spacing:.1em;text-transform:uppercase;color:#1d4ed8">Identity and access skills platform</div>
  <div style="margin-top:16px;font:800 56px/1.06 F;letter-spacing:-.025em">Identity and access skills, built on real operations work.</div>
  <div style="margin-top:24px;font:500 24px/1.4 S;color:#475569">Provisioning, access reviews, incident response and audit readiness, graded on outcome and process.</div>
</div>
<div style="position:absolute;right:-120px;top:96px;width:620px;border-radius:18px;overflow:hidden;box-shadow:0 30px 60px -20px rgba(37,99,235,.45);border:1px solid #e2e8f0">
  <img src="data:image/jpeg;base64,${poster}" style="display:block;width:100%">
</div>`;
const b = await chromium.launch({ channel: "chrome" });
const shot = async (html, w, h, path) => { const p = await b.newPage({ viewport: { width: w, height: h } }); await p.setContent(html); await p.waitForTimeout(150); await p.screenshot({ path, omitBackground: false }); await p.close(); };
const icon = (s, pad = 0) => `<style>*{margin:0}body{width:${s}px;height:${s}px;background:${pad ? "#2563eb" : "transparent"}}</style>${mark(s, pad)}`;
await shot(og, 1200, 630, "public/og/shiftready-og.png");
await shot(icon(180, 3), 180, 180, "public/apple-touch-icon.png");
await shot(icon(192), 192, 192, "public/icon-192.png");
await shot(icon(512), 512, 512, "public/icon-512.png");
await shot(icon(512, 8), 512, 512, "public/icon-maskable-512.png");
await shot(icon(32), 32, 32, "public/favicon-32.png");
await b.close();
console.log("brand assets written");
