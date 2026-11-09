"use client";

import { useEffect } from "react";
import { captureError } from "../components/posthog";

/** Last-resort boundary for errors in the root layout itself. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureError(error, { boundary: "root", digest: error.digest ?? "none" });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main style={{ padding: 48, fontFamily: "sans-serif" }}>
          <h1>Something went wrong</h1>
          <button type="button" onClick={reset}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
