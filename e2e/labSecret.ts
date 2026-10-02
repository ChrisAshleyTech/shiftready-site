// Throwaway secret for signing lab access links in end-to-end tests. Production uses its own
// LAB_ACCESS_SECRET, set in the Vercel project, never this one.
export const E2E_LAB_SECRET = process.env.LAB_ACCESS_SECRET ?? "e2e-only-lab-access-secret-not-for-production";
