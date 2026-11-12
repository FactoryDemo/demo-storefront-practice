# Dependencies
Active contributors: **nicolasschmidt2001**.

`package.json` declares **30 direct packages: 11 runtime and 19 development**. Counts are declaration keys, not transitive packages, installed files, or browser bundle contents. This private single-package project uses npm and a version-3 `package-lock.json`; `npm ci` reproduces that lock rather than selecting the newest version allowed by each declaration.

## Runtime declarations and resolved versions

The declaration column is copied from `package.json`; the resolved column is the exact root `node_modules/<name>` entry in `package-lock.json` at `902a299`. A `^` or `~` declaration is not an exact pin.

| Package | Declaration | Lockfile resolved |
| --- | --- | --- |
| `next` | `14.2.35` | `14.2.35` |
| `react` | `^18.3.1` | `18.3.1` |
| `react-dom` | `^18.3.1` | `18.3.1` |
| `@opentelemetry/api` | `~1.9.0` | `1.9.1` |
| `@opentelemetry/exporter-metrics-otlp-proto` | `^0.223.0` | `0.223.0` |
| `@opentelemetry/sdk-metrics` | `^2.12.0` | `2.12.0` |
| `@pyroscope/nodejs` | `^0.6.5` | `0.6.5` |
| `@vercel/functions` | `^3.11.0` | `3.11.0` |
| `@vercel/otel` | `^2.3.0` | `2.3.0` |
| `posthog-js` | `^1.447.4` | `1.447.4` |
| `posthog-node` | `^5.63.2` | `5.63.2` |

Next/React provide the App Router storefront. PostHog separates browser product analytics/flags from server exception capture (`components/posthog.ts`, `server/telemetry.ts`). OTel packages export traces and metrics; Vercel's functions helper schedules telemetry flushes. Pyroscope provides optional native profiling (`server/instrumentation-node.ts`).

“Runtime dependency” does not mean “always sending telemetry” or “included in the initial client bundle.” Browser PostHog is dynamically imported only with a public project key; profiling starts only with its server address. See [configuration](configuration.md) and [architecture](../overview/architecture.md).

## Development declarations and resolved versions

| Package | Declaration | Lockfile resolved |
| --- | --- | --- |
| `@playwright/test` | `^1.64.1` | `1.64.1` |
| `@size-limit/file` | `^12.1.0` | `12.1.0` |
| `@types/node` | `^20.14.0` | `20.19.43` |
| `@types/react` | `^18.3.3` | `18.3.31` |
| `@types/react-dom` | `^18.3.0` | `18.3.7` |
| `@typescript-eslint/eslint-plugin` | `^8.72.1` | `8.72.1` |
| `@typescript-eslint/parser` | `^8.72.1` | `8.72.1` |
| `@vitest/coverage-v8` | `2.1.9` | `2.1.9` |
| `eslint` | `^8.57.1` | `8.57.1` |
| `eslint-config-next` | `14.2.35` | `14.2.35` |
| `husky` | `^9.1.7` | `9.1.7` |
| `jscpd` | `^5.4.2` | `5.4.2` |
| `knip` | `^6.44.1` | `6.44.1` |
| `lint-staged` | `^16.4.0` | `16.4.0` |
| `prettier` | `^3.9.10` | `3.9.10` |
| `size-limit` | `^12.1.0` | `12.1.0` |
| `typedoc` | `^0.28.20` | `0.28.20` |
| `typescript` | `^5.5.4` | `5.9.3` |
| `vitest` | `^2.0.5` | `2.1.9` |

These cover TypeScript/types; ESLint/Prettier and staged hooks; Vitest/coverage and Playwright; and advisory analysis/documentation/bundle tooling. The coverage provider is exact-pinned to `2.1.9`, matching locked Vitest, while the Vitest declaration remains a range. Next and `eslint-config-next` share exact `14.2.35` declarations. Command details belong in [tooling](../how-to-contribute/tooling.md) and [testing](../how-to-contribute/testing.md).

## Compatibility and update policy

`.github/dependabot.yml` schedules npm and GitHub Actions updates monthly, grouped by ecosystem, with one open PR per ecosystem and a seven-day cooldown. Major-version updates are ignored. Three additional exclusions document concrete compatibility constraints:

- `@opentelemetry/api >=1.10.0`: resources/sdk-logs peers require API below 1.10.0.
- Metrics exporter `>=0.300.0`: `@vercel/otel` requires an exporter below that boundary.
- `@pyroscope/nodejs >=0.7.0`: requires Node at least 22.23.4, whereas CI uses Node 20 (`.github/workflows/ci.yml`).

These constraints explain compatibility ceilings, not a guarantee of security or permanent support. `next.config.mjs` externalizes Pyroscope and transitive `@datadog/pprof`, and explicitly traces Linux-x64 native profiler binaries plus loader/support files. Those traced transitive packages are **not** extra direct runtime declarations. Changing profiler/runtime versions also requires checking deployment packaging.

## Security snapshot and safe follow-up

The existing read-only audit reported **20 vulnerable package entries: 11 moderate, five high, four critical**, including Next, Vitest, its coverage provider, and Tinypool. See [dependency maintenance](../cleanup-opportunities.md) for date, advisory scope, and remediation cautions. This is not a claim that each entry is exploitable, nor that the dependency set is vulnerability-free or current.

Review fixes against compatibility constraints, update manifest and lock together, and run required checks plus relevant build/browser validation. Do not infer package freshness from version numbers or blindly force audit upgrades.
