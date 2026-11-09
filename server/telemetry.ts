import { metrics, trace } from "@opentelemetry/api";
import { waitUntil } from "@vercel/functions";
import { PostHog } from "posthog-node";
import type { Order } from "../lib/orders";
import { logger } from "./logger";
import { SERVICE_NAME, serverRelease } from "./release";

// Instruments are created when a route module first loads, which is after
// instrumentation.ts has registered the meter provider.
const meter = metrics.getMeter(SERVICE_NAME);
const ordersPlaced = meter.createCounter("orders_placed", {
  description: "Orders accepted by POST /api/orders",
});
const ordersRejected = meter.createCounter("orders_rejected", {
  description: "Orders refused by POST /api/orders, by reason",
});
const orderValue = meter.createHistogram("order_value_cents", {
  description: "Total of each accepted order, in cents",
  advice: {
    explicitBucketBoundaries: [300, 500, 1000, 1500, 2000, 3000, 5000, 10000],
  },
});
const serverErrors = meter.createCounter("server_errors", {
  description: "Unhandled errors in API routes, by route",
});
const healthChecks = meter.createCounter("health_checks", {
  description: "Requests to GET /api/health",
});

export type RejectionReason = "invalid_json" | "validation";

export function recordOrderPlaced(order: Order): void {
  ordersPlaced.add(1, { pickup: order.pickup });
  orderValue.record(order.totalCents, { pickup: order.pickup });
}

export function recordOrderRejected(reason: RejectionReason): void {
  ordersRejected.add(1, { reason });
}

export function recordHealthCheck(): void {
  healthChecks.add(1);
}

let posthog: PostHog | null | undefined;

function posthogClient(): PostHog | null {
  if (posthog === undefined) {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    posthog = key
      ? new PostHog(key, {
          host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
          flushAt: 1,
          flushInterval: 0,
        })
      : null;
  }
  return posthog;
}

/**
 * Report an unexpected server error: a JSON log line, the server_errors
 * metric, and a PostHog exception linked to the browser session when the
 * request carries PostHog's tracing headers.
 */
export function captureServerError(
  error: unknown,
  route: string,
  request: Request
): void {
  const traceId = trace.getActiveSpan()?.spanContext().traceId;
  serverErrors.add(1, { route });
  logger.error("unhandled error", { route, method: request.method, error });
  posthogClient()?.captureException(
    error,
    request.headers.get("x-posthog-distinct-id") ?? undefined,
    {
      route,
      method: request.method,
      traceId,
      $session_id: request.headers.get("x-posthog-session-id") ?? undefined,
      ...serverRelease(),
    }
  );
}

/** Push pending metrics and PostHog events before the function freezes. */
export async function flushTelemetry(): Promise<void> {
  const provider = metrics.getMeterProvider() as {
    forceFlush?: () => Promise<void>;
  };
  await Promise.allSettled([provider.forceFlush?.(), posthog?.flush()]);
}

type RouteHandler = (request: Request) => Response | Promise<Response>;

/**
 * Wrap a route handler so an unexpected error becomes a reported 500 and
 * telemetry is flushed after every request.
 */
export function withTelemetry(
  route: string,
  handler: RouteHandler
): (request: Request) => Promise<Response> {
  return async (request) => {
    try {
      return await handler(request);
    } catch (error) {
      captureServerError(error, route, request);
      return Response.json(
        { errors: ["Something went wrong on our side. Try again."] },
        { status: 500 }
      );
    } finally {
      waitUntil(flushTelemetry());
    }
  };
}
