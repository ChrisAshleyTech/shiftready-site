// Tester access to the lab guides: signed links, the access cookie, and script downloads.
import { describe, expect, test } from "vitest";
import { signToken, verifyToken, labSecret, readCookie, COOKIE } from "../api/_lib/labAccess.js";
import { labAccess, labSession, labFile, LAB_FILES } from "../api/_lib/labApi.js";
import { existsSync } from "node:fs";

const KEY = "k".repeat(40);
const env = { LAB_ACCESS_SECRET: KEY };
const inDays = (d: number) => Math.floor(Date.now() / 1000) + d * 86400;
const token = signToken({ sub: "tester@example.com", exp: inDays(7) }, KEY);
const req = (path: string, cookie?: string) => new Request(`https://rolevara.com${path}`, { headers: cookie ? { cookie } : {} });

describe("lab access tokens", () => {
  test("a signed token verifies; tampered, expired or foreign tokens don't", () => {
    expect(verifyToken(token, KEY)).toMatchObject({ v: 1, sub: "tester@example.com" });
    const [body, sig] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ v: 1, sub: "x", exp: inDays(999) })).toString("base64url");
    expect(verifyToken(`${forged}.${sig}`, KEY)).toBeNull();
    expect(verifyToken(`${body}.${sig.slice(0, -2)}AA`, KEY)).toBeNull();
    expect(verifyToken(signToken({ sub: "t", exp: inDays(-1) }, KEY), KEY)).toBeNull();
    expect(verifyToken(signToken({ sub: "t", exp: inDays(7) }, "o".repeat(40)), KEY)).toBeNull();
    expect(verifyToken("not-a-token", KEY)).toBeNull();
    expect(verifyToken(token, null)).toBeNull();
  });

  test("a missing or short secret refuses all access", () => {
    expect(labSecret({})).toBeNull();
    expect(labSecret({ LAB_ACCESS_SECRET: "short" })).toBeNull();
    expect(labSecret(env)).toBe(KEY);
  });

  test("reads the access cookie among others", () => {
    expect(readCookie(`a=1; ${COOKIE}=${token}; b=2`)).toBe(token);
    expect(readCookie("a=1")).toBeNull();
  });
});

describe("lab access endpoints", () => {
  test("a valid link sets an HttpOnly cookie and opens the lab guide", () => {
    const r = labAccess(req(`/labs/access?key=${token}`), env);
    expect(r.status).toBe(302);
    expect(r.headers.get("location")).toBe("/app/#/labs");
    const c = r.headers.get("set-cookie")!;
    expect(c).toContain(`${COOKIE}=${token}`);
    expect(c).toMatch(/HttpOnly; Secure; SameSite=Lax; Max-Age=6\d{5}/);
    expect(r.headers.get("referrer-policy")).toBe("no-referrer");
  });

  test("an invalid link, or no secret configured, goes back to /labs", () => {
    for (const r of [labAccess(req("/labs/access?key=bad"), env), labAccess(req(`/labs/access?key=${token}`), {})]) {
      expect(r.headers.get("location")).toBe("/labs/?access=invalid");
      expect(r.headers.get("set-cookie")).toBeNull();
    }
  });

  test("the session endpoint reports access only with a valid cookie", async () => {
    expect(labSession(req("/api/lab-session"), env).status).toBe(401);
    expect(labSession(req("/api/lab-session", `${COOKIE}=garbage`), env).status).toBe(401);
    const ok = labSession(req("/api/lab-session", `${COOKIE}=${token}`), env);
    expect(ok.status).toBe(200);
    expect(await ok.json()).toMatchObject({ ok: true });
  });

  test("scripts are served only to testers, and only listed files", async () => {
    const path = "/api/lab-file?lab=okta&file=Seed-RolevaraOktaLab.ps1";
    expect((await labFile(req(path), env)).status).toBe(401);
    const ok = await labFile(req(path, `${COOKIE}=${token}`), env);
    expect(ok.status).toBe(200);
    expect(ok.headers.get("content-disposition")).toBe('attachment; filename="Seed-RolevaraOktaLab.ps1"');
    expect(ok.headers.get("cache-control")).toContain("no-store");
    expect(await ok.text()).toContain(".SYNOPSIS");
    for (const bad of ["lab=okta&file=..%2F..%2Fpackage.json", "lab=..&file=package.json", "lab=constructor&file=x", "lab=entra&file=rolevara-lab-state.json"])
      expect((await labFile(req(`/api/lab-file?${bad}`, `${COOKIE}=${token}`), env)).status, bad).toBe(404);
  });

  test("every listed file exists", () => {
    for (const [lab, files] of Object.entries(LAB_FILES)) for (const f of files) expect(existsSync(`lab-files/${lab}/${f}`), `${lab}/${f}`).toBe(true);
  });
});
