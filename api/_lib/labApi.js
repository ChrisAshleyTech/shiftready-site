// Request handlers for lab access (Web-standard Request/Response). Vercel runs them from api/*.js;
// the Vite dev and preview servers mount the same handlers (vite.config.ts), so tests cover them.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { accessFrom, cookieFor, labSecret, verifyToken } from "./labAccess.js";

// Every file the lab guides offer. Nothing outside this list is ever read.
export const LAB_FILES = {
  entra: ["Seed-RolevaraLab.ps1", "Export-RolevaraLab.ps1", "Remove-RolevaraLab.ps1"],
  okta: ["Seed-RolevaraOktaLab.ps1", "Check-RolevaraOktaLab.ps1", "Remove-RolevaraOktaLab.ps1"],
  aws: ["rolevara-lab-aws.json", "seed_rolevara_lab.py", "check_rolevara_lab.py", "remove_rolevara_lab.py"],
};

const NO_STORE = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" };
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { ...NO_STORE, "Content-Type": "application/json" } });
const redirect = (to, extra = {}) => new Response(null, { status: 302, headers: { ...NO_STORE, "Referrer-Policy": "no-referrer", Location: to, ...extra } });

/** GET /labs/access?key=...: checks the link, sets the access cookie and opens the lab guide. */
export function labAccess(request, env = process.env) {
  const key = new URL(request.url).searchParams.get("key");
  const p = verifyToken(key, labSecret(env));
  if (!p) return redirect("/labs/?access=invalid");
  return redirect("/app/#/labs", { "Set-Cookie": cookieFor(key, p.exp) });
}

/** GET /api/lab-session: whether this browser holds valid tester access. */
export function labSession(request, env = process.env) {
  const p = accessFrom(request, env);
  return p ? json(200, { ok: true, exp: p.exp }) : json(401, { ok: false });
}

/** GET /lab-files/:lab/:file: one lab script, for testers only. */
export async function labFile(request, env = process.env, root = process.cwd()) {
  const q = new URL(request.url).searchParams;
  const lab = q.get("lab"), file = q.get("file");
  if (!Object.hasOwn(LAB_FILES, lab ?? "") || !LAB_FILES[lab].includes(file)) return json(404, { ok: false });
  if (!accessFrom(request, env)) return json(401, { ok: false, error: "Lab files need tester access. Open the access link from your invitation first." });
  const body = await readFile(join(root, "lab-files", lab, file));
  const type = file.endsWith(".json") ? "application/json" : "text/plain; charset=utf-8";
  return new Response(body, { status: 200, headers: { ...NO_STORE, "Content-Type": type, "Content-Disposition": `attachment; filename="${file}"` } });
}
