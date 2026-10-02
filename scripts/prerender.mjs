// Writes server-rendered HTML for each marketing page into dist/, replacing the empty root, so text
// paints before JavaScript runs; the client then hydrates it (src/lib/mount.tsx).
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const { PAGES, render } = await import(pathToFileURL(resolve("dist-ssr/prerender.js")).href);
for (const file of Object.keys(PAGES)) {
  const path = resolve("dist", file);
  const html = readFileSync(path, "utf8");
  const out = html.replace(/<div id="root">[\s\S]*?<\/div>\s*(?=<\/body>|<script)/, `<div id="root" data-prerendered>${render(file)}</div>\n`);
  if (out === html) throw new Error(`No root element found in ${file}`);
  writeFileSync(path, out);
  console.log(`prerendered ${file}`);
}
rmSync(resolve("dist-ssr"), { recursive: true, force: true });
