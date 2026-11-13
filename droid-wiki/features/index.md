# Features
Active contributors: **nicolasschmidt2001**.

## Purpose

Bean & Byte connects a static coffee menu to a browser cart and mock pickup checkout. Optional analytics observes that journey without being required to complete it. Start with [architecture](../overview/architecture.md) for the application-wide boundaries.

| Capability | Main boundary | Deep dive |
| --- | --- | --- |
| Catalog | Static products and categories become server-rendered sections with interactive cards. | [Catalog](catalog.md) |
| Cart and pricing | Shared browser state persists item quantities; pure pricing applies a 10% discount to each line of three or more. | [Cart and pricing](cart-pricing.md) |
| Pickup checkout | An HTTP route validates quantities and re-prices the order; the browser remembers its latest confirmation. | [Checkout](checkout.md) |
| Analytics and flags | Typed event names, safe property builders, lazy PostHog loading, and an off-by-default announcement. | [Analytics](analytics.md) |

## Key source files

| Repository path | Role |
| --- | --- |
| `app/layout.tsx` | Mounts the shared cart, drawer, header, and analytics bootstrap. |
| `app/page.tsx`, `components/Storefront.tsx`, `lib/products.ts` | Menu entrypoint, layout, and catalog. |
| `components/CartProvider.tsx`, `lib/cart.ts`, `lib/pricing.ts` | Item-only persistence, quantity updates, and totals. |
| `lib/promotions.ts` | Empty promotion registry and dormant normalized lookup. |
| `components/Checkout.tsx`, `app/api/orders/route.ts`, `lib/orders.ts` | Browser submission and authoritative order validation/pricing. |
| `components/lastOrder.ts`, `components/OrderConfirmation.tsx` | Same-tab last-order display, not server order history. |
| `lib/analytics.ts`, `components/posthog.ts` | Event/flag contracts and browser transport. |
| `tests/products.test.ts`, `tests/cart.test.ts`, `tests/pricing.test.ts`, `tests/orders.test.ts`, `tests/analytics.test.ts`, `e2e/storefront.spec.ts` | Catalog/cart invariants, bulk pricing, authoritative repricing, event totals, and shopping regressions. |

## Scoped maintenance snapshot

At `origin/main` commit [`05be85e`](https://github.com/FactoryDemo/demo-storefront-practice/commit/05be85e2a6da3930a48c3b3a6ebc53d2e2567b40), the union of the four deep dives' explicitly listed scopes is **23 source files and 6 test files**, a **6/23 = 0.26 test-file/source-file ratio**: catalog contributes 5 source files, cart/pricing 6, checkout 8, and analytics 4. The six unique test paths are listed above; shared `e2e/storefront.spec.ts` is counted once. Assets, styling, shared layout, and server telemetry dependencies are excluded. This is a file-count measure, not coverage. Repository-wide, seven unit modules and six Playwright scenarios remain; the feature scope excludes logger and telemetry unit modules.

The unique-human bus-factor proxy is **1**: `.github/CODEOWNERS` names nicolasschmidt2001, and scoped `git log origin/main` identifies the same person. Nicolas Schmidt/nicolasschmidt2001 and email aliases are collapsed; bots are excluded. Each deep dive states its own scope and limitations.

Orders are pretend: no payment, database, or retrieval API. SAVE10 has been reverted: `PROMOTIONS` is empty, and there is no promo state, persistence, UI, checkout request field, or order field. The optional pricing hook ignores all codes. The server validates name, pickup, and items and computes the total from catalog prices: three Drip Coffees plus one Espresso cost **$12.40**. Extra request fields, including `promoCode`, are ignored rather than rejected. See the [API contract](../api.md), [data models](../reference/data-models.md), and [security boundaries](../security.md) before considering production use.

## Modification entrypoints

Start in `lib/pricing.ts` for bulk pricing and the dormant promotion hook, `lib/promotions.ts` for the empty registry, and `components/CartProvider.tsx` for shared state. Checkout validation belongs in `lib/orders.ts`; event/property contracts belong in `lib/analytics.ts`. Follow the linked deep dives and [testing guide](../how-to-contribute/testing.md) for tests and integration limits; see the [glossary](../overview/glossary.md) for shared terminology.
