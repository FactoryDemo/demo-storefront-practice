# Testing

Vitest covers the pure core and server helpers; Playwright covers menu-to-confirmation behavior and HTTP routes. Test entry points and thresholds are in `vitest.config.ts`, `playwright.config.ts`, and `package.json`.

## Unit tests

```bash
npm test
# Run one existing file:
npm test -- tests/pricing.test.ts
```

Vitest uses the Node environment and includes `tests/**/*.test.ts`. Tests mirror the modules they cover.

| Test file | What it exercises |
| --- | --- |
| `tests/pricing.test.ts` | Bulk thresholds, nonpositive quantities, mixed carts, unknown products/codes, SAVE10 normalization and rounding, catalog-wide non-stacking at quantities 3/4/99, currency display |
| `tests/promotions.test.ts` | Seven tests: normalized lookup, unknown codes, eligible-line filtering, bulk-only orders, half-cent rounding, empty orders, rounding once across eligible products |
| `tests/cart.test.ts` | Adding, incrementing, removing, counts, malformed saved data |
| `tests/orders.test.ts` | Names, pickup slots, item validation, duplicate merging, promo normalization/blank omission/invalid types, forged-total repricing, mixed-cart discounts, non-stacking after merging |
| `tests/products.test.ts` | Catalog structure and lookup behavior |
| `tests/analytics.test.ts` | Event/flag names, release tags, privacy-safe properties, promo-adjusted cart total with unchanged property keys |
| `tests/logger.test.ts` | Structured output, levels, key-based redaction, serialization |
| `tests/telemetry.test.ts` | Response passthrough, logged generic 500, unconfigured exporters |

Use fixed IDs and dates when testing `buildOrder` in `lib/orders.ts`. `tests/logger.test.ts` injects logger dependencies; `tests/telemetry.test.ts` spies on stderr and restores mocks after each test.

## Coverage and CI-only rules

```bash
npm run test:ci
```

This enables V8 coverage, retries failures twice, and writes `reports/junit.xml`. Coverage includes `lib/**/*.ts` only, not React components or `server/`. The gates are 87% statements, 86% branches, 90% functions, and 87% lines (`vitest.config.ts`).

`scripts/ci-test-summary.mjs` reads the coverage summary and JUnit report for the Quality workflow. Passing coverage is not evidence that browser state or production telemetry integrations work.

`.github/workflows/ci.yml` also requires a private `FINANCE_RULES` secret containing an encoded rules archive and Vitest configuration. Those rules are not in the repository. Do not invent their contents or claim the public unit suite substitutes for them.

## Browser and API tests

```bash
npx playwright install chromium
npm run test:e2e
```

`playwright.config.ts` uses Chromium and starts a production build on port 3000, waiting on `/api/health`. It reuses an existing server outside CI, which can accidentally test stale code. CI forbids focused tests and retains failure traces.

`e2e/storefront.spec.ts` has **nine scenarios**. The original six cover catalog rendering, discounted lines, cart reload persistence, checkout confirmation/cart clearing, order API validation/repricing, and health. Three promo scenarios cover:

- SAVE10 across cart, checkout, and confirmation; raw code persistence after reload; clearing the code after checkout.
- Quantity changes across the bulk threshold, removal of the extra discount row for bulk-only carts, unknown-code feedback, and clearing input.
- API normalization of `" save10 "`, authoritative repricing despite a supplied `totalCents: 1`, and rejection of an unknown code.

The helper waits for hydration before clicking.

The checkout scenario pins three Drip Coffees to $9.45, plus one Espresso to $12.40. It verifies the same confirmation total and empty cart. See [cart pricing](../features/cart-pricing.md) and [API](../api.md).

The promo checkout pins the same mixed cart to **$12.10**, with a **$0.30** discount only on the full-price Espresso. Public unit tests also pin the visible FIN-212 regression: three Espressos stay **797 cents** with SAVE10, including after merging repeated product entries (`tests/pricing.test.ts`, `tests/orders.test.ts`). These visible assertions do not reveal the private Finance archive or establish its full scope.

## Manual QA and gaps

`.factory/skills/storefront-qa/SKILL.md` adds a useful threshold transition: reduce Drip Coffee from three to two, see $7.00 for that line and $9.95 with Espresso, then restore three. It also checks server log privacy and health.

Existing tests do not directly mount React components or exhaust every storage failure, duplicate-request, and concurrent-interaction state. Add focused coverage when changing those paths. Do not treat this guide as a claim that all optional remote integrations were exercised.
