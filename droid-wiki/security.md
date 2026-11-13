# Security boundaries

The storefront is an unauthenticated demo with mock orders, not a production checkout. Its meaningful boundaries are untrusted request data, browser storage, telemetry, and deployment credentials (`README.md`, `lib/orders.ts`, `.env.example`).

## Server-owned prices

`app/api/orders/route.ts` parses JSON as unknown and calls `validateOrderRequest` in `lib/orders.ts`. The server looks up products and recomputes totals through `lib/pricing.ts`. A browser-supplied price or total does not become part of the validated order.

Unknown HTTP fields are ignored, including arbitrary client totals, prices, and discount amounts. `promoCode` is recognized: missing, `undefined`, `null`, or exactly `""` means absent; whitespace-only, unknown, and nonstring values are rejected. Valid codes are trimmed and uppercased. The server merges duplicate product IDs before repricing, so splitting one product into submitted entries does not avoid bulk pricing (`lib/orders.ts`).

`buildOrder` assumes validated input, calls `priceLines`, and passes the validated code to `calculateCartTotal`. `SAVE10` in `lib/promotions.ts` discounts the combined eligible subtotal by 10%, rounded once. The dispatcher in `lib/pricing.ts` excludes lines with quantity at least three before invoking any promotion callback (the source's FIN-212 non-stacking rule), then subtracts the discount and clamps the total at zero. Unknown codes fall back to the subtotal only in the pure pricing helper, not at the HTTP validation boundary. See [cart pricing](features/cart-pricing.md).

Each submitted quantity must be an integer from 1 through 99, but duplicates merge only afterward. Multiple valid entries can therefore produce a merged quantity above 99. There is no total-item count, request-body size, or rate-limit control implemented in the route. Do not treat per-entry validation as a global resource bound.

## Browser storage is not authority

`lib/cart.ts` filters malformed stored cart entries, but does not deduplicate them or cap valid positive integer quantities at 99. `components/lastOrder.ts` casts parsed session data to an order without runtime schema validation.

`components/CartProvider.tsx` restores item JSON from `bean-and-byte:cart` and a raw promo string from `bean-and-byte:promo` in localStorage. Promo restoration checks `findPromotion` but preserves the saved spelling/whitespace; new application stores the canonical code. Writes wait for hydration; `clear` resets items and code, then persistence writes `[]` for the cart and removes the promo key. Storage access exceptions are not caught there. The nonempty cart drawer exposes an inline promo field (`components/CartDrawer.tsx`); browser acceptance does not replace server validation.

Confirmation is consequently a local display of browser state, not proof of a stored transaction. `components/OrderConfirmation.tsx` matches the saved ID to the route, but that is not authorization. No payment, fulfillment, authentication, durable order store, or idempotency system exists. See [API](api.md) and [checkout](features/checkout.md).

## Personal data and logs

Pickup names are accepted and returned to the browser, then stored with the last order. The accepted-order log deliberately omits the name and promo code (`app/api/orders/route.ts`); custom analytics properties omit them too (`lib/analytics.ts`). `cartProperties(items)` emits only `lineCount`, `itemCount`, and `totalCents`: three Drip Coffees plus one Espresso report 1,240 cents even when SAVE10 makes the displayed total 1,210 cents. `orderProperties` uses the server's final total. Neither cart nor order property builders emit personal data or promo text; see [analytics](features/analytics.md).

`server/logger.ts` recursively redacts fields whose keys match sensitive words, including tokens, passwords, emails, cookies, and card-related keys. It does not redact the ordinary `name` key or scan message strings for secrets. Error messages and stacks are serialized as text. Avoid putting request bodies, headers, names, or credentials into free-form log messages.

PostHog browser configuration disables session recording and uses identified-only person profiles, but still captures configured events and exceptions (`components/posthog.ts`). That is not a guarantee that arbitrary exception text is free of personal data.

## Configuration and automation

| Value | Boundary |
| --- | --- |
| `NEXT_PUBLIC_POSTHOG_KEY` | Public project key, intentionally bundled for the browser |
| OTLP auth headers and Pyroscope credentials | Server-only environment configuration |
| Grafana service token and PostHog personal key | Operational script/workflow credentials, never browser variables |
| `FINANCE_RULES` | Private CI rules archive, not public test source |
| Factory and wiki publication tokens | Workflow-scoped access; generation and repository publication use separate jobs |

Sources: `.env.example`, `.github/workflows/ci.yml`, `.github/workflows/droid-wiki-refresh.yml`, and [configuration](reference/configuration.md). Never commit real `.env*` files or secrets (`AGENTS.md`).

`.github/workflows/dast.yml` runs a weekly/manual ZAP baseline with failure and issue-writing behavior configured as report-only. `.github/workflows/droid.yml` requests automatic security review. Neither is a blanket security certification.

## Known maintenance signal

A dependency audit during generation reported existing vulnerable packages, including critical entries. See the dated [dependency maintenance snapshot](cleanup-opportunities.md). No dependency upgrades or vulnerability fixes were attempted as part of wiki generation.

Before adapting this demo for production, design the missing controls explicitly rather than treating the mock endpoint as a payment/order backend.
