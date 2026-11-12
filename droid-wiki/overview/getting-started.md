# Getting started

Use Node.js 20 and npm for the closest match to CI. The app requires no login, database, credentials, or environment file (`docs/runbooks/local-development.md`, `.devcontainer/devcontainer.json`, `.github/workflows/ci.yml`).

## Install and run

Run these commands from the repository root:

```bash
npm ci
npm run dev
```

Open http://localhost:3000. `npm ci` uses `package-lock.json` and runs the Husky setup in `package.json`. The dev container is an alternative Node 20 environment and runs the same install command.

Check the service from another terminal:

```bash
curl -i http://localhost:3000/api/health
```

Expect HTTP 200 and `{"status":"ok"}` from `app/api/health/route.ts`.

## Exercise checkout

1. Add Drip Coffee three times, then open the header cart.
2. Confirm the line and total are $9.45, not the $10.50 gross amount.
3. Add one Espresso. The total becomes $12.40.
4. Open checkout, enter a demo name, select a pickup slot, and place the order.
5. Confirm the order number, $12.40 total, and empty cart.

These values come from `lib/products.ts` and `lib/pricing.ts`; the server response is covered in `tests/orders.test.ts`, and the browser scenario is in `e2e/storefront.spec.ts`. Nothing is charged.

For a second checkout, enter `save10` in the cart or checkout promo field. Three Drip Coffees plus one Espresso now cost $12.10: the coffee line keeps its bulk price, and only the full-price Espresso receives the promo discount. Reloading restores both quantities and the code; clearing the field removes the promo, and placing an order clears both cart and code (`components/PromoCodeField.tsx`, `components/CartProvider.tsx`, `lib/promotions.ts`, `e2e/storefront.spec.ts`). Unknown codes show an error and must be corrected or cleared before the server accepts the order (`lib/orders.ts`).

## Required checks

```bash
npm test
npm run typecheck
npm run lint
npm run format:check
```

`AGENTS.md` requires all four before a change is done. For a production build and browser checks:

```bash
npm run build
npm run start
# For the automated browser suite, stop a stale server first:
npx playwright install chromium
npm run test:e2e
```

`playwright.config.ts` normally builds and starts the app itself. Outside CI it can reuse a server already listening on port 3000. See [testing](../how-to-contribute/testing.md).

## Optional configuration

`.env.example` lists optional telemetry variables. Only copy it to a local ignored environment file if you intend to send telemetry. Never commit real credentials (`AGENTS.md`).

For port conflicts, stale build output, lockfile drift, or missing browsers, use [debugging](../how-to-contribute/debugging.md). For variable meanings, see [configuration](../reference/configuration.md).
