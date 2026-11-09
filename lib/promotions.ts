import type { PricedLine } from "./types";

export type Promotion = {
  /** Uppercase code a customer types in the cart, e.g. "SAVE10". */
  code: string;
  description: string;
  /** Cents off the order, given only lines without a bulk discount. */
  discountCents(lines: PricedLine[]): number;
};

/** Live promo codes. Matching is case-insensitive. */
export const PROMOTIONS: Promotion[] = [
  {
    code: "SAVE10",
    description: "10% off non-bulk items",
    discountCents(lines) {
      const subtotal = lines.reduce(
        (sum, line) => sum + line.lineTotalCents,
        0
      );
      // Round 10% of the eligible subtotal once, using integer cents.
      return Math.floor((subtotal + 5) / 10);
    },
  },
];

export function findPromotion(code: string): Promotion | null {
  const normalized = code.trim().toUpperCase();
  return PROMOTIONS.find((promotion) => promotion.code === normalized) ?? null;
}
