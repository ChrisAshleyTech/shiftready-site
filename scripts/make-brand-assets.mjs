// Renders Verdelit brand assets with Playwright from our own mark and fonts:
//   public/favicon.svg, public/favicon-32.png (-> favicon.ico with ffmpeg), public/apple-touch-icon.png,
//   public/icon-192.png, public/icon-512.png, public/icon-maskable-512.png,
//   public/og/verdelit-og.png (1200x630 social preview),
//   public/brand/verdelit-{horizontal,stacked}{,-dark}.{svg,png} (logo lockups, font embedded),
//   public/badges/verdelit-level-{beginner,intermediate,pro}.png (1200x627 LinkedIn images).
// Run after the demo poster is current: node scripts/make-brand-assets.mjs (uses the installed Chrome).
// The mark mirrors src/components/brand/Verdelit.tsx and the capsule mirrors LevelBadge.tsx.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const MINT = "#3DDC97", CYAN = "#1BA8E8", CHARCOAL = "#15201B", RIM = "#2E4038";
const TAGLINE = "Prove you can do the job before day one.";
const font = p => readFileSync(new URL(`../node_modules/${p}`, import.meta.url)).toString("base64");
const figtree = font("@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2");
const sans = font("@fontsource-variable/source-sans-3/files/source-sans-3-latin-wght-normal.woff2");
const poster = readFileSync(new URL("../public/video/demo-poster.jpg", import.meta.url)).toString("base64");
const FONTS = `@font-face{font-family:F;src:url(data:font/woff2;base64,${figtree}) format("woff2");font-weight:100 900}
@font-face{font-family:S;src:url(data:font/woff2;base64,${sans}) format("woff2");font-weight:200 900}`;

// The mark. `bleed` fills the whole square (for iOS and maskable icons, which the OS rounds itself);
// `scale` shrinks the light to keep it inside a maskable icon's safe zone.
let uid = 0;
const glow = id => `<radialGradient id="${id}"><stop offset="0" stop-color="${MINT}" stop-opacity=".75"/><stop offset=".55" stop-color="${MINT}" stop-opacity=".18"/><stop offset="1" stop-color="${MINT}" stop-opacity="0"/></radialGradient>`;
const light = (id, cx, cy, k = 1) => `<circle cx="${cx}" cy="${cy}" r="${12 * k}" fill="url(#${id})"/><circle cx="${cx}" cy="${cy}" r="${5.2 * k}" fill="${MINT}"/><circle cx="${cx - 1.4 * k}" cy="${cy - 1.4 * k}" r="${1.7 * k}" fill="#E9FFF5" opacity=".85"/>`;
const mark = (size, { bleed = false, scale = 1 } = {}) => {
  const id = `g${uid++}`;
  const box = bleed ? `<rect width="32" height="32" fill="${CHARCOAL}"/>` : `<rect x=".75" y=".75" width="30.5" height="30.5" rx="7.5" fill="${CHARCOAL}" stroke="${RIM}" stroke-width="1.5"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}"><defs>${glow(id)}</defs>${box}${light(id, 16, 16, scale)}</svg>`;
};
const capsule = (level, h) => {
  const id = `c${uid++}`, lit = ["beginner", "intermediate", "pro"].indexOf(level) + 1;
  const dots = [44, 28, 12].map((cy, i) => i < lit
    ? `<circle cx="12" cy="${cy}" r="8.5" fill="url(#${id})"/><circle cx="12" cy="${cy}" r="4.6" fill="${MINT}"/><circle cx="10.8" cy="${cy - 1.2}" r="1.4" fill="#E9FFF5" opacity=".85"/>`
    : `<circle cx="12" cy="${cy}" r="4.6" fill="${RIM}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 56" height="${h}" width="${(h * 24) / 56}"><defs><radialGradient id="${id}"><stop offset="0" stop-color="${MINT}" stop-opacity=".7"/><stop offset="1" stop-color="${MINT}" stop-opacity="0"/></radialGradient></defs><rect x=".75" y=".75" width="22.5" height="54.5" rx="11.25" fill="${CHARCOAL}" stroke="${RIM}" stroke-width="1.5"/>${dots}</svg>`;
};
const word = (px, ink) => `<span style="font:800 ${px}px/1 F;letter-spacing:-.02em;color:${ink}">verde<span style="background:linear-gradient(90deg,${MINT},${CYAN});-webkit-background-clip:text;background-clip:text;color:transparent">lit</span></span>`;

const b = await chromium.launch({ channel: "chrome" });
const shot = async (html, w, h, path, transparent = false) => {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.setContent(`<style>${FONTS}*{margin:0;box-sizing:border-box}body{width:${w}px;height:${h}px;overflow:hidden;background:${transparent ? "transparent" : CHARCOAL}}</style>${html}`);
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(100);
  await p.screenshot({ path, omitBackground: transparent }); await p.close();
};
for (const d of ["public/og", "public/brand", "public/badges"]) mkdirSync(d, { recursive: true });

// ---------- Icons ----------
writeFileSync("public/favicon.svg", mark(32).replace(' width="32" height="32"', "") + "\n");
await shot(mark(32), 32, 32, "public/favicon-32.png", true);
await shot(mark(192), 192, 192, "public/icon-192.png", true);
await shot(mark(512), 512, 512, "public/icon-512.png", true);
await shot(mark(180, { bleed: true, scale: 1.15 }), 180, 180, "public/apple-touch-icon.png");
await shot(mark(512, { bleed: true, scale: 0.95 }), 512, 512, "public/icon-maskable-512.png");

// ---------- Social preview ----------
await shot(`<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 8% 0%,rgba(61,220,151,.22) 0,transparent 55%),radial-gradient(ellipse at 100% 100%,rgba(27,168,232,.18) 0,transparent 50%)"></div>
<div style="position:absolute;left:72px;top:64px;width:600px;color:#fff">
  <div style="display:flex;align-items:center;gap:16px">${mark(60)}${word(46, "#fff")}</div>
  <div style="margin-top:64px;font:800 60px/1.05 F;letter-spacing:-.025em">${TAGLINE}</div>
  <div style="margin-top:26px;font:500 25px/1.4 S;color:#B9CCC3">Identity and access skills, built on real operations work and graded on outcome and process.</div>
</div>
<div style="position:absolute;right:-110px;top:96px;width:600px;border-radius:18px;overflow:hidden;box-shadow:0 30px 70px -20px rgba(61,220,151,.35);border:1px solid ${RIM}">
  <img src="data:image/jpeg;base64,${poster}" style="display:block;width:100%">
</div>`, 1200, 630, "public/og/verdelit-og.png");

// ---------- Logo lockups (SVG with the wordmark font embedded, plus PNG at 2x) ----------
const lockupSvg = (stacked, dark) => {
  const ink = dark ? "#FFFFFF" : CHARCOAL, id = `w${uid++}`;
  const inner = mark(64).replace("<svg ", '<svg x="0" y="0" ');
  const text = (x, y, anchor) => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="VerdelitFigtree" font-weight="800" font-size="52" letter-spacing="-1"><tspan fill="${ink}">verde</tspan><tspan fill="url(#${id})">lit</tspan></text>`;
  const defs = `<defs><style>@font-face{font-family:VerdelitFigtree;src:url(data:font/woff2;base64,${figtree}) format("woff2");font-weight:100 900}</style><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="LIT_X1" x2="LIT_X2" y1="0" y2="0"><stop offset="0" stop-color="${MINT}"/><stop offset="1" stop-color="${CYAN}"/></linearGradient></defs>`;
  return stacked
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 150" width="240" height="150">${defs}<g transform="translate(88 0)">${inner}</g>${text(120, 128, "middle")}</svg>\n`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 64" width="300" height="64">${defs}${inner}${text(80, 48, "start")}</svg>\n`;
};
for (const stacked of [false, true]) for (const dark of [false, true]) {
  const name = `public/brand/verdelit-${stacked ? "stacked" : "horizontal"}${dark ? "-dark" : ""}`;
  const [w, h] = stacked ? [240, 150] : [300, 64];
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  // The gradient spans only "lit": measure where those letters sit once the font has loaded.
  let svg = lockupSvg(stacked, dark);
  await p.setContent(`<style>*{margin:0}body{background:transparent}</style>${svg}`);
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150);
  const [x1, x2] = await p.evaluate(() => { const t = document.querySelector("text"); const n = t.getNumberOfChars();
    return [t.getStartPositionOfChar(5).x, t.getEndPositionOfChar(n - 1).x]; });
  svg = svg.replace("LIT_X1", x1.toFixed(1)).replace("LIT_X2", x2.toFixed(1));
  writeFileSync(`${name}.svg`, svg);
  await p.setContent(`<style>*{margin:0}body{background:transparent}</style>${svg}`);
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150);
  await p.screenshot({ path: `${name}.png`, omitBackground: true }); await p.close();
}

// ---------- LinkedIn level images ----------
const LABEL = { beginner: "Beginner", intermediate: "Intermediate", pro: "Pro" };
for (const level of ["beginner", "intermediate", "pro"]) {
  await shot(`<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 22% 50%,rgba(61,220,151,.22) 0,transparent 45%)"></div>
<div style="position:absolute;left:150px;top:83px">${capsule(level, 460)}</div>
<div style="position:absolute;left:430px;top:110px;width:700px;color:#fff">
  <div style="display:flex;align-items:center;gap:14px">${mark(46)}${word(36, "#fff")}</div>
  <div style="margin-top:56px;font:700 22px F;letter-spacing:.14em;text-transform:uppercase;color:${MINT}">Level</div>
  <div style="margin-top:6px;font:800 104px/1 F;letter-spacing:-.03em">${LABEL[level]}</div>
  <div style="margin-top:26px;font:500 26px/1.4 S;color:#B9CCC3">Identity and access skills, proven on realistic operations work.</div>
  <div style="margin-top:34px;font:600 22px S;color:#fff">${TAGLINE} <span style="color:${MINT}">verdelit.com</span></div>
</div>`, 1200, 627, `public/badges/verdelit-level-${level}.png`);
}
await b.close();
console.log("brand assets written");
