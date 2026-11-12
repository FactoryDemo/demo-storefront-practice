# Tooling

The project uses npm scripts for local checks and separate GitHub workflows for CI, review, and operations. `package.json` defines commands; `.github/workflows/` defines when they run and which failures block a job.

## Local tools

| Command | Purpose and configuration |
| --- | --- |
| `npm run dev`, `npm run build`, `npm run start` | Next.js development, production build, and production server (`next.config.mjs`) |
| `npm test`, `npm run test:ci` | Vitest and coverage/JUnit (`vitest.config.ts`) |
| `npm run test:e2e` | Chromium browser/API scenarios (`playwright.config.ts`) |
| `npm run typecheck` | Strict no-emit TypeScript (`tsconfig.json`) |
| `npm run lint` | Next ESLint with naming, complexity, file-length rules (`.eslintrc.json`) |
| `npm run format`, `npm run format:check` | Prettier write/check (`.prettierrc`, `.prettierignore`) |
| `npm run agents:check` | Verify npm commands and paths in `AGENTS.md` (`scripts/check-agents-md.mjs`) |
| `npm run knip` | Unused files, exports, and dependencies (`knip.json`) |
| `npm run dup:check` | jscpd source duplication report (`.jscpd.json`) |
| `npm run size` | Built client JavaScript size limits (`.size-limit.json`) |
| `npm run todo:report` | Source TODO/FIXME/HACK locations (`scripts/todo-report.mjs`) |
| `npm run docs:generate` | TypeDoc output under `docs/api/` (`typedoc.json`) |
| `npm run prepare` | Husky hook installation (`.husky/pre-commit`) |

Size analysis requires a build first. Current limits are 330 kB for all client chunks and 4 kB for the home-page chunk (`.size-limit.json`). Dependency versions and compatibility constraints are covered in [dependencies](../reference/dependencies.md).

## CI checks and reports

| Workflow | Responsibility |
| --- | --- |
| `.github/workflows/ci.yml` | Typecheck, unit tests, private Finance checkout rules |
| `.github/workflows/lint.yml` | ESLint, formatting, instruction-path checks |
| `.github/workflows/quality.yml` | Coverage gates, JUnit, coverage/test artifacts and summary |
| `.github/workflows/e2e.yml` | Production-build Playwright checks and failure artifacts |
| `.github/workflows/analysis.yml` | Advisory unused-code, duplication, debt, docs, and size reports; production build still must pass |
| `.github/workflows/dast.yml` | Scheduled/manual report-only ZAP baseline; issue writing disabled |

Most checks run on pushes to `main` and PRs. DAST runs weekly on Monday at 06:00 UTC or manually. Analysis subchecks marked `continue-on-error` are advisory; that setting does not apply to its build step.

## Reviews and documentation automation

`.github/workflows/droid.yml` runs automatic deep/security review alongside CI, not after test success. `.github/workflows/droid-tag.yml` handles PR comments mentioning `@droid`. Dependabot configuration is monthly, grouped, and excludes major updates (`.github/dependabot.yml`).

`.github/workflows/droid-wiki-refresh.yml` restores documentation from `factory/droid-wiki`, invokes `/wiki` in a read-only job, and hands Markdown plus metadata to a separate write-enabled publish job. The latter opens or updates a rolling PR against the default branch. Images and videos stay out of the artifact/commit; `droid-wiki/.wiki-meta.json` is retained for incremental runs.

Operational scripts can mutate remote dashboards or issues. Do not run `scripts/grafana-sync.mjs`, `scripts/posthog-error-issues.mjs`, or `scripts/grafana-alert-issues.mjs` as harmless local checks. Their intended workflow is documented in [deployment](../deployment.md) and [alerting](../how-to-monitor/alerting.md).
