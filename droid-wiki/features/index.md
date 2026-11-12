# Features
Active contributors: **nicolasschmidt2001**.

## Purpose

Bean & Byte connects a static coffee menu to a browser cart and mock pickup checkout. Optional analytics observes that journey without being required to complete it. Start with [architecture](../overview/architecture.md) for the application-wide boundaries.

| Capability | Main boundary | Deep dive |
| --- | --- | --- |
| Catalog | Static products and categories become server-rendered sections with interactive cards. | [Catalog](catalog.md) |
| Cart and pricing | Shared browser state persists quantities; pure pricing applies a per-line bulk discount. | [Cart and pricing](cart-pricing.md) |
| Pickup checkout | An HTTP route validates quantities and re-prices the order; the browser remembers its latest confirmation. | [Checkout](checkout.md) |
| Analytics and flags | Typed event names, safe property builders, lazy PostHog loading, and an off-by-default announcement. | [Analytics](analytics.md) |

## Key source files

| Repository path | Role |
| --- | --- |
| `app/layout.tsx` | Mounts the shared cart, drawer, header, and analytics bootstrap. |
| `app/page.tsx`, `components/Storefront.tsx`, `lib/products.ts` | Menu entrypoint, layout, and catalog. |
| `components/CartProvider.tsx`, `lib/cart.ts`, `lib/pricing.ts` | Cart persistence, quantity updates, and totals. |
| `lib/promotions.ts` | Empty promotion registry and dormant normalized lookup extension. |
| `components/Checkout.tsx`, `app/api/orders/route.ts`, `lib/orders.ts` | Browser submission and authoritative order validation/pricing. |
| `components/lastOrder.ts`, `components/OrderConfirmation.tsx` | Same-tab last-order display, not server order history. |
| `lib/analytics.ts`, `components/posthog.ts` | Event/flag contracts and browser transport. |

## Scoped maintenance snapshot

At `origin/main` commit [`3461fc3`](https://github.com/FactoryDemo/demo-storefront-practice/commit/3461fc30f6b24b1cc8a7497bdfcd9e34c9bc90df), the union of the four deep dives' explicitly listed scopes is **23 source files and 6 test files**, a **6/23 = 0.26 test-file/source-file ratio**. Shared `e2e/storefront.spec.ts` is counted once. Assets, styling, shared layout, and server telemetry dependencies are excluded. This is a file-count measure, not coverage.

The unique-human bus-factor proxy is **1**: `.github/CODEOWNERS` names nicolasschmidt2001, and scoped default-branch log/blame identifies the same person. Nicolas Schmidt's email aliases are collapsed; bots are excluded. Each deep dive states its own scope and limitations.

Orders are pretend: no payment, database, or retrieval API. No promotion codes are active; the server computes the final total from catalog prices and bulk discounts. See [security boundaries](../security.md) before considering production use.

## Modification entrypoints

Start in `lib/pricing.ts` for discount rules, `lib/promotions.ts` for the dormant promotion extension, and `components/CartProvider.tsx` for shared state. Checkout validation belongs in `lib/orders.ts`; event/property contracts belong in `lib/analytics.ts`. Follow the linked deep dives for their tests and integration limits.
