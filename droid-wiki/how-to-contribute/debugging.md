# Debugging

Start with the local health route, browser state, and JSON server logs. `docs/runbooks/local-development.md` covers setup failures; `docs/runbooks/observability.md` covers deployed signals.

## Setup failures

| Symptom | Check and next step |
| --- | --- |
| Port conflict or unexpected port | Identify the listener on 3000 before stopping anything. Alternatively use `npm run dev -- -p 3001`; Playwright still expects 3000 (`playwright.config.ts`). |
| `npm ci` rejects lockfile drift | Compare `package.json` with `package-lock.json`. If changing dependencies intentionally, update both together; do not delete the lockfile. |
| Missing Playwright executable | Run `npx playwright install chromium`; Linux CI uses `--with-deps` (`.github/workflows/e2e.yml`). |
| Stale `.next` modules/types | Stop the relevant server and remove only generated `.next` output, then rebuild (`docs/runbooks/local-development.md`). |
| Missing hook | Run `npm run prepare`; the hook runs lint-staged, not tests (`package.json`, `.husky/pre-commit`). |

The current dependency policy targets Node 20. `.github/dependabot.yml` blocks known peer-incompatible OpenTelemetry changes and profiler versions requiring a newer runtime; do not bypass those guards without checking compatibility.

## Cart and confirmation state

`components/CartProvider.tsx` reads `bean-and-byte:cart` from localStorage after mount and exposes `isLoaded`. An early empty render is not proof the saved cart was lost. `lib/cart.ts` drops malformed entries and retired products.

If a previous rehearsal left `bean-and-byte:promo` in localStorage, it is inert: `components/CartProvider.tsx` no longer reads, writes, or removes that key. `components/CartDrawer.tsx` has no Apply or Remove controls, `PROMOTIONS` in `lib/promotions.ts` is empty, and `lib/orders.ts` ignores extra request fields such as `promoCode`. Historical SAVE10 instructions do not describe this tree; see [lore](../lore.md).

For a normal cart, displayed lines, cart analytics, and the placed total use the same bulk-only pricing (`components/OrderLines.tsx`, `lib/analytics.ts`, `lib/pricing.ts`). A malformed restored cart can still differ after checkout because `lib/cart.ts` preserves duplicate entries while `lib/orders.ts` merges them before pricing. See [cart pricing](../features/cart-pricing.md) and [analytics](../features/analytics.md).

The order confirmation is not a server lookup. `components/lastOrder.ts` stores one order under `bean-and-byte:last-order` in sessionStorage. `components/OrderConfirmation.tsx` requires that stored ID to match the URL. A different tab, unavailable storage, or a later order can produce “Order not found” even after a successful response.

Inspect storage locally without copying pickup names into logs, tickets, or analytics. The [checkout guide](../features/checkout.md) explains the lifecycle.

## Request failures

Check `/api/health` for HTTP 200 and `{"status":"ok"}`. For orders, 400 means malformed JSON or failed validation; the response contains an errors array. A generic 500 means `withTelemetry` caught an exception (`app/api/orders/route.ts`, `server/telemetry.ts`).

`components/Checkout.tsx` separately displays transport/JSON failures when it cannot complete the request. Compare the browser network response with the server's `order rejected`, `order placed`, or `unhandled error` log message.

## Deployed failures

Use Vercel JSON logs for the route, PostHog for exception/session context, and Grafana for metrics, traces, profiles, and deploy markers. `server/telemetry.ts` attaches the active trace ID to server exceptions. Optional tools produce no remote evidence unless configured.

See [logging](../how-to-monitor/logging.md), [tracing](../how-to-monitor/tracing.md), and [alerting](../how-to-monitor/alerting.md). Never infer a production incident solely from an absent optional signal.
