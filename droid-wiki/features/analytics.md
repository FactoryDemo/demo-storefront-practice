# Analytics and flags
Active contributors: **nicolasschmidt2001**.

## Purpose

Optional PostHog integration observes the shopping journey, reports browser exceptions, and controls one menu announcement. Cart events use bulk-priced totals and placed-order events use the authoritative server total; current pricing has no active promotions. The storefront must remain usable without a project key or enabled flags; pure helpers live in `lib/analytics.ts`, and SDK loading and React flag state live in `components/posthog.ts`.

## Event and property contract

`ANALYTICS_EVENTS` in `lib/analytics.ts` defines the allowed `AnalyticsEvent` string union. `AnalyticsProperties` in the same file permits string, number, and boolean values, but is a generic record: TypeScript does **not** enforce a separate property schema for each event. Use the existing builders rather than assembling sensitive ad hoc payloads.

| Event | Call site | Custom properties |
| --- | --- | --- |
| `product_added` | `components/ProductCard.tsx` | `productId`, category, unit `priceCents`, resulting `quantityInCart`. |
| `cart_opened` | `components/CartProvider.tsx` | `lineCount`, summed `itemCount`, bulk-priced `totalCents`. |
| `checkout_started` | `components/Checkout.tsx` | Same cart summary; tracked once per component mount after hydration with a nonempty cart. |
| `order_placed` | `components/Checkout.tsx` | `orderId`, pickup, line/item counts, authoritative server `totalCents`. |
| `order_failed` | `components/Checkout.tsx` | `errorCount`, not raw submitted input or customer name. |

`cartProperties(items)` in `lib/analytics.ts` calls `calculateCartTotal(items)` in `lib/pricing.ts` with items only, just like the current drawer and checkout. Three Drip Coffees plus one Espresso report **1240 cents**, matching the displayed total and the server-priced order for that cart. `PROMOTIONS` in `lib/promotions.ts` is empty, so there is no live SAVE10 discount or current promotional total discrepancy. No promo text, property, or promo-specific event is transmitted by these custom events. `orderProperties` in `lib/analytics.ts` uses the server's final `totalCents` for `order_placed`.

Server merging of duplicate lines can still change a malformed stored cart's total, and a checkout-start event is only a snapshot, not a guarantee of the eventual submitted cart. Later cart changes do not emit it again within the same mount. See [cart and pricing](cart-pricing.md), [checkout](checkout.md), the [API contract](../api.md), and [data models](../reference/data-models.md).

`releaseProperties` in `lib/analytics.ts` adds `appRepo`, `appVersion` (first seven commit characters), and `appEnvironment`. Browser initialization reads public Vercel repository/SHA/environment variables; missing values become `local`, `dev`, and `development`. `server/release.ts` uses the same helper with server Vercel variables for server exceptions.

## Lazy loading and configuration

`components/Analytics.tsx` renders nothing and calls `loadAnalytics` from `components/posthog.ts` after first render. `track` and `captureError` in `components/posthog.ts` also call the loader, so callers need not wait for bootstrap.

Without `NEXT_PUBLIC_POSTHOG_KEY`, or outside a browser, the loader resolves to null without importing the SDK. Otherwise it caches a single dynamic-import promise, initializes PostHog, registers release properties, and reuses the client. Import rejection resolves to null. Event sending is fire-and-forget, not a delivery guarantee.

`NEXT_PUBLIC_POSTHOG_HOST` defaults to `https://us.i.posthog.com`. Configuration uses defaults `2025-05-24`, `person_profiles: identified_only`, automatic exception capture, and disabled session recording. Same-host tracing headers let server errors correlate to browser session/distinct IDs. See [configuration](../reference/configuration.md) and [tracing](../how-to-monitor/tracing.md) for server integration.

## Flag lifecycle

```mermaid
graph LR
  Initial["Initial flag state: false"] --> Load["Load optional PostHog client"]
  Load -->|no key or import failure| Off["Announcement absent"]
  Load --> Callback["onFeatureFlags callback"]
  Callback --> Check["isFeatureEnabled strictly true?"]
  Check -->|yes| Notice["Render announcement"]
  Check -->|no| Off
```

`FEATURE_FLAGS.menuAnnouncement` in `lib/analytics.ts` maps to `menu-announcement`, the only current flag. `useFeatureFlag` in `components/posthog.ts` starts false, subscribes after the client loads, and removes the subscription on cleanup. An active guard prevents subscribing after unmount. `components/MenuAnnouncement.tsx` displays “Cardamom buns are back, baked fresh every morning.” only when enabled; it does not gate ordering.

## Privacy, tests, and modification entrypoints

Never put the customer's name or other personal data into custom properties. `orderProperties` deliberately omits the name; `tests/analytics.test.ts` checks this alongside event/flag names, release fallbacks, product details, and cart totals including the exact bulk-priced summary `{ lineCount: 2, itemCount: 4, totalCents: 1240 }`. It also asserts `order_placed` properties for the same $12.40 order. These are pure Node tests, not SDK delivery, subscription-lifecycle, malformed-storage reconciliation, or browser privacy tests. Disabled session recording is not a blanket guarantee that every automatically captured signal is free of sensitive data. See [testing](../how-to-contribute/testing.md) for suite boundaries and the [glossary](../overview/glossary.md) for release properties.

Add event/flag keys and pure property builders in `lib/analytics.ts`, invoke `track` at the interaction boundary, and test property shape and PII exclusion. Keep each new flag's disabled path functional. Route errors through the existing exception wrappers rather than adding SDK initialization to `lib/`. Server log redaction matches sensitive keys and does not automatically scrub customer names in arbitrary text; see [security boundaries](../security.md) and [logging](../how-to-monitor/logging.md).

## Key source files

| Repository path | Responsibility |
| --- | --- |
| `lib/analytics.ts` | Typed names, scalar properties, release and commerce builders. |
| `components/posthog.ts` | Cached loading, capture wrappers, configuration, and flag hook. |
| `components/Analytics.tsx` | Renderless bootstrap mounted by `app/layout.tsx`. |
| `components/MenuAnnouncement.tsx` | Current flag consumer. |
| `tests/analytics.test.ts` | Pure contract and privacy assertions. |

## Scoped maintenance snapshot

At `origin/main` [`8a42447`](https://github.com/FactoryDemo/demo-storefront-practice/commit/8a424472be94bba50c1d2458190cf3461cf30d41): **4 source files** (the first four table rows), **1 test file**, **1/4 = 0.25 test-file/source-file ratio**, rechecked against the listed paths. Event call sites, shared layout, and server telemetry are integrations excluded from this scope. This is not coverage. Unique-human bus-factor proxy: **1**, derived from `.github/CODEOWNERS` plus scoped `git log origin/main`, normalizing Nicolas Schmidt/nicolasschmidt2001 and email aliases to nicolasschmidt2001 and excluding bots.
