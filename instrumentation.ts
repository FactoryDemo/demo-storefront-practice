import { registerOTel } from "@vercel/otel";
import { SERVICE_NAME } from "./server/release";

/**
 * Called once by Next.js when the server starts. Telemetry is exported only
 * when its environment variables are set (see .env.example); without them,
 * nothing leaves the process.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerNodeTelemetry } =
      await import("./server/instrumentation-node");
    await registerNodeTelemetry();
    return;
  }
  registerOTel({ serviceName: SERVICE_NAME });
}
