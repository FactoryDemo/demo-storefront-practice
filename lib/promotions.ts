import type { PricedLine } from "./types";

export type Promotion = {
  /** Uppercase code a customer enters in the cart, e.g. "SAVE10". */
  code: string;
  description: string;
  /** Cents off the order, given only lines eligible for promo pricing. */
  discountCents(lines: PricedLine[]): number;
};

/** Live promo codes. Matching is case-insensitive. */
export const PROMOTIONS: Promotion[] = [
  {
    code: "SAVE10",
    description: "10% off non-bulk items",
    discountCents: (lines) => {
      const subtotal = lines.reduce(
        (sum, line) => sum + line.lineTotalCents,
        0
      );
      // Round one tenth of the subtotal to whole cents, without a float rate.
      return Math.floor((subtotal + 5) / 10);
    },
  },
];

export function findPromotion(code: string): Promotion | null {
  const normalized = code.trim().toUpperCase();
  return PROMOTIONS.find((promotion) => promotion.code === normalized) ?? null;
}
