import type { PricedLine } from "./types";

export type Promotion = {
  /** Uppercase code a customer types at checkout, e.g. "WELCOME". */
  code: string;
  description: string;
  /** Cents off the order, given its lines after bulk pricing. */
  discountCents(lines: PricedLine[]): number;
};

/** Live promo codes. Matching is case-insensitive. */
export const PROMOTIONS: Promotion[] = [
  {
    code: "SAVE10",
    description: "Launch promo: 10% off your order",
    discountCents: (lines) =>
      Math.round(
        lines.reduce((sum, line) => sum + line.lineTotalCents, 0) * 0.1
      ),
  },
];

export function findPromotion(code: string): Promotion | null {
  const normalized = code.trim().toUpperCase();
  return PROMOTIONS.find((promotion) => promotion.code === normalized) ?? null;
}
