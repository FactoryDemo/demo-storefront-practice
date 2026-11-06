import { getProduct } from "./products";
import type { CartItem, Product } from "./types";

/** Buy 3 or more of one item and that line is 10% off. */
export const BULK_DISCOUNT_THRESHOLD = 3;
export const BULK_DISCOUNT_RATE = 0.1;

/**
 * Total for a single cart line, in cents.
 * Quantities of BULK_DISCOUNT_THRESHOLD or more get BULK_DISCOUNT_RATE off
 * the line, rounded to the nearest cent.
 */
export function calculateLineTotal(product: Product, quantity: number): number {
  if (quantity <= 0) {
    return 0;
  }
  const gross = product.priceCents * quantity;
  if (quantity >= BULK_DISCOUNT_THRESHOLD) {
    return Math.round(gross * (1 - BULK_DISCOUNT_RATE));
  }
  return gross;
}

/**
 * Total for a whole cart, in cents: the sum of all line totals.
 * Bulk discounts apply per line; a mixed cart can have discounted and
 * undiscounted lines side by side. Lines with unknown products or zero
 * quantities are skipped.
 */
export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((total, item) => {
    if (item.quantity <= 0) {
      return total;
    }
    const product = safeLookup(item.productId);
    if (!product) {
      return total;
    }
    return total + calculateLineTotal(product, item.quantity);
  }, 0);
}

function safeLookup(id: string): Product | null {
  try {
    return getProduct(id);
  } catch {
    return null;
  }
}
