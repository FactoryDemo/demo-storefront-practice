# Patterns and conventions

Keep the code plain, typed, and covered by tests. `AGENTS.md` defines the project rules, with strict TypeScript in `tsconfig.json` and lint enforcement in `.eslintrc.json`.

## Work from current code

Build each feature from its request and the current implementation. `AGENTS.md` prohibits reading, reusing, or reverting earlier attempts from Git history, including reverted commits, closed or merged PRs, and `Rehearsal-*` commits. Do not run `git show`, `git log -p`, or `git revert` on those attempts. Historical wiki descriptions are not implementation instructions.

## Keep boundaries explicit

- `lib/` contains pure logic, with no React and no I/O.
- `components/` and `app/` handle rendering, state, and HTTP.
- `server/` contains server-only I/O, including logging and telemetry.

Add pricing rules in `lib/pricing.ts`, then use them from the UI and `lib/orders.ts`. Do not duplicate arithmetic in a component or trust totals in an HTTP request. Currency values remain integer cents; `lib/currency.ts` handles display. The current bulk calculation uses a fractional rate and rounds the resulting line to a whole cent.

`PROMOTIONS` in `lib/promotions.ts` is empty. The optional promotion hook in `lib/pricing.ts` would pass all post-bulk lines to the callback, subtract its discount, and clamp the final total at zero. There is no current non-stacking filter or live discount callback. Adding a code requires explicit eligibility and rounding rules; do not infer them from historical SAVE10 documentation.

The cart provider owns item state and persistence; the drawer and checkout call pricing with items only (`components/CartProvider.tsx`, `components/CartDrawer.tsx`, `components/Checkout.tsx`). Unknown codes leave the pure total unchanged. `lib/orders.ts` has no promo field: extra request fields, including `promoCode`, are ignored rather than validated. Current tests cover unknown-code fallback, bulk pricing, and server repricing (`tests/pricing.test.ts`, `tests/orders.test.ts`). Any future promotion flow needs tests for both arithmetic and browser interactions in `e2e/storefront.spec.ts`.

## Types and names

Prefer named exports and explicit types. Next.js route/page export conventions still apply. `lib/types.ts` holds shared catalog and cart types; `lib/orders.ts` holds order-specific types.

| Identifier | Convention |
| --- | --- |
| Functions, variables, parameters, properties | camelCase |
| Types and React components | PascalCase |
| Module-level constants | SCREAMING_SNAKE_CASE by project convention |
| Product IDs, CSS classes, branches | kebab-case |
| HTTP handler exports | `GET`, `POST`, and other required uppercase method names |

`.eslintrc.json` allows some broader global-constant forms than the preferred style. It caps function complexity at 10 and files at 400 counted lines, excluding blank lines and comments.

## Validation and errors

Accept `unknown` at trust boundaries, then return typed validation results. `validateOrderRequest` in `lib/orders.ts` gathers field errors rather than failing at the first invalid field.

Wrap API handlers with `withTelemetry` in `server/telemetry.ts`. Expected input failures return 400; unexpected exceptions become a generic reported 500. Log through `server/logger.ts`; redaction is key-based and does not sanitize arbitrary text.

## Analytics and flags

Declare event names and flag keys in `lib/analytics.ts`; send browser events with `track` from `components/posthog.ts`. Do not include customer names or personal data in event properties. Every feature must work with all flags off. See [analytics](../features/analytics.md).

## Tests and formatting

Mirror modules in `tests/`, exercise boundaries and rounding, and use Playwright for cross-page behavior. `vitest.config.ts` runs unit tests in Node, not a DOM environment. The hook in `.husky/pre-commit` runs `lint-staged.config.mjs`, not tests.

Prettier configuration is in `.prettierrc`; `.prettierignore` excludes Markdown and several historical files. Do not reformat unrelated source. Follow the [development workflow](development-workflow.md) and [testing guide](testing.md).
