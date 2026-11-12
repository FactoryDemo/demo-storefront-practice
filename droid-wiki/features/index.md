# Features
Active contributors: **nicolasschmidt2001**.

## Purpose

Bean & Byte connects a static coffee menu to a browser cart and mock pickup checkout. Optional analytics observes that journey without being required to complete it. Start with [architecture](../overview/architecture.md) for the application-wide boundaries.

| Capability | Main boundary | Deep dive |
| --- | --- | --- |
| Catalog | Static products and categories become server-rendered sections with interactive cards. | [Catalog](catalog.md) |
| Cart and pricing | Shared browser state calls pure quantity and integer-cent pricing functions. | [Cart and pricing](cart-pricing.md) |
| Pickup checkout | An HTTP route validates quantities and re-prices an order; the browser remembers its latest confirmation. | [Checkout](checkout.md) |
| Analytics and flags | Typed event names, safe property builders, lazy PostHog loading, and an off-by-default announcement. | [Analytics](analytics.md) |

## Key source files

| Repository path | Role |
| --- | --- |
| `app/layout.tsx` | Mounts the shared cart, drawer, header, and analytics bootstrap. |
| `app/page.tsx`, `components/Storefront.tsx`, `lib/products.ts` | Menu entrypoint, layout, and catalog. |
| `components/CartProvider.tsx`, `lib/cart.ts`, `lib/pricing.ts` | Cart persistence, quantity updates, and totals. |
| `components/Checkout.tsx`, `app/api/orders/route.ts`, `lib/orders.ts` | Browser submission and authoritative order validation/pricing. |
| `components/lastOrder.ts`, `components/OrderConfirmation.tsx` | Same-tab last-order display, not server order history. |
| `lib/analytics.ts`, `components/posthog.ts` | Event/flag contracts and browser transport. |

## Scoped maintenance snapshot

At `origin/main` commit `902a299`, the union of the four deep dives' explicitly listed scopes is **23 source files and 6 test files**, a **6/23 = 0.26 test-file/source-file ratio**. Shared `e2e/storefront.spec.ts` is counted once; assets, styling, shared layout, and server telemetry dependencies are excluded. This is a file-count measure, not coverage.

The unique-human bus-factor proxy is **1**: `.github/CODEOWNERS` names nicolasschmidt2001, and scoped default-branch log/blame identifies the same person. Nicolas Schmidt's email aliases are collapsed; bots are excluded. Each deep dive states its own scope and limitations.

Orders are pretend: no payment, database, or retrieval API. Promotion plumbing has no registered codes and is not connected to checkout. See [security boundaries](../security.md) before considering production use.
