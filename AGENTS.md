# AGENTS.md

## Project

Bean & Byte is a small demo storefront: a Next.js (App Router) catalog and
cart with a pure TypeScript pricing core. It exists to be worked on by
agents, so keep the code plain, typed, and well tested. See
`docs/architecture.md` for how the pieces fit together and
`docs/runbooks/local-development.md` when local setup breaks.

## Commands

- `npm ci` — install dependencies
- `npm test` — run the test suite (Vitest, non-interactive)
- `npm run typecheck` — TypeScript check without emitting
- `npm run lint` — run ESLint (`next lint`, config in `.eslintrc.json`)
- `npm run format` — format files with Prettier
- `npm run format:check` — check formatting without writing changes
- `npm run dev` — start the dev server at http://localhost:3000
- `npm run build` — production build
- `npm run prepare` — install the Husky pre-commit hook (runs on `npm ci`; lint-staged runs Prettier and ESLint fixes on staged files, never tests)
- `npm run test:ci` — tests with coverage thresholds, retries, and a JUnit report (what the Quality workflow runs)
- `npm run test:e2e` — Playwright end-to-end tests; builds and starts the app on port 3000 (first run: `npx playwright install chromium`)
- `npm run knip` — report unused files, exports, and dependencies
- `npm run dup:check` — report duplicated code (jscpd)
- `npm run size` — report client bundle size against `.size-limit.json` (run `npm run build` first)
- `npm run todo:report` — list TODO/FIXME/HACK comments in source
- `npm run docs:generate` — generate TypeDoc API docs for lib/ into docs/api/
- `npm run agents:check` — verify the npm commands and file paths in this file exist

Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run format:check`
before considering any change done.

## Trying the app

No login, accounts, or external services are needed.

1. `npm ci`, then `npm run dev`.
2. Open http://localhost:3000. The catalog shows each product with its price.
3. Click **Add to cart** on one item three times, e.g. Drip Coffee ($3.50).
4. Confirm that cart line is 10% off: 3 × $3.50 = $10.50, shown as $9.45.
5. Check that the cart **Total** is the sum of the line totals.

The `.factory/skills/storefront-qa/SKILL.md` skill covers the same steps in
more detail, including the `/api/health` check.

## Conventions

- **Money is integer cents.** No floats, no `Number` math on currency. All
  totals flow through `lib/pricing.ts` and display through
  `lib/currency.ts`.
- `lib/` is pure logic with no React and no I/O; UI lives in `components/`
  and `app/`. Keep it that way.
- Tests live in `tests/` and mirror the module they cover
  (`tests/pricing.test.ts` covers `lib/pricing.ts`). Cover edge cases:
  zero quantities, boundaries (e.g. the bulk discount threshold), and
  rounding.
- Prefer named exports and explicit types over cleverness. TypeScript
  strict mode is on; do not silence it.
- Commit messages: one line, imperative, lowercase, no prefix. Example:
  `apply bulk discount per cart line, not per cart`.
- `lib/` stays pure; server-only code with I/O (such as the JSON logger in
  `server/logger.ts`) lives in `server/`. Log from server code through that
  logger so sensitive fields are redacted.

### Naming

`@typescript-eslint/naming-convention` in `.eslintrc.json` enforces the
identifier formats below; ids and slugs in data follow them by convention.

- **camelCase** for functions, variables, parameters, and object
  properties: `calculateLineTotal`, `priceCents`.
- **PascalCase** for types and React components: `CartItem`,
  `Storefront`.
- **SCREAMING_SNAKE_CASE** for module-level constants:
  `BULK_DISCOUNT_THRESHOLD`, `PRODUCTS`.
- **kebab-case** for ids and slugs in data, CSS classes, and branch names:
  product id `cold-brew`, class `product-card`.
- Route handlers export HTTP method names (`GET`, `POST`) as Next.js
  requires.

ESLint also caps function complexity at 10 and files at 400 lines.

## Pull requests

- Branch from `main`, name branches `feature/<slug>`.
- The PR description states what changed, why, and which tests cover it.
- CI must be green before requesting review.
- Never commit `.env*` files or secrets.
