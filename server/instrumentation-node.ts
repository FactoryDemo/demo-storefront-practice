import { randomUUID } from "node:crypto";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { registerOTel } from "@vercel/otel";
import { logger } from "./logger";
import { SERVICE_NAME, serverRelease } from "./release";

/**
 * Traces and metrics go to the OTLP endpoint in OTEL_EXPORTER_OTLP_ENDPOINT
 * (with OTEL_EXPORTER_OTLP_HEADERS); profiles go to PYROSCOPE_SERVER_ADDRESS.
 * With neither set, nothing leaves the process.
 */
export async function registerNodeTelemetry(): Promise<void> {
  const release = serverRelease();
  const exporting = Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT);
  registerOTel({
    serviceName: SERVICE_NAME,
    attributes: {
      "service.namespace": String(release.appRepo),
      "service.version": String(release.appVersion),
      "deployment.environment.name": String(release.appEnvironment),
      // Each serverless instance keeps its own cumulative counters, so each
      // needs its own series.
      "service.instance.id": randomUUID(),
    },
    metricReaders: exporting
      ? [
          new PeriodicExportingMetricReader({
            exporter: new OTLPMetricExporter(),
            exportIntervalMillis: 30_000,
          }),
        ]
      : undefined,
  });
  await startProfiling(release);
}

async function startProfiling(
  release: ReturnType<typeof serverRelease>
): Promise<void> {
  const serverAddress = process.env.PYROSCOPE_SERVER_ADDRESS;
  if (!serverAddress) {
    return;
  }
  try {
    const { default: pyroscope } = await import("@pyroscope/nodejs");
    pyroscope.init({
      serverAddress,
      appName: SERVICE_NAME,
      basicAuthUser: process.env.PYROSCOPE_BASIC_AUTH_USER,
      basicAuthPassword: process.env.PYROSCOPE_BASIC_AUTH_PASSWORD,
      tags: {
        namespace: String(release.appRepo),
        environment: String(release.appEnvironment),
        version: String(release.appVersion),
      },
    });
    pyroscope.start();
  } catch (error) {
    // The profiler is a native module; a missing binary must not take the
    // app down.
    logger.warn("profiling unavailable", { error });
  }
}
