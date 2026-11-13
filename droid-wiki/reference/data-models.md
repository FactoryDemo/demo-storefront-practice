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

`Cart` is a declared wrapper, but actual shared state and persisted cart JSON are **`CartItem[]`**, not `{ items: [...] }` (`components/CartProvider.tsx`). Context exposes `items`, `itemCount`, `isLoaded`, `isOpen`, `promoCode: string | null`, and `addItem`, `changeQuantity`, `applyPromoCode`, `removePromoCode`, `clear`, `openCart`, `closeCart` actions. `applyPromoCode(code: string): boolean` stores the canonical live code or clears it on failure; `clear` resets items and code.

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
4. An optional promo code must resolve through `findPromotion`. Missing, `undefined`, `null`, or exactly `""` is absent; whitespace-only, unknown, and nonstring values are rejected with `"That promo code is not valid."`. Successful nonempty codes are trimmed and uppercased.
5. Only after **all** validation passes are duplicate product IDs summed with a `Map`. Output preserves first-occurrence product order. Two entries of quantity 99 become one quantity-198 line: there is no post-merge 99 cap.

Unknown extra fields are ignored when constructing the validated request; `promoCode` is now recognized and validated. Neither a browser-supplied price, total, nor discount becomes authoritative. `buildOrder` in `lib/orders.ts` assumes a validated request, calls `priceLines(request.items)` and `calculateCartTotal(request.items, request.promoCode)` from `lib/pricing.ts`, includes a truthy code in the order, and serializes its supplied `Date` with `toISOString()`. `app/api/orders/route.ts` supplies an ID of `BB-` plus six uppercase UUID characters and the current timestamp; the type itself does not validate ID format or uniqueness.

`Order.lines` contains post-bulk, pre-promotion amounts whose sum can exceed `Order.totalCents`. Three Drip Coffees and one Espresso produce line totals of 945 and 295 cents: 1,240 cents without a code, or 1,210 cents with SAVE10 (`tests/orders.test.ts`, `tests/pricing.test.ts`). Both `OrderRequest` and `Order` have an optional promo field. There is no explicit discount amount or breakdown on `Order` or `PricedLine`; `components/OrderLines.tsx` renders only lines, bulk tags, and the final total, with no promo label in checkout or confirmation.

## Browser storage boundaries

| Key and storage | JSON shape and checks | Source |
| --- | --- | --- |
| `bean-and-byte:cart`, localStorage | Array filtered to known product IDs and positive integer quantities. Missing/invalid JSON or nonarray input becomes empty. No 99 cap, deduplication, or removal of extra fields from retained objects. | `lib/cart.ts`, `components/CartProvider.tsx` |
| `bean-and-byte:promo`, localStorage | Raw string, not JSON. Restore checks `findPromotion` but retains the raw valid value; new application canonicalizes. Invalid saved codes become null and the key is removed after hydration. | `components/CartProvider.tsx`, `lib/promotions.ts` |
| `bean-and-byte:last-order`, sessionStorage | Entire last `Order`; read uses a type assertion, not schema validation. Exceptions return null; writes are best effort. Confirmation requires its ID to match the URL. | `components/lastOrder.ts`, `components/OrderConfirmation.tsx` |

Cart hydration guards writes until saved items and promo state are read, but storage access exceptions are not caught there. Items and valid codes persist across reloads/visits until changed or cleared; clearing writes `[]` for the cart and removes the promo key (`components/CartProvider.tsx`).

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

`Promotion` in `lib/promotions.ts` has `code: string`, `description: string`, and `discountCents(lines: PricedLine[]): number`. `PROMOTIONS` is a `Promotion[]` containing `SAVE10`; `findPromotion(code)` trims/uppercases input and returns a matching promotion or null. `calculateCartTotal(items, promoCode?)` in `lib/pricing.ts` filters out lines with quantity at least three before the callback (FIN-212), so promo codes never stack with bulk pricing. SAVE10 rounds 10% of the combined eligible subtotal once; the dispatcher subtracts that discount and clamps at zero. Unknown codes leave the subtotal unchanged in this pure helper, unlike HTTP validation. Two Lattes cost 950 cents before SAVE10 and 855 after; three bulk Drip Coffees remain 945 cents (`tests/pricing.test.ts`, `tests/orders.test.ts`).

`cartProperties(items)` calls shared pricing without a code; order properties use the server-priced `Order.totalCents` (`lib/analytics.ts`). The mixed cart above yields `{ lineCount: 2, itemCount: 4, totalCents: 1240 }` (`tests/analytics.test.ts`), even when SAVE10 makes the displayed and final order total 1,210 cents. The exact property keys above are unchanged: neither builder emits promo text or the customer's name. Duplicate merging at the server boundary can still change a malformed restored cart's line grouping (`lib/cart.ts`, `lib/orders.ts`).

See [cart pricing](../features/cart-pricing.md), [checkout](../features/checkout.md), and the [HTTP API](../api.md) for behavior and responses.
