# Tracing and profiles

Next.js invokes `register()` in `instrumentation.ts` through the enabled instrumentation hook. Node.js registration dynamically imports `server/instrumentation-node.ts`; other runtimes call `registerOTel` with only the service name. The repository relies on Next.js/Vercel OpenTelemetry instrumentation, not a set of application-defined business spans.

## Service and release identity

Node registration sets service name `bean-and-byte` and these resource attributes:

| Resource attribute | Source |
| --- | --- |
| `service.namespace` | `appRepo`, from `VERCEL_GIT_REPO_SLUG`, fallback `local`. |
| `service.version` | `appVersion`, first seven characters of `VERCEL_GIT_COMMIT_SHA`, fallback `dev`. |
| `deployment.environment.name` | `appEnvironment`, from `VERCEL_ENV`, fallback `development`. |
| `service.instance.id` | New `randomUUID()` per registration/instance. |

`server/release.ts` delegates release construction to `lib/analytics.ts`. Browser events use the corresponding `NEXT_PUBLIC_VERCEL_*` variables. These are release identifiers, not proof that traces were exported successfully.

Configure `OTEL_EXPORTER_OTLP_ENDPOINT` and `OTEL_EXPORTER_OTLP_HEADERS` for the Grafana OTLP gateway. The explicit metric reader is conditional on the endpoint; trace exporter behavior is delegated to `@vercel/otel`. No application-specific sampler, custom business spans, or trace retention policy is configured. See [configuration](../reference/configuration.md) and [metrics](metrics.md).

## Exception, session, and trace correlation

`components/posthog.ts` enables PostHog exception capture and `tracing_headers: [window.location.hostname]`. For same-host requests the SDK can supply `x-posthog-distinct-id` and `x-posthog-session-id`.

When a wrapped API handler throws, `captureServerError`:

1. Reads the active OpenTelemetry span's `traceId`, if available.
2. Increments `server_errors` by route and writes an `unhandled error` JSON log.
3. Sends a PostHog exception with the header-derived distinct ID, `$session_id`, route, method, `traceId`, and release properties.

The server PostHog client is lazy, requires `NEXT_PUBLIC_POSTHOG_KEY`, uses `NEXT_PUBLIC_POSTHOG_HOST`, and configures `flushAt: 1`, `flushInterval: 0`. `withTelemetry` returns a generic HTTP 500 and schedules metrics/PostHog flushing after every request, including successful ones.

Open the PostHog exception, copy its `traceId`, then search Tempo Explore for that ID. Correlation is conditional: missing headers, an inactive span, absent credentials, or export failure can leave pieces unavailable. The JSON error log itself does **not** include `traceId` or session ID. Header-derived identifiers are correlation data, not authentication.

`app/error.tsx` and `app/global-error.tsx` explicitly capture React boundary exceptions with `boundary` and `digest`. Browser session recording is disabled, so a session association does not imply a replay exists. See [analytics](../features/analytics.md) and [security](../security.md).

## Native CPU profiling

With `PYROSCOPE_SERVER_ADDRESS`, Node registration dynamically imports `@pyroscope/nodejs`, initializes basic authentication, and starts profiling. App name is `bean-and-byte`; tags are `namespace`, `environment`, and `version` from release properties. Missing address skips startup. Import/init/start failure logs `profiling unavailable` and does not intentionally fail application startup.

`next.config.mjs` externalizes `@pyroscope/nodejs` and `@datadog/pprof`. Its output tracing includes the pprof package metadata, runtime JavaScript, Linux x64 `dd_pprof.node.abi*.node` prebuilds, and JavaScript from `node-gyp-build`, `pprof-format`, and `source-map`. This native bundling is deployment-sensitive, not a guarantee for every architecture.

The dashboard CPU panel uses datasource UID `grafanacloud-profiles`, profile type `process_cpu:cpu:nanoseconds:cpu:nanoseconds`, and selector `{service_name="bean-and-byte"}`. It does not use the dashboard's metric deployment filter.

## Adding instrumentation

Wrap new routes with `withTelemetry` and preserve flush behavior. If a measured need warrants custom spans, create them at I/O boundaries using the existing OpenTelemetry API, ensure they end on failure, and avoid personal data or unbounded attributes. No such custom spans exist today. Native-bundle changes belong with [deployment](../deployment.md) validation.

| Repository path | Responsibility |
| --- | --- |
| `instrumentation.ts`, `server/instrumentation-node.ts` | Runtime registration and profiling. |
| `server/release.ts`, `server/telemetry.ts` | Identity and exception correlation. |
| `components/posthog.ts` | Browser headers and exception capture. |
| `next.config.mjs` | Native profiler packaging. |
