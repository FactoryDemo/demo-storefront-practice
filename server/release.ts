import { releaseProperties, type AnalyticsProperties } from "../lib/analytics";

export const SERVICE_NAME = "bean-and-byte";

/** The deployment this server is running, from Vercel's system variables. */
export function serverRelease(): AnalyticsProperties {
  return releaseProperties({
    repo: process.env.VERCEL_GIT_REPO_SLUG,
    commitSha: process.env.VERCEL_GIT_COMMIT_SHA,
    environment: process.env.VERCEL_ENV,
  });
}
