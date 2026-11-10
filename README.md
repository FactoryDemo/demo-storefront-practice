# ☕ Bean & Byte — Demo Storefront

A small specialty-coffee storefront: a Next.js menu, cart, and mock pickup
checkout backed by a pure TypeScript pricing core and a fast Vitest suite.

It has just enough surface area to be worth reading — pricing rules, edge
cases, a checkout API, tests, CI — and nothing else to distract.

## What's inside

- `app/` — App Router pages (menu, `/checkout`, `/orders/[id]`), API routes
  (`/api/orders`, `/api/health`), and global styles
- `components/` — the storefront UI: menu, product cards, cart drawer,
  checkout, and order confirmation
- `lib/` — pure, well-tested business logic:
  - `pricing.ts` — line and cart totals with a per-line bulk discount
    (buy 3+ of one item, that line is 10% off)
  - `products.ts` — the catalog and its categories
  - `cart.ts` — cart quantity updates
  - `orders.ts` — checkout validation and order pricing
  - `currency.ts` — cents to display strings
- `public/products/` — product photos
- `tests/` — Vitest unit tests covering the pricing rules, boundaries,
  formatting, cart updates, and order validation
- `e2e/` — Playwright tests that browse, fill the cart, and check out

## Running it

```bash
npm ci
npm run dev        # http://localhost:3000
npm test           # the unit suite
npm run typecheck  # strict TypeScript check
npm run test:e2e   # browser tests against a production build
```

CI runs install, typecheck, and tests on every push and pull request.

## The pricing rule

All money is integer cents. A line of 3 or more identical items gets 10%
off that line, rounded to the nearest cent. Mixed carts can hold
discounted and undiscounted lines at once — `tests/pricing.test.ts` pins
the behavior down. Checkout re-prices every order on the server, so the
browser never decides what an order costs.

Enter **SAVE10** in the cart for 10% off lines without a bulk discount.
Promo codes never stack with bulk pricing on the same line (FIN-212).
Codes ignore case and surrounding spaces. The promo discount is rounded
once over the eligible subtotal to the nearest cent (half cents round up).
For example, three Drip Coffees plus one Espresso cost $12.40 after bulk
pricing, or **$12.10** with SAVE10, which saves $0.30 on the Espresso only.
The code stays with the cart through reloads and checkout and clears after
placing an order.

## Observability

Deployed on Vercel, the storefront reports product analytics, feature
flags, and errors to PostHog, and traces, metrics, and profiles to Grafana
Cloud. Deploys are recorded by the Deploy workflow and marked on the
dashboard, and new errors and firing alerts become GitHub issues. See
`docs/runbooks/observability.md`. Locally, all of it stays off unless you
set the variables in `.env.example`.

## Automated review

Pull requests in this repository are automatically reviewed by Factory Droid.
