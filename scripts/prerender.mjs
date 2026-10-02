// Writes server-rendered HTML for each marketing page into dist/, replacing the empty root, so text
// paints before JavaScript runs; the client then hydrates it (src/lib/mount.tsx).
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const { PAGES, SCHEMA, LLMS_TXT, render } = await import(pathToFileURL(resolve("dist-ssr/prerender.js")).href);
for (const file of Object.keys(PAGES)) {
  const path = resolve("dist", file);
  const html = readFileSync(path, "utf8");
  // JSON-LD is data, not script: browsers never run it, so the CSP needs no hash for it.
  const ld = SCHEMA[file] ? `<script type="application/ld+json">${JSON.stringify(SCHEMA[file]).replace(/</g, "\\u003c")}</script>\n` : "";
  const out = html.replace(/<div id="root">[\s\S]*?<\/div>\s*(?=<\/body>|<script)/, `<div id="root" data-prerendered>${render(file)}</div>\n`);
  if (out === html) throw new Error(`No root element found in ${file}`);
  writeFileSync(path, out.replace("</head>", ld + "</head>"));
  console.log(`prerendered ${file}`);
}
writeFileSync(resolve("dist/llms.txt"), LLMS_TXT);
console.log("wrote llms.txt");
rmSync(resolve("dist-ssr"), { recursive: true, force: true });
