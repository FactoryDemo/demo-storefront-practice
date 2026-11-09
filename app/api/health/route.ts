import { NextResponse } from "next/server";
import { logger } from "../../../server/logger";
import { recordHealthCheck, withTelemetry } from "../../../server/telemetry";

export const dynamic = "force-dynamic";

const ROUTE = "/api/health";

export const GET = withTelemetry(ROUTE, () => {
  logger.info("health check", {
    route: ROUTE,
    uptimeSeconds: Math.round(process.uptime()),
  });
  recordHealthCheck();
  return NextResponse.json({ status: "ok" });
});
