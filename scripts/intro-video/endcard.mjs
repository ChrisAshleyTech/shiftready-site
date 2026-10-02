// Renders the end card (out/endcard.png, laid out at 1280x720 and saved at 2x, 2560x1440, so the slow zoom
// stays sharp at 1080p): Christopher's Rolevara logo (public/brand/rolevara-logo-dark.svg)
// and the tagline on the same deep navy as the 3D reveal. Uses the installed Chrome, or CHROME_PATH.
import { mkdirSync, readFileSync } from "node:fs";
import { chromium } from "playwright";

const b64 = p => readFileSync(p).toString("base64");
const figtree = b64("node_modules/@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2");
const logo = b64("public/brand/rolevara-logo-dark.svg");
mkdirSync("scripts/intro-video/out", { recursive: true });
const b = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" });
const p = await b.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
await p.setContent(`<style>@font-face{font-family:F;src:url(data:font/woff2;base64,${figtree}) format("woff2");font-weight:100 900}
*{margin:0}body{width:1280px;height:720px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;
background:radial-gradient(ellipse at 50% 45%,#0d2a5c 0%,#061a3a 45%,#04112a 100%)}
img{width:560px}p{font:600 34px/1 F;color:#2DD4CF;letter-spacing:-.01em}</style>
<img src="data:image/svg+xml;base64,${logo}"><p>Experience the role. Master the work.</p>`);
await p.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode())); });
await p.screenshot({ path: "scripts/intro-video/out/endcard.png" });
await b.close();
console.log("end card written");
