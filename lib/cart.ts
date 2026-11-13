import { PRODUCTS } from "./products";
import { findPromotion, normalizePromoCode } from "./promotions";
import type { CartItem } from "./types";

/** Add one of a product, starting a new line if it is not in the cart. */
export function addItem(items: CartItem[], productId: string): CartItem[] {
  return changeQuantity(items, productId, 1);
}

/** Change a line's quantity by `delta`; lines that reach zero are removed. */
export function changeQuantity(
  items: CartItem[],
  productId: string,
  delta: number
): CartItem[] {
  const exists = items.some((item) => item.productId === productId);
  const next = exists
    ? items.map((item) =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + delta }
          : item
      )
    : [...items, { productId, quantity: delta }];
  return next.filter((item) => item.quantity > 0);
}

export function countItems(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Read a cart saved by an earlier visit. Anything malformed, or products no
 * longer on the menu, is dropped rather than trusted.
 */
export function parseStoredCart(raw: string | null): CartItem[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isStoredItem) : [];
  } catch {
    return [];
  }
}

/**
 * Read the promo code saved by an earlier visit. Only a code that is still
 * live is kept; anything else is dropped.
 */
export function parseStoredPromoCode(raw: string | null): string | null {
  if (!raw) {
    return null;
  }
  const code = normalizePromoCode(raw);
  return findPromotion(code) ? code : null;
}

function isStoredItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const { productId, quantity } = value as Record<string, unknown>;
  return (
    PRODUCTS.some((product) => product.id === productId) &&
    typeof quantity === "number" &&
    Number.isInteger(quantity) &&
    quantity > 0
  );
}
