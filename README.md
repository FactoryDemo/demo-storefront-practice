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

## Automated review

Pull requests in this repository are automatically reviewed by Factory Droid.
