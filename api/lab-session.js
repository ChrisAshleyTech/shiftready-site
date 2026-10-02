// /api/lab-session: whether this browser holds tester access to the lab guides.
import { labSession } from "./_lib/labApi.js";

export function GET(request) { return labSession(request); }
