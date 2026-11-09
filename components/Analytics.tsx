"use client";

import { useEffect } from "react";
import { loadAnalytics } from "./posthog";

/** Starts product analytics after the first render; renders nothing. */
export function Analytics(): null {
  useEffect(() => {
    void loadAnalytics();
  }, []);
  return null;
}
