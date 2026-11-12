# Features
Active contributors: **nicolasschmidt2001**.

## Purpose

Bean & Byte connects a static coffee menu to a browser cart and mock pickup checkout. Optional analytics observes that journey without being required to complete it. Start with [architecture](../overview/architecture.md) for the application-wide boundaries.

| Capability | Main boundary | Deep dive |
| --- | --- | --- |
| Catalog | Static products and categories become server-rendered sections with interactive cards. | [Catalog](catalog.md) |
| Cart and pricing | Shared browser state persists quantities and a promo code; pure pricing applies bulk discounts, then SAVE10 to full-price lines. | [Cart and pricing](cart-pricing.md) |
| Pickup checkout | An HTTP route validates quantities and re-prices the order; the browser remembers its latest confirmation. | [Checkout](checkout.md) |
| Analytics and flags | Typed event names, safe property builders, lazy PostHog loading, and an off-by-default announcement. | [Analytics](analytics.md) |

## Key source files

| Repository path | Role |
| --- | --- |
| `app/layout.tsx` | Mounts the shared cart, drawer, header, and analytics bootstrap. |
| `app/page.tsx`, `components/Storefront.tsx`, `lib/products.ts` | Menu entrypoint, layout, and catalog. |
| `components/CartProvider.tsx`, `lib/cart.ts`, `lib/pricing.ts` | Cart/promo persistence, quantity updates, and totals. |
| `lib/promotions.ts`, `components/PromoCodeField.tsx` | SAVE10 eligibility/rounding and shared drawer/checkout input. |
| `components/Checkout.tsx`, `app/api/orders/route.ts`, `lib/orders.ts` | Browser submission and authoritative order validation/pricing. |
| `components/lastOrder.ts`, `components/OrderConfirmation.tsx` | Same-tab last-order display, not server order history. |
| `lib/analytics.ts`, `components/posthog.ts` | Event/flag contracts and browser transport. |
| `tests/promotions.test.ts`, `tests/pricing.test.ts`, `tests/orders.test.ts`, `tests/analytics.test.ts`, `e2e/storefront.spec.ts` | Promotion rules, authoritative repricing, event totals, and shopping regressions. |

## Scoped maintenance snapshot

At `origin/main` commit [`e0462e9`](https://github.com/FactoryDemo/demo-storefront-practice/commit/e0462e94b0cfa8c89bd419994343526e3800fc53), the union of the four deep dives' explicitly listed scopes is **24 source files and 7 test files**, a **7/24 = 0.29 test-file/source-file ratio**. Shared `components/PromoCodeField.tsx` and `e2e/storefront.spec.ts` are each counted once. Assets, styling, shared layout, and server telemetry dependencies are excluded. This is a file-count measure, not coverage.

The unique-human bus-factor proxy is **1**: `.github/CODEOWNERS` names nicolasschmidt2001, and scoped default-branch log/blame identifies the same person. Nicolas Schmidt's email aliases are collapsed; bots are excluded. Each deep dive states its own scope and limitations.

Orders are pretend: no payment, database, or retrieval API. SAVE10 takes 10% off full-price lines after bulk pricing, without discounting bulk-priced lines again (FIN-212). The server validates the code and computes the final total from catalog prices: three Drip Coffees plus one Espresso cost $12.40 without a code or $12.10 with SAVE10. See [security boundaries](../security.md) before considering production use.

## Modification entrypoints

Start in `lib/pricing.ts` for pricing orchestration, `lib/promotions.ts` for SAVE10 eligibility and rounding, and `components/CartProvider.tsx` for shared state. Checkout validation belongs in `lib/orders.ts`; event/property contracts belong in `lib/analytics.ts`. Follow the linked deep dives for their tests and integration limits.
