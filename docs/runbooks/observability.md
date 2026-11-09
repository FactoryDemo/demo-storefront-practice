# Runbook: observability

Where to look when the deployed storefront misbehaves, and how the
telemetry is wired. None of this is needed to run the app locally.

## Where the signals go

| Signal | Tool | Where to look |
| --- | --- | --- |
| Product analytics (`product_added`, `cart_opened`, `checkout_started`, `order_placed`, `order_failed`, pageviews) | PostHog | Product analytics, filter on `appRepo` |
| Feature flags | PostHog | Feature flags, e.g. `menu-announcement` |
| Errors (browser, React error boundaries, API routes) | PostHog error tracking | Error tracking; each issue links the session |
| Traces | Grafana Cloud Traces (Tempo) | Explore, service `bean-and-byte` |
| Metrics | Grafana Cloud Metrics (Prometheus) | Dashboard **Bean & Byte storefront** (`/d/bean-and-byte`) |
| Profiles | Grafana Cloud Profiles (Pyroscope) | Same dashboard, or Explore > Profiles, service `bean-and-byte` |
| Deploys | GitHub deployments, Grafana and PostHog annotations | Repo **Deployments** tab; markers on the dashboard |
| Logs | Vercel function logs | JSON lines from `server/logger.ts` |

Every event, error, metric series, and profile carries the repo
(`appRepo`, or the `job` label such as `demo-storefront/bean-and-byte`), the
short commit, and the environment (`production`, `preview`, or
`development` locally).

## When something breaks

1. **An issue labeled `error-tracking` or `alert` was opened.** The
   [Error issues workflow](../../.github/workflows/error-issues.yml) runs
   every 30 minutes. It files one issue per new PostHog error and per firing
   Grafana alert, and reopens a closed issue if the problem comes back. The
   issue names the version; compare it with the previous run of the
   [Deploy workflow](../../.github/workflows/deploy.yml).
2. **Open the dashboard.** A spike that starts at a deploy marker points at
   that deploy. `Server errors` above zero means an API route threw; the
   same error is in PostHog with its stack and session.
3. **Follow one request.** Copy the `traceId` from the PostHog exception
   into Grafana Explore (Tempo) to see the whole request.
4. **Slow, not broken?** Open the CPU profile panel for the time range.
5. **Roll back** from the Vercel dashboard (Instant Rollback) if the last
   deploy is the cause, then fix forward on a branch.

## Alerts

Rules live in `observability/grafana/alert-rules.json`:

- **Storefront server errors** (critical): any unhandled API error in
  5 minutes.
- **Storefront order rejections high** (warning): more than 25 rejected
  orders in 15 minutes, for 5 minutes.

Change the JSON, merge to `main`, and the
[Observability workflow](../../.github/workflows/observability.yml) applies
it with `scripts/grafana-sync.mjs` (the dashboard in
`observability/grafana/dashboard.json` too). To apply by hand:
`GRAFANA_URL=... GRAFANA_SERVICE_ACCOUNT_TOKEN=... node scripts/grafana-sync.mjs`.

## Feature flags

Flag keys live in `FEATURE_FLAGS` in `lib/analytics.ts`, and
`useFeatureFlag(key)` reads one in a client component. A flag is off until
PostHog answers, and stays off when PostHog is not configured, so the
default experience must work with every flag off. Create the flag in
PostHog with the same key before rolling it out.

## Configuration

Variable names and placeholders are in `.env.example`. Where each value is
set:

- **Vercel project** (production and preview): `NEXT_PUBLIC_POSTHOG_KEY`,
  `NEXT_PUBLIC_POSTHOG_HOST`, `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_EXPORTER_OTLP_HEADERS`, `PYROSCOPE_SERVER_ADDRESS`,
  `PYROSCOPE_BASIC_AUTH_USER`, `PYROSCOPE_BASIC_AUTH_PASSWORD`.
- **GitHub Actions secrets**: `GRAFANA_URL`,
  `GRAFANA_SERVICE_ACCOUNT_TOKEN`, `POSTHOG_PERSONAL_API_KEY`.
- **GitHub Actions variables**: `POSTHOG_PROJECT_ID`, `POSTHOG_HOST`,
  `PRODUCTION_URL`.
