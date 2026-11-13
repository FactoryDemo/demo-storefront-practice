import type { PricedLine } from "./types";

export type Promotion = {
  /** Uppercase code a customer types at checkout, e.g. "WELCOME". */
  code: string;
  description: string;
  /** Cents off the order, given its lines after bulk pricing. */
  discountCents(lines: PricedLine[]): number;
};

const SAVE10_RATE = 0.1;

/** Live promo codes. Matching is case-insensitive. */
export const PROMOTIONS: Promotion[] = [
  {
    code: "SAVE10",
    description: "Launch promo: 10% off the order",
    discountCents: (lines) => {
      const subtotal = lines.reduce(
        (sum, line) => sum + line.lineTotalCents,
        0
      );
      return Math.round(subtotal * SAVE10_RATE);
    },
  },
];

export function findPromotion(code: string): Promotion | null {
  const normalized = code.trim().toUpperCase();
  return PROMOTIONS.find((promotion) => promotion.code === normalized) ?? null;
}
