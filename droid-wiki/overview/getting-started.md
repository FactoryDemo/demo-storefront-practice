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

Reloading restores cart quantities, and placing an order clears the cart (`components/CartProvider.tsx`, `components/Checkout.tsx`, `e2e/storefront.spec.ts`).

For the optional promo flow, apply ` save10 ` in the nonempty cart drawer before checkout. It becomes SAVE10, and the mixed cart above totals $12.10: the bulk coffee line stays $9.45, while the Espresso receives a rounded 30-cent discount. Removing the code restores $12.40. The code persists across reloads and is cleared after successful checkout (`components/CartDrawer.tsx`, `components/CartProvider.tsx`, `components/Checkout.tsx`, `lib/pricing.ts`). Existing unit tests cover the promo arithmetic and server validation; the six existing browser scenarios cover the no-code journey, not promo interactions (`tests/pricing.test.ts`, `tests/orders.test.ts`, `e2e/storefront.spec.ts`).

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
