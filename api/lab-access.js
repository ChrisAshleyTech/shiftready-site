// /labs/access?key=... (rewritten here by vercel.json). See _lib/labAccess.js.
import { labAccess } from "./_lib/labApi.js";

export function GET(request) { return labAccess(request); }
