"use client";

import { FEATURE_FLAGS } from "../lib/analytics";
import { useFeatureFlag } from "./posthog";

/** A one-line menu notice behind the `menu-announcement` feature flag. */
export function MenuAnnouncement() {
  const enabled = useFeatureFlag(FEATURE_FLAGS.menuAnnouncement);
  if (!enabled) {
    return null;
  }
  return (
    <p className="announcement" role="status">
      Cardamom buns are back, baked fresh every morning.
    </p>
  );
}
