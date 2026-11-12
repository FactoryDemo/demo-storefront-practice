# Alerting

Grafana evaluates two provisioned rules; a separate GitHub workflow polls Grafana and PostHog to file issues. Neither mechanism defines a formal SLO or an escalation channel. For signal interpretation, start with [metrics](metrics.md).

## Exact Grafana conditions

`observability/grafana/alert-rules.json` defines folder/group UID/title `bean-and-byte` and evaluation interval **60 seconds**.

| Rule UID / title | Instant PromQL query A | Condition B and hold |
| --- | --- | --- |
| `bb-server-errors` / Storefront server errors | `sum by (job) (increase(server_errors_total{job=~".+/bean-and-byte"}[5m]))` | Strictly `> 0`, `for: "0s"`; severity `critical`. |
| `bb-order-rejections` / Storefront order rejections high | `sum by (job) (increase(orders_rejected_total{job=~".+/bean-and-byte"}[15m]))` | Strictly `> 25`, `for: "5m"`; severity `warning`. |

Both query definitions have `relativeTimeRange` from 900 to 0 seconds, but the PromQL lookback is respectively five and fifteen minutes. Both label `service="bean-and-byte"`, set `noDataState: "OK"`, and `execErrState: "Error"`. No data therefore does not fire these rules; query execution failures enter Error state. There is no missing-health-check alert.

The JSON runbook URLs currently point to `FactoryDemo/demo-storefront`, not this repository's `FactoryDemo/demo-storefront-practice` origin. Treat that as a source caveat and navigate through [monitoring](index.md) if the external link fails.

## Provisioning

`.github/workflows/observability.yml` runs on relevant `main` pushes (`observability/**`, `scripts/grafana-sync.mjs`) or manual dispatch. With Grafana URL/token, `scripts/grafana-sync.mjs` ensures the folder by UID, overwrites the dashboard by UID, chooses the first Prometheus datasource whose name ends `-prom`, resolves `__PROMETHEUS__`, and PUTs the complete rule group. Missing credentials skip; no matching datasource fails. The provenance header keeps rules UI-editable, but later synchronization reapplies repository JSON. Review rule/dashboard edits together before merging.

## Polling and source selection

`.github/workflows/error-issues.yml` runs `*/30 * * * *` or manually with `lookback_hours`, uses concurrency group `error-issues`, and grants `issues: write`. PostHog runs first; its failure prevents the normal subsequent Grafana step. Missing source credentials make that script skip successfully.

PostHog defaults to a 24-hour lookback, parses it as an integer, falls back to 24 for zero/invalid input, and clamps to 1–168 hours. One HogQL query selects `$exception` events for the sanitized repository slug and `production`/`preview`, groups non-null `$exception_issue_id`, and returns the **20 highest occurrence counts**, without pagination. Issue content includes counts, sessions, first/last timestamps, latest release/location, and up to six stack frames.

Grafana fetches the current alerts endpoint once, without pagination or historical lookback. It accepts only state `Alerting`, service `bean-and-byte`, and jobs starting `<repository-slug>/`. A short-lived alert that resolves between polls may never produce an issue.

## Deduplication and reopening

PostHog markers are `posthog-issue:<issueId>` under label `error-tracking`; new issues also receive `bug`. Grafana markers are `grafana-alert:<alertname>:<job>` under `alert`, with an additional severity label. These hidden body markers, not titles, are the identity.

`scripts/lib/github-issues.mjs` searches open and closed labeled issues, up to **10 pages × 100**. A match beyond that cap, a removed label, or an edited marker can cause duplication. Open issues are left unchanged, not refreshed or repeatedly commented.

A closed issue reopens and receives a comment only when the supplied timestamp is strictly later than `closed_at`: PostHog uses latest occurrence time; Grafana uses `activeAt`. Closing an issue during one continuing alert therefore does not reopen it merely because it remains firing. Recovery does not automatically close issues. The helper tolerates HTTP 422 generally, not only label-already-exists errors.

For deployment correlation, see [deployment](../deployment.md); protect credentials and exception content as described in [security](../security.md).

## Key source files

| Repository path | Responsibility |
| --- | --- |
| `observability/grafana/alert-rules.json` | Thresholds, holds, states, and labels. |
| `scripts/grafana-sync.mjs` | Dashboard/rule provisioning. |
| `scripts/grafana-alert-issues.mjs`, `scripts/posthog-error-issues.mjs` | Source filters and issue bodies. |
| `scripts/lib/github-issues.mjs` | Marker lookup and reopen policy. |
| `.github/workflows/error-issues.yml`, `.github/workflows/observability.yml` | Polling and provisioning triggers. |
