# Security boundaries

The storefront is an unauthenticated demo with mock orders, not a production checkout. Its meaningful boundaries are untrusted request data, browser storage, telemetry, and deployment credentials (`README.md`, `lib/orders.ts`, `.env.example`).

## Server-owned prices

`app/api/orders/route.ts` parses JSON as unknown and calls `validateOrderRequest` in `lib/orders.ts`. The server looks up products and recomputes totals through `lib/pricing.ts`. A browser-supplied price or total does not become part of the validated order.

`promoCode` is untrusted input validated by `lib/orders.ts`: omitted or blank strings mean no code; recognized strings are normalized; null, nonstrings, and unknown codes are rejected. Arbitrary client totals, prices, and discount amounts are ignored. The server merges duplicate product IDs before repricing, so splitting one product into submitted entries cannot evade bulk-line eligibility.

SAVE10 in `lib/promotions.ts` accepts only post-bulk lines whose amounts still equal catalog price times quantity, preventing a second discount on bulk-priced lines. Its discount rounds once over the eligible subtotal; `lib/pricing.ts` clamps the final total at zero. The eligibility filter belongs to SAVE10, not a universal guard around future promotion callbacks. New codes need explicit rules and tests. See [cart pricing](features/cart-pricing.md).

Each submitted quantity must be an integer from 1 through 99, but duplicates merge only afterward. Multiple valid entries can therefore produce a merged quantity above 99. There is no total-item count, request-body size, or rate-limit control implemented in the route. Do not treat per-entry validation as a global resource bound.

## Browser storage is not authority

`lib/cart.ts` filters malformed stored cart entries, but does not deduplicate them or cap valid positive integer quantities at 99. `components/lastOrder.ts` casts parsed session data to an order without runtime schema validation.

`components/CartProvider.tsx` restores cart JSON and raw promo text from separate localStorage keys. Writes wait for hydration; `clear` resets items and code, then persistence writes `[]` and an empty string rather than deleting the keys. Storage access exceptions are not caught there. The shared `components/PromoCodeField.tsx` displays immediate feedback, but browser lookup is not validation authority: an unknown code leaves the preview unchanged while the API rejects checkout until it is corrected or removed (`lib/pricing.ts`, `lib/orders.ts`).

Confirmation is consequently a local display of browser state, not proof of a stored transaction. `components/OrderConfirmation.tsx` matches the saved ID to the route, but that is not authorization. No payment, fulfillment, authentication, durable order store, or idempotency system exists. See [API](api.md) and [checkout](features/checkout.md).

## Personal data and logs

Pickup names are accepted and returned to the browser, then stored with the last order. The accepted-order log deliberately omits the name and promo text (`app/api/orders/route.ts`); custom analytics properties omit both too (`lib/analytics.ts`). `cartProperties(items, promoCode?)` reports the adjusted total, not the raw code; promo support adds no new event. Rejected-code errors contain a fixed message, not the submitted text (`lib/orders.ts`).

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
