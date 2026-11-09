import type { PostHog, PostHogConfig } from "posthog-js";
import { useEffect, useState } from "react";
import {
  releaseProperties,
  type AnalyticsEvent,
  type AnalyticsProperties,
  type FeatureFlag,
} from "../lib/analytics";

let client: Promise<PostHog | null> | undefined;

/**
 * Loads PostHog in its own chunk and starts it once. Without
 * NEXT_PUBLIC_POSTHOG_KEY (local dev, CI, tests) nothing is loaded or sent.
 */
export function loadAnalytics(): Promise<PostHog | null> {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || typeof window === "undefined") {
    return Promise.resolve(null);
  }
  client ??= import(/* webpackChunkName: "posthog" */ "posthog-js").then(
    ({ default: posthog }) => {
      posthog.init(key, posthogConfig());
      posthog.register(
        releaseProperties({
          repo: process.env.NEXT_PUBLIC_VERCEL_GIT_REPO_SLUG,
          commitSha: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
          environment: process.env.NEXT_PUBLIC_VERCEL_ENV,
        })
      );
      return posthog;
    },
    () => null
  );
  return client;
}

/* eslint-disable @typescript-eslint/naming-convention -- PostHog's config keys are snake_case */
function posthogConfig(): Partial<PostHogConfig> {
  return {
    api_host:
      process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    defaults: "2025-05-24",
    person_profiles: "identified_only",
    capture_exceptions: true,
    disable_session_recording: true,
    // Sends the PostHog session and distinct ids to our own API routes, so
    // server errors link to the browser session that caused them.
    tracing_headers: [window.location.hostname],
  };
}
/* eslint-enable @typescript-eslint/naming-convention */

export function track(
  event: AnalyticsEvent,
  properties?: AnalyticsProperties
): void {
  void loadAnalytics().then((posthog) => posthog?.capture(event, properties));
}

export function captureError(
  error: unknown,
  properties?: AnalyticsProperties
): void {
  void loadAnalytics().then((posthog) =>
    posthog?.captureException(error, properties)
  );
}

/** True only once PostHog has loaded flags and this flag is on. */
export function useFeatureFlag(flag: FeatureFlag): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    void loadAnalytics().then((posthog) => {
      if (!posthog || !active) {
        return;
      }
      unsubscribe = posthog.onFeatureFlags(() =>
        setEnabled(posthog.isFeatureEnabled(flag) === true)
      );
    });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [flag]);

  return enabled;
}
