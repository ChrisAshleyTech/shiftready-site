// /lab-files/:lab/:file (rewritten here by vercel.json): lab scripts, for testers only.
import { labFile } from "./_lib/labApi.js";

export function GET(request) { return labFile(request); }
