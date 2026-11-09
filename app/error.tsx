"use client";

import { useEffect } from "react";
import { captureError } from "../components/posthog";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureError(error, { boundary: "app", digest: error.digest ?? "none" });
  }, [error]);

  return (
    <main className="page error-page">
      <h1 className="page-title">Something went wrong</h1>
      <p>
        We hit a problem showing this page. Your cart is saved, so you can try
        again.
      </p>
      <button type="button" className="button button-primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
