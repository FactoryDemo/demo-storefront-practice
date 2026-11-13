# Bean & Byte

Bean & Byte is a demo coffee storefront for practicing software changes. It has a menu, a persistent browser cart, and a mock pickup checkout, backed by a small TypeScript pricing core (`README.md`, `lib/pricing.ts`).

## What it does

Customers browse 13 products in four categories, add quantities, and place a pickup order. Buying three or more of one product discounts that line by 10%. Three Drip Coffees cost $9.45; adding an Espresso brings the total to $12.40 (`lib/products.ts`, `lib/pricing.ts`, `tests/orders.test.ts`).

There are no live promo codes or promo fields in the cart or checkout. The pricing core retains an optional promotion hook, but its registry is empty (`lib/promotions.ts`, `lib/pricing.ts`, `components/CartDrawer.tsx`, `components/Checkout.tsx`). [Lore](../lore.md) records the promotion rehearsals and reversions.

Orders are pretend. There is no payment processor, account system, database, or server-side order history. The confirmation reads the most recent order saved in the same browser tab (`app/api/orders/route.ts`, `components/lastOrder.ts`, `components/OrderConfirmation.tsx`).

## Start here

- [Getting started](getting-started.md): install and run without credentials.
- [Architecture](architecture.md): browser state, pure business logic, and server routes.
- [Features](../features/index.md): catalog, cart pricing, pickup checkout, and analytics.
- [Contribution guide](../how-to-contribute/index.md): conventions and required checks.
- [API](../api.md): health and order request contracts.
- [Monitoring](../how-to-monitor/index.md): optional PostHog and Grafana integrations.
- [Reference](../reference/index.md): configuration, types, and dependencies.

## Repository map

| Path | Responsibility |
| --- | --- |
| `app/` | App Router pages, API routes, error boundaries, and styles |
| `components/` | Menu, cart, checkout, confirmation, browser storage, and analytics |
| `lib/` | Pure catalog, quantity updates, pricing, order validation, and event properties |
| `server/` | Structured logging, telemetry, and release identity |
| `tests/`, `e2e/` | Vitest unit tests and Playwright browser/API scenarios |
| `scripts/`, `observability/grafana/` | Quality reporting and operational automation |
| `.github/workflows/` | Checks, reviews, deployments, alerts, releases, and wiki refresh |

The source rules live in `AGENTS.md`. Existing explanations and incident steps live in `docs/architecture.md` and `docs/runbooks/observability.md`.
