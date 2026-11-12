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

`Cart` is a declared wrapper, but actual shared state and persisted cart JSON are **`CartItem[]`**, not `{ items: [...] }` (`components/CartProvider.tsx`). Context exposes only `items`, `itemCount`, `isLoaded`, `isOpen`, and `addItem`, `changeQuantity`, `clear`, `openCart`, `closeCart` actions. There is no promo state or setter; `clear` resets items.

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
};
type Order = {
  id: string;
  name: string;
  pickup: PickupSlotId;
  lines: PricedLine[];
  totalCents: number;
  placedAt: string;
};
type OrderValidation =
  | { ok: true; request: OrderRequest }
  | { ok: false; errors: string[] };
```

`validateOrderRequest(unknown)` rejects null/nonobjects, then accumulates name, pickup, and item errors in that order:

1. Name must be a string with trimmed length 1–60; the successful request contains the trimmed value.
2. Pickup must match one of the five IDs, not an arbitrary timestamp.
3. Items must be a nonempty array. Each submitted entry must reference a known product and have a numeric integer quantity 1–99. An entry can produce both product and quantity errors.
4. Only after **all** validation passes are duplicate product IDs summed with a `Map`. Output preserves first-occurrence product order. Two entries of quantity 99 become one quantity-198 line: there is no post-merge 99 cap.

Unknown extra fields are ignored when constructing the validated request, including any `promoCode` value: it is not rejected or normalized. Neither a browser-supplied price, total, nor discount becomes authoritative. `buildOrder` in `lib/orders.ts` assumes a validated request, calls `priceLines(request.items)` and `calculateCartTotal(request.items)` from `lib/pricing.ts` without a code, and serializes its supplied `Date` with `toISOString()`. `app/api/orders/route.ts` supplies an ID of `BB-` plus six uppercase UUID characters and the current timestamp; the type itself does not validate ID format or uniqueness.

`Order.lines` contains post-bulk amounts whose sum equals `Order.totalCents`. Three Drip Coffees and one Espresso produce line totals of 945 and 295 cents and a total of 1,240 cents (`tests/orders.test.ts`). Neither `OrderRequest` nor `Order` has a promo field. There is no discount-breakdown field on `Order` or `PricedLine`, and `components/OrderLines.tsx` renders only lines, bulk tags, and the total.

## Browser storage boundaries

| Key and storage | JSON shape and checks | Source |
| --- | --- | --- |
| `bean-and-byte:cart`, localStorage | Array filtered to known product IDs and positive integer quantities. Missing/invalid JSON or nonarray input becomes empty. No 99 cap, deduplication, or removal of extra fields from retained objects. | `lib/cart.ts`, `components/CartProvider.tsx` |
| `bean-and-byte:last-order`, sessionStorage | Entire last `Order`; read uses a type assertion, not schema validation. Exceptions return null; writes are best effort. Confirmation requires its ID to match the URL. | `components/lastOrder.ts`, `components/OrderConfirmation.tsx` |

Cart hydration guards writes until the saved cart is read, but storage access exceptions are not caught there. Items persist across reloads/visits until changed or cleared; clearing writes `[]`, not key deletion (`components/CartProvider.tsx`). There is no current reader, writer, or clearing behavior for the obsolete `bean-and-byte:promo` localStorage key.

The last-order record is tab/session-scoped and overwritten by the next successful order; checkout saves it before clearing cart state (`components/Checkout.tsx`, `components/lastOrder.ts`). Stored duplicates remain separate during browser pricing; server merging can change bulk pricing. Last-order totals survive as JSON, but display labels still resolve against the current catalog. Browser values are neither trusted server records nor cross-device history.

## Analytics and promotions

`lib/analytics.ts` defines `AnalyticsEvent` as `"product_added" | "cart_opened" | "checkout_started" | "order_placed" | "order_failed"`, `FeatureFlag` as `"menu-announcement"`, and `AnalyticsProperties` as `Record<string, string | number | boolean>`. `ReleaseInfo` has optional string fields `repo`, `commitSha`, `environment`. Order properties omit the customer name; the generic record type alone does not enforce privacy.

| Property builder / event | Exact property keys |
| --- | --- |
| `releaseProperties` | `appRepo`, `appVersion`, `appEnvironment` |
| `productAddedProperties` | `productId`, `category`, `priceCents`, `quantityInCart` |
| `cartProperties` | `lineCount`, `itemCount`, `totalCents` |
| `orderProperties` | `orderId`, `pickup`, `lineCount`, `itemCount`, `totalCents` |
| `order_failed` in `components/Checkout.tsx` | `errorCount` |

`Promotion` in `lib/promotions.ts` has `code: string`, `description: string`, and `discountCents(lines: PricedLine[]): number`. `PROMOTIONS` is an empty `Promotion[]`. `findPromotion(code)` still trims/uppercases input, but currently returns null for every code. `calculateCartTotal(items, promoCode?)` in `lib/pricing.ts` retains a dormant hook that would pass all post-bulk lines to a matching callback, subtract its discount, and clamp at zero. With no registered promotions, every code leaves the line sum unchanged. There is no active SAVE10/FIN-212 filter or non-stacking rule in this contract.

`cartProperties(items)` calls shared pricing without a code; order properties use the server-priced `Order.totalCents` (`lib/analytics.ts`). The mixed cart above yields `{ lineCount: 2, itemCount: 4, totalCents: 1240 }` (`tests/analytics.test.ts`). The exact property keys above are unchanged: neither builder emits promo text or the customer's name. Duplicate merging at the server boundary can still change a malformed restored cart's line grouping (`lib/cart.ts`, `lib/orders.ts`).

See [cart pricing](../features/cart-pricing.md), [checkout](../features/checkout.md), and the [HTTP API](../api.md) for behavior and responses.
