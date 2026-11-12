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

`Cart` is a declared wrapper, but actual shared state and persisted JSON are **`CartItem[]`**, not `{ items: [...] }` (`components/CartProvider.tsx`). Context also exposes `itemCount`, `isLoaded`, `isOpen`, and `addItem`, `changeQuantity`, `clear`, `openCart`, `closeCart` actions.

`PRODUCTS` and `CATEGORIES` are mutable typed arrays with 13 products and four categories (`lib/products.ts`). `getProduct(id)` returns the matching object reference or throws; `productsInCategory` returns a filtered array containing those same references. Neither helper provides immutable snapshots. Names, images, and unit prices are looked up from the current catalog rather than stored on priced lines.

## Orders and validation

`lib/orders.ts` defines:

```ts
type PickupSlotId = "asap" | "in-15" | "in-30" | "in-45" | "in-60";
type PickupSlot = { id: PickupSlotId; label: string };
type OrderRequest = { name: string; pickup: PickupSlotId; items: CartItem[] };
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
4. Only after **all** entries pass are duplicate product IDs summed with a `Map`. Output preserves first-occurrence product order. Two entries of quantity 99 become one quantity-198 line: there is no post-merge 99 cap.

Unknown extra fields are ignored when constructing the validated request. Neither a browser-supplied price nor a total becomes authoritative. `buildOrder` assumes a validated request, re-prices using `lib/pricing.ts`, and serializes its supplied `Date` with `toISOString()`. `app/api/orders/route.ts` supplies an ID of `BB-` plus six uppercase UUID characters and the current timestamp; the type itself does not validate ID format or uniqueness.

## Browser storage boundaries

| Key and storage | JSON shape and checks | Source |
| --- | --- | --- |
| `bean-and-byte:cart`, localStorage | Array filtered to known product IDs and positive integer quantities. Missing/invalid JSON or nonarray input becomes empty. No 99 cap, deduplication, or removal of extra fields from retained objects. | `lib/cart.ts`, `components/CartProvider.tsx` |
| `bean-and-byte:last-order`, sessionStorage | Entire last `Order`; read uses a type assertion, not schema validation. Exceptions return null; writes are best effort. Confirmation requires its ID to match the URL. | `components/lastOrder.ts`, `components/OrderConfirmation.tsx` |

Cart hydration guards writes until the first read, but storage access exceptions are not caught there. Stored duplicates remain separate during browser pricing; server merging can change discount eligibility. Last-order totals survive as JSON, but display labels still resolve against the current catalog. Browser values are neither trusted server records nor cross-device history.

## Analytics and promotions

`lib/analytics.ts` defines `AnalyticsEvent` as `"product_added" | "cart_opened" | "checkout_started" | "order_placed" | "order_failed"`, `FeatureFlag` as `"menu-announcement"`, and `AnalyticsProperties` as `Record<string, string | number | boolean>`. `ReleaseInfo` has optional string fields `repo`, `commitSha`, `environment`. Order properties omit the customer name; the generic record type alone does not enforce privacy.

| Property builder / event | Exact property keys |
| --- | --- |
| `releaseProperties` | `appRepo`, `appVersion`, `appEnvironment` |
| `productAddedProperties` | `productId`, `category`, `priceCents`, `quantityInCart` |
| `cartProperties` | `lineCount`, `itemCount`, `totalCents` |
| `orderProperties` | `orderId`, `pickup`, `lineCount`, `itemCount`, `totalCents` |
| `order_failed` in `components/Checkout.tsx` | `errorCount` |

`Promotion` in `lib/promotions.ts` has `code: string`, `description: string`, and `discountCents(lines: PricedLine[]): number`. Lookup trims/uppercases input; the registry is empty. There is no promotion field in `OrderRequest` or checkout support.

See [cart pricing](../features/cart-pricing.md), [checkout](../features/checkout.md), and the [HTTP API](../api.md) for behavior and responses.
