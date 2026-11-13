import type { PricedLine } from "./types";

export type Promotion = {
  /** Uppercase code a customer types in the cart, e.g. "SAVE10". */
  code: string;
  description: string;
  /**
   * Cents off, given only the full-price lines (bulk-priced lines are
   * excluded by calculateCartTotal, so promo codes never stack with bulk).
   */
  discountCents(lines: PricedLine[]): number;
};

/** Live promo codes. Matching is case-insensitive. */
export const PROMOTIONS: Promotion[] = [
  {
    code: "SAVE10",
    description: "10% off full-price items",
    discountCents: (lines) => {
      const subtotalCents = lines.reduce(
        (sum, line) => sum + line.lineTotalCents,
        0
      );
      // 10% of the subtotal, rounded half up to the nearest cent.
      return Math.floor((subtotalCents + 5) / 10);
    },
  },
];

export function findPromotion(code: string): Promotion | null {
  const normalized = code.trim().toUpperCase();
  return PROMOTIONS.find((promotion) => promotion.code === normalized) ?? null;
}
