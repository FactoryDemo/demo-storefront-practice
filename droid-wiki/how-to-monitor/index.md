# Monitoring

Bean & Byte has optional PostHog analytics/error tracking and Grafana traces, metrics, and profiles. JSON server logs are always available. No telemetry credentials are required for local ordering. Start with [configuration](../reference/configuration.md) before enabling exports: filling in `.env.example` placeholders can cause outbound telemetry, not just change local display.

## Signal map

| Signal | Destination and navigation | Detail |
| --- | --- | --- |
| Server logs | Vercel function logs; newline-delimited JSON on stdout/stderr locally | [Logging](logging.md) |
| Accepted/rejected orders, values, errors, health requests | Grafana Cloud Prometheus; **Bean & Byte storefront**, `/d/bean-and-byte` | [Metrics](metrics.md) |
| Server request traces | Grafana Cloud Tempo Explore; service `bean-and-byte` | [Tracing and profiles](tracing.md) |
| CPU profiles | Pyroscope Explore or dashboard CPU panel | [Tracing and profiles](tracing.md) |
| Browser and API exceptions | PostHog error tracking, filtered by `appRepo` | [Tracing and profiles](tracing.md) |
| Shopping events and feature flags | PostHog product analytics and flags | [Analytics and flags](../features/analytics.md) |
| Deployment markers | GitHub deployments plus Grafana/PostHog annotations | [Deployment](../deployment.md) |
| Detected errors and firing alerts | GitHub issues labeled `error-tracking` or `alert` | [Alerting](alerting.md) |

Logs do not automatically carry release or trace fields. Server exceptions include release properties; OTLP resources and profiler tags identify deployments separately. Do not assume every signal has an identical schema.

## Incident navigation

1. Read the issue's source, version, environment, and last-seen time. The scheduled issue workflow runs every 30 minutes, so it is not an immediate notification channel.
2. Open the Grafana dashboard for the affected deployment and time range. Compare the symptom with deploy annotations. The dashboard defaults to the last 24 hours and refreshes every minute.
3. For an API exception, open the PostHog error and inspect its stack, route, and session association. If `traceId` exists, search for it in Tempo.
4. For rejected orders, separate `invalid_json` from `validation`. These are expected HTTP 400 paths, not necessarily thrown server errors. See [API behavior](../api.md) and [checkout](../features/checkout.md).
5. For CPU-heavy requests, inspect the profile panel. An absent profile can mean profiling was never configured or its native binary could not load.
6. If a deployment caused the regression, follow the rollback guidance in [deployment](../deployment.md), then fix forward.

No formal SLO, uptime probe schedule, pager rotation, or escalation channel is defined in this repository. `health_checks` counts incoming requests; it does not generate them. Alert no-data handling is deliberately permissive and must not be mistaken for proof of service health.

## Extension boundaries

Keep instrumentation and other I/O in `server/` and route/component boundaries, never pure `lib/` functions. Wrap new API handlers with `withTelemetry`, record bounded dimensions, and omit personal data. Preserve the wrapper's post-response flush. Add dashboard queries and rules through reviewed JSON rather than assuming a new instrument appears automatically.

## Key source files

| Repository path | Responsibility |
| --- | --- |
| `docs/runbooks/observability.md` | Existing incident navigation and configuration overview. |
| `instrumentation.ts`, `server/instrumentation-node.ts` | Runtime registration and exporter/profile setup. |
| `server/telemetry.ts`, `server/logger.ts` | Route instrumentation, flushing, and JSON logs. |
| `observability/grafana/dashboard.json`, `observability/grafana/alert-rules.json` | Dashboard and alert definitions. |
| `.github/workflows/error-issues.yml`, `.github/workflows/observability.yml` | Issue polling and Grafana provisioning. |
