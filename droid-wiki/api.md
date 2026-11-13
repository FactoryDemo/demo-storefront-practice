# API

The app exposes a health endpoint and a mock order endpoint. Both run dynamically and use `withTelemetry` from `server/telemetry.ts`; neither depends on a database (`app/api/health/route.ts`, `app/api/orders/route.ts`).

## Routes

| Method and path | Success | Implementation |
| --- | --- | --- |
| `GET /api/health` | 200 with `{"status":"ok"}` | `app/api/health/route.ts` |
| `POST /api/orders` | 201 with a server-priced order | `app/api/orders/route.ts` |

There is no order lookup endpoint. `/orders/[id]` is a browser confirmation page, not an HTTP API for retrieving stored orders.

## Place an order

The browser sends the pickup name, slot, items with quantities, and an optional applied `promoCode` (`components/Checkout.tsx`, `lib/orders.ts`):

```json
{
  "name": "Demo",
  "pickup": "in-15",
  "items": [
    { "productId": "drip", "quantity": 3 },
    { "productId": "espresso", "quantity": 1 }
  ],
  "promoCode": "SAVE10"
}
```

`validateOrderRequest` in `lib/orders.ts` checks:

- An object payload and a nonblank trimmed name of at most 60 characters.
- A known pickup ID: `asap`, `in-15`, `in-30`, `in-45`, or `in-60`.
- A nonempty items array.
- A catalog product ID and an integer quantity from 1 through 99 on each submitted item.
- An optional live promotion code. Missing, `undefined`, `null`, or exactly `""` means no code; whitespace-only, unknown, and nonstring values produce `"That promo code is not valid."`. Valid codes are trimmed and uppercased.

Validation collects errors from the fields and items. Duplicate product IDs merge after per-item validation, so the merged quantity can exceed 99. Browser cart restoration does not enforce that cap either (`lib/cart.ts`). These are current semantics, not a claim of a production-safe maximum.

Unrecognized extra fields, such as a supplied price, total, or discount amount, are ignored when building the validated request; `promoCode` is a recognized, validated field. `buildOrder` in `lib/orders.ts` assumes validated input and re-prices against `lib/products.ts` using `priceLines(request.items)` and `calculateCartTotal(request.items, request.promoCode)` from `lib/pricing.ts`.

For the example, the bulk Drip Coffee line costs 945 cents and the Espresso line costs 295 cents. Without a code the total is **1,240 cents**; `SAVE10` discounts only the eligible Espresso subtotal by 30 cents, giving **1,210 cents**. The line amounts stay unchanged (`lib/pricing.ts`, `lib/promotions.ts`, `tests/pricing.test.ts`). See [cart pricing](features/cart-pricing.md) for bulk pricing and promotion eligibility.

An illustrative 201 response:

```json
{
  "id": "BB-A1B2C3",
  "name": "Demo",
  "pickup": "in-15",
  "lines": [
    { "productId": "drip", "quantity": 3, "lineTotalCents": 945 },
    { "productId": "espresso", "quantity": 1, "lineTotalCents": 295 }
  ],
  "totalCents": 1210,
  "promoCode": "SAVE10",
  "placedAt": "2026-11-12T12:00:00.000Z"
}
```

The response has `id`, `name`, `pickup`, `lines`, `totalCents`, `placedAt`, and an optional `promoCode`. Lines contain post-bulk, pre-promotion amounts, so their sum can exceed `totalCents`; there is no explicit discount-amount or breakdown field (`lib/orders.ts`). `SAVE10` takes 10% off the combined eligible subtotal, rounded once; lines with quantity at least three are excluded before the promotion callback. Unknown codes are ignored by the pure pricing helper, but rejected by request validation (`lib/pricing.ts`, `lib/promotions.ts`).

The actual route creates `BB-` plus six uppercase UUID characters and the current timestamp (`app/api/orders/route.ts`). It does not store the result or guarantee global ID uniqueness.

## Errors and telemetry

| Status | Body and cause |
| --- | --- |
| 400 | `{"errors":["Request body must be JSON."]}` for parsing failure |
| 400 | `{"errors":[...]}` from `lib/orders.ts` validation |
| 500 | `{"errors":["Something went wrong on our side. Try again."]}` for an unexpected exception |

Expected rejections are logged and counted with `invalid_json` or `validation` reasons. Accepted orders record order count/value and log non-name facts. `withTelemetry` reports unexpected errors and schedules telemetry flushing with Vercel `waitUntil`.

Requests are unauthenticated mock actions. There is no idempotency key or durable order state; repeating a successful POST creates another response. See [security boundaries](security.md).

## Key source files

| File | Purpose |
| --- | --- |
| `app/api/orders/route.ts` | Parse, validate, generate ID, price, record, and respond |
| `app/api/health/route.ts` | Health response, uptime log, and health counter |
| `lib/orders.ts` | Request/result types, validation, merging, pricing |
| `lib/pricing.ts` | Catalog-based line pricing and cart totals |
| `lib/promotions.ts` | Live SAVE10 registry, normalized lookup, and eligible-subtotal discount |
| `server/telemetry.ts` | Wrapper, generic failure response, metrics, flush |
| `tests/orders.test.ts` | Validation, duplicate merging, no-code totals, promo normalization, server repricing, and non-stacking |
| `tests/pricing.test.ts` | SAVE10 rounding, mixed/bulk-only eligibility, and unknown-code fallback |
| `e2e/storefront.spec.ts` | API success with a 945-cent total, invalid-order rejection, and health response |

See [pickup checkout](features/checkout.md) for browser handling and [data models](reference/data-models.md) for types.
