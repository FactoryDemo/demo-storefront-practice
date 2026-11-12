# Data models
Active contributors: **nicolasschmidt2001**.

These are TypeScript contracts and browser JSON values, **not database tables**. There is no persistent server order schema, migration, or order retrieval store. Public monetary fields represent cents; types use `number`, so runtime checks and trusted catalog values enforce relevant invariants rather than branded numeric types.

## Catalog and cart

`lib/types.ts` declares:

```ts
type ProductCategory = "hot" | "cold" | "beans" | "bakery";
type Product = {
  id: string;
  name: string;
  priceCents: number;
  category: ProductCategory;
  description: string;
  image: string;
};
type Category = {
  id: ProductCategory;
  name: string;
  description: string;
};
type CartItem = { productId: string; quantity: number };
type PricedLine = {
  productId: string;
  quantity: number;
  lineTotalCents: number;
};
type Cart = { items: CartItem[] };
```

`Cart` is a declared wrapper, but actual shared state and persisted cart JSON are **`CartItem[]`**, not `{ items: [...] }` (`components/CartProvider.tsx`). Context also exposes `promoCode: string`, `setPromoCode: (code: string) => void`, `itemCount`, `isLoaded`, `isOpen`, and `addItem`, `changeQuantity`, `clear`, `openCart`, `closeCart` actions. Promo state preserves raw input, including case and spaces. `clear` resets items and promo text.

`PRODUCTS` and `CATEGORIES` are mutable typed arrays with 13 products and four categories (`lib/products.ts`). `getProduct(id)` returns the matching object reference or throws; `productsInCategory` returns a filtered array containing those same references. Neither helper provides immutable snapshots. Names, images, and unit prices are looked up from the current catalog rather than stored on priced lines.

## Orders and validation

`lib/orders.ts` defines:

```ts
type PickupSlotId = "asap" | "in-15" | "in-30" | "in-45" | "in-60";
type PickupSlot = { id: PickupSlotId; label: string };
type OrderRequest = {
  name: string;
  pickup: PickupSlotId;
  items: CartItem[];
  promoCode?: string;
};
type Order = {
  id: string;
  name: string;
  pickup: PickupSlotId;
  lines: PricedLine[];
  totalCents: number;
  promoCode?: string;
  placedAt: string;
};
type OrderValidation =
  | { ok: true; request: OrderRequest }
  | { ok: false; errors: string[] };
```

`validateOrderRequest(unknown)` rejects null/nonobjects, then accumulates name, pickup, item, and promo errors in that order:

1. Name must be a string with trimmed length 1–60; the successful request contains the trimmed value.
2. Pickup must match one of the five IDs, not an arbitrary timestamp.
3. Items must be a nonempty array. Each submitted entry must reference a known product and have a numeric integer quantity 1–99. An entry can produce both product and quantity errors.
4. `promoCode` may be omitted/undefined or a blank string; those values produce no request field. Recognized strings are trimmed and uppercased. Null, other nonstrings, and unknown codes produce `"Enter a valid promo code or remove it."`.
5. Only after **all** validation passes are duplicate product IDs summed with a `Map`. Output preserves first-occurrence product order. Two entries of quantity 99 become one quantity-198 line: there is no post-merge 99 cap.

Unknown extra fields are ignored when constructing the validated request. Neither a browser-supplied price, total, nor discount becomes authoritative. `buildOrder` in `lib/orders.ts` assumes a validated request, resolves the canonical promotion through `findPromotion` in `lib/promotions.ts`, re-prices using `lib/pricing.ts` with that code, and serializes its supplied `Date` with `toISOString()`. `app/api/orders/route.ts` supplies an ID of `BB-` plus six uppercase UUID characters and the current timestamp; the type itself does not validate ID format or uniqueness.

`Order.lines` contains post-bulk amounts; `Order.totalCents` subtracts any eligible promo discount from their sum. `Order.promoCode` is optional and canonical, including when a recognized code produces zero discount. There is no discount field on `Order` or `PricedLine`. `OrderLines` in `components/OrderLines.tsx` derives the displayed discount as the sum of line amounts minus the final total, rendering a row only with a code and a positive difference (`tests/orders.test.ts`).

## Browser storage boundaries

| Key and storage | JSON shape and checks | Source |
| --- | --- | --- |
| `bean-and-byte:cart`, localStorage | Array filtered to known product IDs and positive integer quantities. Missing/invalid JSON or nonarray input becomes empty. No 99 cap, deduplication, or removal of extra fields from retained objects. | `lib/cart.ts`, `components/CartProvider.tsx` |
| `bean-and-byte:promo`, localStorage | Raw string, not JSON-encoded; missing becomes `""`. Case, spaces, and unknown codes survive restoration. Lookup does not mutate the stored text. | `components/CartProvider.tsx`, `lib/promotions.ts` |
| `bean-and-byte:last-order`, sessionStorage | Entire last `Order`; read uses a type assertion, not schema validation. Exceptions return null; writes are best effort. Confirmation requires its ID to match the URL. | `components/lastOrder.ts`, `components/OrderConfirmation.tsx` |

Cart hydration guards writes until both localStorage values are read, but storage access exceptions are not caught there. Items and promo text persist across reloads/visits until changed or cleared; clearing writes `[]` and `""`, not key deletion (`components/CartProvider.tsx`). The last-order record is tab/session-scoped and overwritten by the next successful order; checkout saves it before clearing cart state (`components/Checkout.tsx`, `components/lastOrder.ts`). Stored duplicates remain separate during browser pricing; server merging can change discount eligibility. Last-order totals and canonical promo code survive as JSON, but display labels still resolve against the current catalog. Browser values are neither trusted server records nor cross-device history.

## Analytics and promotions

`lib/analytics.ts` defines `AnalyticsEvent` as `"product_added" | "cart_opened" | "checkout_started" | "order_placed" | "order_failed"`, `FeatureFlag` as `"menu-announcement"`, and `AnalyticsProperties` as `Record<string, string | number | boolean>`. `ReleaseInfo` has optional string fields `repo`, `commitSha`, `environment`. Order properties omit the customer name; the generic record type alone does not enforce privacy.

| Property builder / event | Exact property keys |
| --- | --- |
| `releaseProperties` | `appRepo`, `appVersion`, `appEnvironment` |
| `productAddedProperties` | `productId`, `category`, `priceCents`, `quantityInCart` |
| `cartProperties` | `lineCount`, `itemCount`, `totalCents` |
| `orderProperties` | `orderId`, `pickup`, `lineCount`, `itemCount`, `totalCents` |
| `order_failed` in `components/Checkout.tsx` | `errorCount` |

`Promotion` in `lib/promotions.ts` has `code: string`, `description: string`, and `discountCents(lines: PricedLine[]): number`. `PROMOTIONS` registers SAVE10, described as `"10% off full-price items"`; lookup trims/uppercases input. `calculateCartTotal(items, promoCode?)` in `lib/pricing.ts` passes all post-bulk lines to the matching callback, subtracts its discount, and clamps at zero. SAVE10 itself filters full-price lines and rounds 10% of their combined subtotal once. The callback contract does not impose that filter on future promotions.

`cartProperties(items, promoCode?)` passes the code into shared pricing; order properties use the final server-priced `Order.totalCents` (`lib/analytics.ts`). The exact property keys above are unchanged: neither builder emits raw promo text or the customer's name, and no promo event was added. Duplicate merging at the server boundary can still change a malformed restored cart's line grouping (`lib/cart.ts`, `lib/orders.ts`).

See [cart pricing](../features/cart-pricing.md), [checkout](../features/checkout.md), and the [HTTP API](../api.md) for behavior and responses.
