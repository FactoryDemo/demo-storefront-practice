# Pickup checkout
Active contributors: **nicolasschmidt2001**.

## Purpose

Checkout turns the browser cart into a server-priced mock pickup order. It collects a name and relative pickup choice and submits those with cart items, without payment details or promo codes. There is no database, fulfillment integration, account, or persisted order history.

## Request and authoritative validation

`app/checkout/page.tsx` renders `components/Checkout.tsx`. Checkout waits for cart hydration, shows an empty-cart alternative when needed, and otherwise displays a form beside `components/OrderLines.tsx`.

The browser submits `{ name, pickup, items }` to `POST /api/orders`; no displayed total is sent as authority. These are the fields in `OrderRequest` in `lib/orders.ts`. `app/api/orders/route.ts` calls `validateOrderRequest` in `lib/orders.ts`, which gathers errors across fields:

- Name must be a string with 1–60 characters after trimming.
- Pickup must be `asap`, `in-15`, `in-30`, `in-45`, or `in-60`.
- Items must be a nonempty array of known product IDs.
- **Each submitted item** must have an integer quantity from 1 through 99.

Unrecognized extra fields, including client totals and `promoCode` of any value, are ignored. The validator does not look up, normalize, or reject promo codes; they are absent from the validated request.

Only after all validation succeeds does `mergeItems` in `lib/orders.ts` combine repeated product IDs. The 99 limit is **not** reapplied to the merged line: two entries of 99 become a valid merged quantity of 198. Merging also means separate entries of one and two Drip Coffees qualify for the three-item bulk discount when server-priced.

`buildOrder` in `lib/orders.ts` calls shared `priceLines` and `calculateCartTotal` in `lib/pricing.ts` with validated items only, using catalog prices rather than client prices. Three Drip Coffees plus one Espresso total **1240 cents ($12.40)**, with line amounts of $9.45 and $2.95. Three Drip Coffees alone cost $9.45; two Lattes cost $9.50. No code appears on the returned order, and the empty promotion registry provides no live SAVE10 discount. See [cart and pricing](cart-pricing.md) for bulk rounding and the dormant hook, and the [glossary](../overview/glossary.md) for terminology.

The route generates `BB-` plus the first six uppercase UUID characters and a current timestamp, then returns the order with HTTP 201. Invalid JSON and rejected fields produce HTTP 400 with an `errors` array. `withTelemetry` in `server/telemetry.ts` converts unexpected exceptions to a generic reported HTTP 500; see the [API reference](../api.md).

## Submission, failure, and confirmation flow

```mermaid
sequenceDiagram
  participant C as Checkout
  participant A as Order route
  participant L as lib/orders.ts
  participant S as sessionStorage
  participant P as Confirmation
  C->>A: POST name, pickup, items
  A->>L: Validate fields, merge items, re-price
  L-->>A: Order
  A-->>C: 201 Order
  C->>S: Save last order
  C->>C: Clear cart items
  C->>P: Navigate /orders/BB-xxxxxx
  P->>S: Load last order, match URL ID
```

The form disables submission while pending. Rejections display server error messages, emit `order_failed` with an error count, and re-enable submission. Fetch or JSON-decoding failures use a connection/retry message. Successful responses are cast to `Order` from `lib/orders.ts`, not runtime schema-validated in the browser.

The summary and submit-button total use shared bulk-only pricing. `OrderLines` in `components/OrderLines.tsx` displays priced lines, a “10% off” tag on bulk quantities, and the total. Current order totals are the sum of those line amounts; there is no promo-discount row or applied-code display. Confirmation receives server-priced amounts, not the current cart state. Cart persistence and hydration belong to `components/CartProvider.tsx`; see [data models](../reference/data-models.md).

On success, checkout emits `order_placed` with the authoritative final total, saves the response, clears cart items, and navigates to `app/orders/[id]/page.tsx`. `checkout_started` reports the current bulk-priced cart total once per mount; it has no promotional discrepancy with current pricing, though later cart edits or server merging can change the eventual total. See [analytics](analytics.md). `components/lastOrder.ts` stores only one value under sessionStorage key `bean-and-byte:last-order`, with best-effort reads/writes and no runtime order-schema validation. `components/OrderConfirmation.tsx` displays it only if its ID matches the URL. Missing storage or a different order ID yields “Order not found”; there is no server fetch fallback. A later order replaces the earlier confirmation record.

## Integration limits and modification entrypoints

Pickup labels are relative choices, not reserved time slots. Nothing is charged. The route has no order persistence, retrieval endpoint, idempotency mechanism, or production authorization/rate limiting. The returned order contains its ID, name, pickup, bulk-priced lines, total, and placement timestamp; see [data models](../reference/data-models.md) for the full reference. Names are excluded deliberately from route logs and custom analytics; logger redaction is key-based, not automatic name detection. Review [security boundaries](../security.md) before extending this demo.

Change validation, types, and pickup choices in `lib/orders.ts`; change submission UX in `components/Checkout.tsx`; change response handling in `app/api/orders/route.ts`. Preserve server repricing through the [shared pricing core](cart-pricing.md).

`tests/orders.test.ts` covers validation, trimming, error collection, duplicate merging, pickup labels, and a catalog-priced $12.40 order. It does not specifically assert ignored promo fields, forged client totals, or merged quantities above 99. The six scenarios in `e2e/storefront.spec.ts` include successful $12.40 checkout/confirmation and cart clearing, plus order API repricing to 945 cents and rejection of an empty-name/empty-cart request. They do not send a forged total or promo code, simulate submission/storage failures, or test missing confirmations. See [testing](../how-to-contribute/testing.md) for commands.

## Key source files

| Repository path | Responsibility |
| --- | --- |
| `lib/orders.ts` | Validation, merging, pickup labels, and order building. |
| `components/Checkout.tsx` | Form, request, failure state, and success transition. |
| `components/lastOrder.ts` | Best-effort same-tab storage. |
| `components/OrderConfirmation.tsx` | Matching saved-order display and missing state. |
| `components/OrderLines.tsx` | Shared read-only summary. |
| `app/api/orders/route.ts` | Server request boundary, IDs, logs, and metrics. |
| `app/checkout/page.tsx`, `app/orders/[id]/page.tsx` | Two page entrypoints. |
| `tests/orders.test.ts`, `e2e/storefront.spec.ts` | Unit and shared browser/API scenarios. |

## Scoped maintenance snapshot

At `origin/main` [`8a42447`](https://github.com/FactoryDemo/demo-storefront-practice/commit/8a424472be94bba50c1d2458190cf3461cf30d41): **8 source files** (all non-test paths in the table), **2 test files**, **2/8 = 0.25 test-file/source-file ratio**, rechecked against the listed paths. Imported pricing/telemetry dependencies are excluded; this is not coverage. Unique-human bus-factor proxy: **1**, from `.github/CODEOWNERS` and scoped `git log origin/main`. Nicolas Schmidt/nicolasschmidt2001 and email aliases are normalized to nicolasschmidt2001; bots are excluded.
