# Development workflow

Use a short branch, validate locally, and make the review description explicit. The repository's required process is in `AGENTS.md`; the hook configuration is in `.husky/pre-commit` and `lint-staged.config.mjs`.

## Branch and edit

Start from `main` and create `feature/<kebab-case-slug>`. Preserve existing uncommitted work. Install with `npm ci`, then run `npm run dev` as described in [getting started](../overview/getting-started.md).

Trace the real call path before editing. For a money change, inspect `lib/pricing.ts`, its consumers in `components/`, and the server path through `lib/orders.ts`. For an API route, keep the `withTelemetry` wrapper from `server/telemetry.ts`.

Build from the request and current code, not an earlier attempt. `AGENTS.md` prohibits reading, reusing, or reverting reverted commits, closed or merged PRs, and `Rehearsal-*` commits; do not run `git show`, `git log -p`, or `git revert` on them.

Add module tests in `tests/` and update browser coverage in `e2e/storefront.spec.ts` when the change crosses page or request boundaries.

## Validate and commit

Run the four required checks:

```bash
npm test
npm run typecheck
npm run lint
npm run format:check
```

The pre-commit hook runs lint-staged, not tests. `lint-staged.config.mjs` applies ESLint fixes to staged TypeScript under `app/`, `lib/`, and `components/`, then runs Prettier on supported staged files. It serializes these tasks to avoid competing edits to the same file.

Review staged changes after formatting. Use a one-line imperative lowercase commit subject without a prefix, such as `apply bulk discount per cart line`. Never commit `.env*` files or secrets (`AGENTS.md`).

## Open the PR and stop

Target `main`. Follow `.github/pull_request_template.md`: what changed, why, and tests. State any missing local validation rather than implying CI passed.

Do not wait for, watch, or poll CI after opening the PR. If a later task asks for a failing-check fix, push that fix to the same PR, then stop again (`AGENTS.md`).

CI and review are separate workflows. The application deploys through the Vercel integration; `.github/workflows/deploy.yml` records successful deployments rather than building them. See [tooling](tooling.md) and [deployment](../deployment.md).
