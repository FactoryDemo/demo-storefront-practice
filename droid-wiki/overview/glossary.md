# Glossary

These terms connect the UI, pricing core, and operational tools. Types are defined in `lib/types.ts` and `lib/orders.ts`; telemetry vocabulary comes from `server/telemetry.ts` and `server/release.ts`.

| Term | Meaning and source |
| --- | --- |
| Cents | Monetary storage and return values, such as `priceCents` and `totalCents`, use whole cents; formatting happens in `lib/currency.ts`. |
| Product | Static catalog record with ID, category, price, description, and image (`lib/types.ts`, `lib/products.ts`). |
| Category | One of `hot`, `cold`, `beans`, or `bakery` (`lib/types.ts`). |
| Cart line | Product ID and quantity, without a trusted price (`lib/types.ts`). |
| Bulk threshold | Quantity three of the same product qualifies that line for 10% off (`lib/pricing.ts`). |
| Priced line | Product ID, quantity, and computed `lineTotalCents` (`lib/types.ts`). |
| Promotion | Dormant discount callback receiving all post-bulk priced lines. The registry is empty; the dispatcher has no bulk-line exclusion (`lib/promotions.ts`, `lib/pricing.ts`). |
| Promo code | Optional argument to the pure total helper, matched after trimming and uppercasing. There are no active codes and no cart or order promo field (`lib/promotions.ts`, `lib/pricing.ts`, `components/CartProvider.tsx`, `lib/orders.ts`). |
| Pickup slot | One of five fixed relative choices, not a reservation or stored fulfillment schedule (`lib/orders.ts`). |
| Order | Server-priced response with an ID, pickup name and slot, lines, total, and timestamp (`lib/orders.ts`). |
| Last order | Single session-storage value used by the confirmation page in the same tab (`components/lastOrder.ts`). |
| Release properties | `appRepo`, shortened `appVersion`, and `appEnvironment` attached to telemetry (`lib/analytics.ts`). |
| OTLP | OpenTelemetry export protocol used for traces and metrics (`server/instrumentation-node.ts`). |
| Pyroscope | Optional continuous profiler started by `server/instrumentation-node.ts`. |
| Feature flag | PostHog-controlled boolean, false before a response; the only current key is `menu-announcement` (`lib/analytics.ts`, `components/posthog.ts`). |
| Rolling wiki branch | `factory/droid-wiki`, restored and updated by `.github/workflows/droid-wiki-refresh.yml` to support incremental documentation. |

Continue with [architecture](architecture.md), [data models](../reference/data-models.md), or [monitoring](../how-to-monitor/index.md).
