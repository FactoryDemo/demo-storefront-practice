# AGENTS.md

## Project

Bean & Byte is a small demo storefront: a Next.js (App Router) catalog and
cart with a pure TypeScript pricing core. It exists to be worked on by
agents, so keep the code plain, typed, and well tested.

## Commands

- `npm ci` — install dependencies
- `npm test` — run the test suite (Vitest, non-interactive)
- `npm run typecheck` — TypeScript check without emitting
- `npm run lint` — run ESLint (`next lint`, config in `.eslintrc.json`)
- `npm run format` — format files with Prettier
- `npm run format:check` — check formatting without writing changes
- `npm run dev` — start the dev server at http://localhost:3000
- `npm run build` — production build

Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run format:check`
before considering any change done.

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

## Pull requests

- Branch from `main`, name branches `feature/<slug>`.
- The PR description states what changed, why, and which tests cover it.
- CI must be green before requesting review.
- Never commit `.env*` files or secrets.
