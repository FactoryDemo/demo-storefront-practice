# API

The app exposes a health endpoint and a mock order endpoint. Both run dynamically and use `withTelemetry` from `server/telemetry.ts`; neither depends on a database (`app/api/health/route.ts`, `app/api/orders/route.ts`).

## Routes

| Method and path | Success | Implementation |
| --- | --- | --- |
| `GET /api/health` | 200 with `{"status":"ok"}` | `app/api/health/route.ts` |
| `POST /api/orders` | 201 with a server-priced order | `app/api/orders/route.ts` |

There is no order lookup endpoint. `/orders/[id]` is a browser confirmation page, not an HTTP API for retrieving stored orders.

## Place an order

The browser sends only the pickup name, slot, and items with quantities (`components/Checkout.tsx`, `lib/orders.ts`):

```json
{
  "name": "Demo",
  "pickup": "in-15",
  "items": [
    { "productId": "drip", "quantity": 3 },
    { "productId": "espresso", "quantity": 1 }
  ]
}
```

`validateOrderRequest` in `lib/orders.ts` checks:

- An object payload and a nonblank trimmed name of at most 60 characters.
- A known pickup ID: `asap`, `in-15`, `in-30`, `in-45`, or `in-60`.
- A nonempty items array.
- A catalog product ID and an integer quantity from 1 through 99 on each submitted item.

Validation collects errors from the fields and items. Duplicate product IDs merge after per-item validation, so the merged quantity can exceed 99. Browser cart restoration does not enforce that cap either (`lib/cart.ts`). These are current semantics, not a claim of a production-safe maximum.

Unrecognized extra fields, such as a supplied price, total, or discount amount, are ignored when building the validated request. This includes **any `promoCode` value**, regardless of its type or contents: it is neither validated nor normalized. `buildOrder` in `lib/orders.ts` re-prices against `lib/products.ts` using `priceLines(request.items)` and `calculateCartTotal(request.items)` from `lib/pricing.ts`, without a code.

For the example, the bulk Drip Coffee line costs 945 cents and the full-price Espresso costs 295 cents, giving a **1,240-cent total**, equal to the sum of the lines (`tests/orders.test.ts`). See [cart pricing](features/cart-pricing.md) for bulk pricing and the dormant promotion hook; `lib/promotions.ts` has no registered codes.

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
  "totalCents": 1240,
  "placedAt": "2026-11-12T12:00:00.000Z"
}
```

The response has only `id`, `name`, `pickup`, `lines`, `totalCents`, and `placedAt`. Lines contain post-bulk amounts, and their sum equals `totalCents`; there are no promotion or discount-breakdown fields (`lib/orders.ts`).

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
| `lib/promotions.ts` | Empty registry and dormant code lookup |
| `server/telemetry.ts` | Wrapper, generic failure response, metrics, flush |
| `tests/orders.test.ts` | Validation, duplicate merging, and exact 1,240-cent order contract |
| `e2e/storefront.spec.ts` | API success with a 945-cent total, invalid-order rejection, and health response |

See [pickup checkout](features/checkout.md) for browser handling and [data models](reference/data-models.md) for types.
