import { NextResponse } from "next/server";
import { logger } from "../../../server/logger";

export const dynamic = "force-dynamic";

export function GET(): NextResponse {
  logger.info("health check", {
    route: "/api/health",
    uptimeSeconds: Math.round(process.uptime()),
  });
  return NextResponse.json({ status: "ok" });
}
