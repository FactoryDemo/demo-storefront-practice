import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { buildOrder, validateOrderRequest } from "../../../lib/orders";
import { logger } from "../../../server/logger";

export const dynamic = "force-dynamic";

const ROUTE = "/api/orders";

/** Place a mock pickup order. Totals are recomputed here, never trusted. */
export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    logger.warn("order rejected", { route: ROUTE, reason: "invalid json" });
    return NextResponse.json(
      { errors: ["Request body must be JSON."] },
      { status: 400 }
    );
  }

  const result = validateOrderRequest(body);
  if (!result.ok) {
    logger.warn("order rejected", { route: ROUTE, errors: result.errors });
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  const id = `BB-${randomUUID().slice(0, 6).toUpperCase()}`;
  const order = buildOrder(result.request, id, new Date());
  // The customer's name stays out of the logs.
  logger.info("order placed", {
    route: ROUTE,
    orderId: order.id,
    pickup: order.pickup,
    lineCount: order.lines.length,
    totalCents: order.totalCents,
  });
  return NextResponse.json(order, { status: 201 });
}
