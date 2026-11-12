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
    description: "10% off your order",
    discountCents: (lines) => {
      const subtotalCents = lines.reduce(
        (sum, line) => sum + line.lineTotalCents,
        0
      );
      const wholeTenths = Math.floor(subtotalCents / 10);
      const remainderCents = subtotalCents % 10;
      return wholeTenths + (remainderCents >= 5 ? 1 : 0);
    },
  },
];

export function findPromotion(code: string): Promotion | null {
  const normalized = code.trim().toUpperCase();
  return PROMOTIONS.find((promotion) => promotion.code === normalized) ?? null;
}
