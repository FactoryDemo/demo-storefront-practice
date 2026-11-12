import { getProduct } from "./products";
import { findPromotion } from "./promotions";
import type { CartItem, PricedLine, Product } from "./types";

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
 * Price every valid line in a cart. Lines with unknown products or zero
 * quantities are skipped.
 */
export function priceLines(items: CartItem[]): PricedLine[] {
  const lines: PricedLine[] = [];
  for (const item of items) {
    if (item.quantity <= 0) {
      continue;
    }
    const product = safeLookup(item.productId);
    if (!product) {
      continue;
    }
    lines.push({
      productId: item.productId,
      quantity: item.quantity,
      lineTotalCents: calculateLineTotal(product, item.quantity),
    });
  }
  return lines;
}

/**
 * Total for a whole cart, in cents: the sum of all line totals, less any
 * promo code discount. Bulk discounts apply per line; a mixed cart can have
 * discounted and undiscounted lines side by side. Promos never stack with
 * bulk discounts (FIN-212). Unknown promo codes are
 * ignored, and the total never goes below zero.
 */
export function calculateCartTotal(items: CartItem[], promoCode?: string): number {
  const lines = priceLines(items);
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
  return subtotal - calculatePromoDiscount(lines, promoCode);
}

/** Order discount in cents, excluding bulk-priced lines (FIN-212). */
export function calculatePromoDiscount(
  lines: PricedLine[],
  promoCode?: string
): number {
  const promotion = promoCode ? findPromotion(promoCode) : null;
  if (!promotion) {
    return 0;
  }
  const eligibleLines = lines.filter(
    (line) => line.quantity < BULK_DISCOUNT_THRESHOLD
  );
  const subtotal = eligibleLines.reduce(
    (sum, line) => sum + line.lineTotalCents,
    0
  );
  return Math.max(0, Math.min(subtotal, promotion.discountCents(eligibleLines)));
}

function safeLookup(id: string): Product | null {
  try {
    return getProduct(id);
  } catch {
    return null;
  }
}
