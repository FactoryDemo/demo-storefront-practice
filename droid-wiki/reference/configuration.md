# Configuration
Active contributors: **nicolasschmidt2001**.

Bean & Byte runs without application credentials. `.env.example` is the template for optional local telemetry; never commit populated environment files. No payment, database, or authentication configuration exists. Keep application runtime settings separate from GitHub Actions secrets and operational scripts.

## Application runtime and browser build

| Variable | Purpose and unset behavior | Source |
| --- | --- | --- |
| `NEXT_PUBLIC_POSTHOG_KEY` | Public PostHog **project** key, intentionally included in the browser bundle. Without it, browser analytics are not loaded and server PostHog capture is disabled. | `components/posthog.ts`, `server/telemetry.ts` |
| `NEXT_PUBLIC_POSTHOG_HOST` | Browser ingestion host defaults to `https://us.i.posthog.com`; the server passes the optional value to its SDK. | `components/posthog.ts`, `server/telemetry.ts` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP/HTTP export destination; presence enables the custom periodic metrics reader at 30-second intervals. | `server/instrumentation-node.ts` |
| `OTEL_EXPORTER_OTLP_HEADERS` | Private exporter authorization headers, consumed by OpenTelemetry; never expose through a public variable. | `.env.example`, `server/instrumentation-node.ts` |
| `PYROSCOPE_SERVER_ADDRESS` | Enables optional continuous profiling; absent means profiling is not started. | `server/instrumentation-node.ts` |
| `PYROSCOPE_BASIC_AUTH_USER`, `PYROSCOPE_BASIC_AUTH_PASSWORD` | Private profiler authentication. Startup failure logs a warning rather than preventing the app from running. | `server/instrumentation-node.ts` |
| `NEXT_RUNTIME` | Framework-provided selector: `nodejs` loads Node instrumentation; other runtimes register basic OTel instrumentation. Not an application feature switch. | `instrumentation.ts` |

`NEXT_PUBLIC_*` values used by client code are build-time public configuration, not a secret store. The public project key is **not** the PostHog personal API key used below. OTLP headers, profiler passwords, and personal/service-account tokens must remain private.

Flags are remote PostHog data, not environment variables: the sole key is `menu-announcement`, initially false until PostHog answers (`lib/analytics.ts`, `components/posthog.ts`). Session recording is disabled; the logger's default minimum level is `info` through `createLogger()` options, not a `LOG_LEVEL` environment setting (`server/logger.ts`). See [analytics](../features/analytics.md) and [monitoring](../how-to-monitor/index.md).

## Release identity

`server/release.ts` reads `VERCEL_GIT_REPO_SLUG`, `VERCEL_GIT_COMMIT_SHA`, and `VERCEL_ENV`. Browser registration reads the corresponding `NEXT_PUBLIC_VERCEL_GIT_REPO_SLUG`, `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA`, and `NEXT_PUBLIC_VERCEL_ENV` (`components/posthog.ts`).

Both use `releaseProperties` in `lib/analytics.ts`: `appRepo` defaults to `local`, `appVersion` to `dev` (otherwise the first seven commit characters), and `appEnvironment` to `development`. Service name is `bean-and-byte`; local telemetry therefore uses namespace `local`, not the repository's deployed slug. These are telemetry tags, not GitHub release tags.

## GitHub Actions and operational scripts

These are **not required by the storefront runtime**. Configuring local application telemetry does not configure Actions.

| Setting | Actions location | Consumer |
| --- | --- | --- |
| `GRAFANA_URL`, `GRAFANA_SERVICE_ACCOUNT_TOKEN` | Secrets, including the URL | Grafana provisioning, firing-alert polling, deploy annotations in `.github/workflows/observability.yml`, `.github/workflows/error-issues.yml`, `.github/workflows/deploy.yml`. |
| `POSTHOG_PERSONAL_API_KEY` | Secret | Error queries and deploy annotations; annotation writes require the appropriate scope. |
| `POSTHOG_PROJECT_ID`, `POSTHOG_HOST` | Repository variables | PostHog management API; host defaults to `https://us.posthog.com`, distinct from ingestion. |
| `PRODUCTION_URL` | Repository variable | GitHub deployment environment URL; falls back to status-event `TARGET_URL`. |
| `GITHUB_TOKEN` / `GH_TOKEN` | Built-in token; workflow maps the CLI name | Issue writes, deployment recording, and GitHub releases; job permissions govern access. |
| `FACTORY_API_KEY` | Secret | Droid review, mention handling, and wiki generation. |
| `FACTORY_WIKI_PR_TOKEN` | Optional secret | Wiki publish token; otherwise uses built-in `github.token`, whose PRs do not trigger other workflows. |
| `FINANCE_RULES` | Secret | Required private finance-rule archive in `.github/workflows/ci.yml`; unavailable in source. |

The Factory settings are declared in `.github/workflows/droid.yml`, `.github/workflows/droid-tag.yml`, and `.github/workflows/droid-wiki-refresh.yml`. The last also fixes workflow-only `WIKI_BRANCH` to `factory/droid-wiki`.

`scripts/posthog-error-issues.mjs` accepts script-only `LOOKBACK_HOURS`, default 24, parsed and clamped to 1–168; the workflow's `lookback_hours` input feeds it. Issue scripts require runner-provided `GITHUB_REPOSITORY` and `GITHUB_TOKEN`; `scripts/lib/github-issues.mjs` fixes its API base to `https://api.github.com` (no `GITHUB_API_URL` override). Missing provider credentials skip the relevant scripts, not the private finance check. Deploy workflow `SHA` and `TARGET_URL` come from the status event.

For permissions, release workflow behavior, and secret-handling limitations, see [deployment](../deployment.md) and [security](../security.md).
