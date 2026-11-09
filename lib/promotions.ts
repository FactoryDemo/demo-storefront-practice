import type { PricedLine } from "./types";
import { BULK_DISCOUNT_THRESHOLD } from "./discounts";

export type Promotion = {
  /** Uppercase code a customer types at checkout, e.g. "WELCOME". */
  code: string;
  description: string;
  /** Cents off the order, excluding bulk-priced lines (FIN-212). */
  discountCents(lines: PricedLine[]): number;
};

/** Live promo codes. Matching is case-insensitive. */
export const PROMOTIONS: Promotion[] = [
  {
    code: "SAVE10",
    description: "10% off non-bulk items",
    discountCents: (lines) => {
      const subtotal = lines
        .filter((line) => line.quantity < BULK_DISCOUNT_THRESHOLD)
        .reduce((sum, line) => sum + line.lineTotalCents, 0);
      // Round the 10% discount to the nearest cent, with half cents up.
      return Math.floor((subtotal + 5) / 10);
    },
  },
];

export function findPromotion(code: string): Promotion | null {
  const normalized = code.trim().toUpperCase();
  return PROMOTIONS.find((promotion) => promotion.code === normalized) ?? null;
}
