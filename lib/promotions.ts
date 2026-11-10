import type { PricedLine } from "./types";

export type Promotion = {
  /** Uppercase code a customer types in the cart, e.g. "SAVE10". */
  code: string;
  description: string;
  /** Cents off the order, given its lines after bulk pricing. */
  discountCents(lines: PricedLine[]): number;
};

/** Live promo codes. Matching is case-insensitive. */
export const PROMOTIONS: Promotion[] = [
  {
    code: "SAVE10",
    description: "10% off the order",
    discountCents(lines) {
      const subtotal = lines.reduce(
        (sum, line) => sum + line.lineTotalCents,
        0
      );
      // One tenth of the subtotal, rounded to the nearest cent (halves up).
      return Math.floor((subtotal + 5) / 10);
    },
  },
];

export function findPromotion(code: string): Promotion | null {
  const normalized = code.trim().toUpperCase();
  return PROMOTIONS.find((promotion) => promotion.code === normalized) ?? null;
}
