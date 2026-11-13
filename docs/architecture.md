# Architecture

Bean & Byte is a single Next.js 14 (App Router) application. It has no
database and calls no external APIs: the catalog is a static list in code,
the cart lives in the browser, every price comes from a pure TypeScript
pricing core, and checkout places mock pickup orders that are never charged
or stored.

## Request and data flow

```mermaid
flowchart LR
  subgraph ui["UI: app/ and components/"]
    layout["app/layout.tsx<br/>CartProvider, SiteHeader, CartDrawer"]
    storefront["components/Storefront.tsx<br/>menu by category"]
    card["components/ProductCard.tsx<br/>photo, price, Add to cart"]
    drawer["components/CartDrawer.tsx<br/>lines, quantities, total"]
    checkout["components/Checkout.tsx<br/>pickup form + summary"]
    layout --> storefront --> card
    layout --> drawer
  end

  subgraph core["Pure logic: lib/"]
    catalog["Catalog<br/>lib/products.ts"]
    cart["Cart updates<br/>lib/cart.ts"]
    pricing["Pricing core<br/>lib/pricing.ts<br/>line + cart totals in cents"]
    orders["Orders<br/>lib/orders.ts<br/>validate + price"]
    currency["Currency formatting<br/>lib/currency.ts"]
  end

  catalog -- "CATEGORIES, PRODUCTS" --> storefront
  card -- "addItem" --> cart
  drawer -- "cart: productId + quantity" --> pricing
  checkout -- "cart" --> pricing
  pricing -- "getProduct" --> catalog
  orders -- "priceLines, calculateCartTotal" --> pricing
  pricing -- "cents" --> currency
```

1. **Catalog.** `lib/products.ts` exports `CATEGORIES`, `PRODUCTS`, and
   `getProduct`. Each product has a category, a description, and a photo in
   `public/products/<id>.jpg`. `Storefront` renders one section per
   category and one `ProductCard` per product.
2. **Cart.** `components/CartProvider.tsx` holds the cart as `CartItem[]`
   (product id and quantity) for every page and saves it in
   `localStorage`. The quantity changes themselves are pure functions in
   `lib/cart.ts`. Cart UI only changes quantities; it never computes money.
3. **Pricing core.** `calculateLineTotal`, `priceLines`, and
   `calculateCartTotal` in `lib/pricing.ts` turn quantities into integer
   cents. A line of 3 or more of one item is 10% off, rounded to the nearest
   cent. The promo code `SAVE10` (in `lib/promotions.ts`) takes 10% off the
   full-price lines after bulk pricing, rounded half up to the cent. Promo
   codes never stack with the bulk discount (FIN-212), so bulk-priced lines
   are excluded before a promotion runs. The cart stores the code, and the
   server re-checks it when the order is placed.
4. **Currency formatting.** `formatCurrency` in `lib/currency.ts` is the only
   place cents become a display string such as `$9.45`.

## Checkout

```mermaid
sequenceDiagram
  participant B as Browser (components/Checkout.tsx)
  participant R as POST /api/orders
  participant O as lib/orders.ts
  B->>R: name, pickup slot, items
  R->>O: validateOrderRequest
  O-->>R: errors, or a clean request
  R->>O: buildOrder (re-prices from the catalog)
  R-->>B: 201 order, or 400 errors
  B->>B: save order in sessionStorage, clear cart
  B->>B: go to /orders/[id]
```

- The server never trusts client totals: `buildOrder` prices every line
  again through `lib/pricing.ts`.
- `validateOrderRequest` rejects blank or long names, unknown pickup slots,
  empty carts, unknown products, and quantities outside 1 to 99, and merges
  repeated products into one line.
- Orders are not stored. The confirmation page (`app/orders/[id]/page.tsx`)
  reads the last order from `sessionStorage` in the same tab.

## Where code lives

| Directory | Contains | Rules |
| --- | --- | --- |
| `app/` | Routes: the menu, `/checkout`, `/orders/[id]`, the root layout, `app/api/orders/route.ts`, and `app/api/health/route.ts` | UI and HTTP only; no pricing math |
| `components/` | React components (`Storefront`, `ProductCard`, `CartProvider`, `CartDrawer`, `Checkout`, `OrderConfirmation`) | Calls into `lib/` for every price |
| `lib/` | Catalog, cart updates, pricing, orders, currency, types | Pure TypeScript: no React, no I/O, integer cents |
| `public/products/` | Product photos, one JPEG per product id | 800 × 800, served through `next/image` |
| `server/` | Server-only helpers: the JSON logger, telemetry (metrics, error reporting), and OpenTelemetry and profiler setup | May do I/O; never imported by client components |
| `tests/` | Vitest unit tests, one file per module | Run with `npm test` |
| `e2e/` | Playwright end-to-end tests against a production build | Run with `npm run test:e2e` |

## Server side and observability

- `app/api/health/route.ts` answers `GET /api/health` with
  `{"status":"ok"}` and logs each check through `server/logger.ts`.
- `app/api/orders/route.ts` answers `POST /api/orders` with the priced
  order (HTTP 201) or `{"errors": [...]}` (HTTP 400). It logs
  `order placed` with the order id, pickup slot, line count, and total in
  cents, and `order rejected` with the validation errors. The customer's
  name is never logged.
- `server/logger.ts` writes one JSON object per line (`timestamp`, `level`,
  `message`, extra fields) to stdout, or stderr for warnings and errors.
  Fields whose keys look sensitive (password, token, authorization, cookie,
  email, card, and similar) are replaced with `[REDACTED]`.
- `instrumentation.ts` loads `server/instrumentation-node.ts`, which
  registers OpenTelemetry through `@vercel/otel` with the service name
  `bean-and-byte`. Route handlers are wrapped in `withTelemetry`
  (`server/telemetry.ts`), which records the `orders_placed`,
  `orders_rejected`, `order_value_cents`, `server_errors`, and
  `health_checks` metrics, turns an unexpected error into a reported 500,
  and flushes telemetry before the function freezes. Traces and metrics are
  exported over OTLP only when `OTEL_EXPORTER_OTLP_ENDPOINT` is set.
- With `PYROSCOPE_SERVER_ADDRESS` set, the same file starts the Pyroscope
  Node.js profiler (CPU, wall, and heap), tagged with the repo and version.
- `components/posthog.ts` loads PostHog in a separate chunk when
  `NEXT_PUBLIC_POSTHOG_KEY` is set. Event names and their properties live in
  `lib/analytics.ts` (never the customer's name); flags are read with
  `useFeatureFlag`. Browser exceptions, `app/error.tsx`, and server errors
  (`captureServerError`) all go to PostHog error tracking, tagged with the
  repo, version, and environment.

## External dependencies

The app needs none to run: with no environment variables (local dev, CI,
tests) nothing is sent anywhere. Deployed on Vercel, it uses:

| Service | Used for | Configured by |
| --- | --- | --- |
| Vercel | Hosting; every push to `main` deploys to production, pull requests get previews | Vercel GitHub app |
| PostHog | Product analytics, feature flags, error tracking | `NEXT_PUBLIC_POSTHOG_*` |
| Grafana Cloud | Traces (Tempo), metrics (Prometheus), profiles (Pyroscope), dashboard, alerts | `OTEL_EXPORTER_OTLP_*`, `PYROSCOPE_*`, `observability/grafana/` |

How to use them when something breaks is in
`docs/runbooks/observability.md`.
