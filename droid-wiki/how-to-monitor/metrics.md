# Metrics

`server/telemetry.ts` creates five application instruments from the OpenTelemetry meter named `bean-and-byte`. Route modules load after instrumentation registration. Metrics describe mock order acceptance and API activity, not payment settlement or persisted fulfillment. See [checkout](../features/checkout.md) for that boundary.

## Instruments and dimensions

| Instrument | Type | Recorded attributes and trigger |
| --- | --- | --- |
| `orders_placed` | Counter | `pickup`; increment once after an order is built successfully. |
| `orders_rejected` | Counter | `reason`: `invalid_json` or `validation`; increment on HTTP 400 paths. |
| `order_value_cents` | Histogram | `pickup`; record the accepted order's integer `totalCents`. |
| `server_errors` | Counter | `route`; increment when `withTelemetry` catches an unexpected handler exception. |
| `health_checks` | Counter | No instrument-specific attributes; increment per `GET /api/health`. |

Current pickup values are `asap`, `in-15`, `in-30`, `in-45`, and `in-60`. Current wrapped routes are `/api/orders` and `/api/health`. There are no customer IDs, names, order IDs, product IDs, or raw request values in metric dimensions.

The histogram supplies explicit bucket-boundary advice in cents:

```text
300, 500, 1000, 1500, 2000, 3000, 5000, 10000
```

The Grafana queries expect Prometheus translation to counters `orders_placed_total`, `orders_rejected_total`, `server_errors_total`, and `health_checks_total`, plus histogram series `order_value_cents_bucket`, `order_value_cents_sum`, and `order_value_cents_count`. Histogram `le` is an exported bucket label, not an application-recorded attribute.

## Export and identity

`server/instrumentation-node.ts` installs `OTLPMetricExporter` through a `PeriodicExportingMetricReader` only when `OTEL_EXPORTER_OTLP_ENDPOINT` is set. Its interval is **30,000 ms**. `OTEL_EXPORTER_OTLP_HEADERS` supplies exporter authentication/configuration.

Every wrapped request schedules `flushTelemetry()` using Vercel `waitUntil` in `finally`. That function invokes the provider's optional `forceFlush` and the already-created PostHog client's flush using `Promise.allSettled`. It does not propagate those flush rejections, nor does it provide durable delivery/retry storage. Periodic export alone is insufficient protection against a serverless instance freezing.

Resource identity includes `service.name=bean-and-byte`, repository namespace, short commit version, environment, and a random per-instance UUID. See [tracing](tracing.md) for exact resource keys and fallback values. The dashboard discovers translated `job` values through `target_info{service_name="bean-and-byte"}`; a deployment typically appears as `<repo>/bean-and-byte`. Verify backend translation if data is absent.

## Dashboard behavior

`observability/grafana/dashboard.json` defines `/d/bean-and-byte`, refresh `1m`, default range `now-24h` to `now`, a Prometheus datasource selector matching names ending `-prom`, and a multi-select deployment variable.

Panels show:

- Accepted/rejected counts over the selected range.
- Average order value: histogram sum increase divided by count increase, then `/ 100` for dollars.
- Server-error count with `or vector(0)`.
- Orders and reason-grouped rejections per five minutes.
- p50/p95 order value from 15-minute bucket rates, converted to dollars.
- Route-grouped errors and health requests per five minutes.
- A separate Pyroscope CPU flamegraph.

An empty average/quantile can reflect no observations. The error panel's zero fallback is not an availability guarantee. Dashboard colors are not alert evaluation conditions; see [alerting](alerting.md). No request-latency histogram or formal SLO is defined.

## Modification entrypoints and sources

Add instruments and record helpers in `server/telemetry.ts`, call them at server boundaries, and use bounded dimensions. Update queries and provisioning JSON together. Keep business calculations in pure `lib/` code.

| Repository path | Responsibility |
| --- | --- |
| `server/telemetry.ts` | Instruments, record helpers, wrapper, flushing. |
| `server/instrumentation-node.ts` | Metric reader and resource configuration. |
| `observability/grafana/dashboard.json` | Exact panels and PromQL. |
| `app/api/orders/route.ts`, `app/api/health/route.ts` | Recording call sites. |
