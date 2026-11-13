import type { PricedLine } from "./types";

export type Promotion = {
  /** Uppercase code a customer types in the cart, e.g. "SAVE10". */
  code: string;
  description: string;
  /**
   * Cents off, given the lines the promo may discount. `priceCart` passes
   * only lines that are not bulk-priced, since promos never stack with bulk.
   */
  discountCents(lines: PricedLine[]): number;
};

/** Percent off the whole order, applied after bulk pricing. */
const SAVE10_PERCENT = 10;

/** Live promo codes. Matching is case-insensitive. */
export const PROMOTIONS: Promotion[] = [
  {
    code: "SAVE10",
    description: "10% off the order",
    discountCents: (lines) => percentOf(sumLines(lines), SAVE10_PERCENT),
  },
];

/** Trim and uppercase a typed code so it can be compared with `code`. */
export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase();
}

export function findPromotion(code: string): Promotion | null {
  const normalized = normalizePromoCode(code);
  return PROMOTIONS.find((promotion) => promotion.code === normalized) ?? null;
}

function sumLines(lines: PricedLine[]): number {
  return lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
}

/** `percent` of `cents`, rounded half up to the nearest cent. Integer math only. */
function percentOf(cents: number, percent: number): number {
  return Math.floor((cents * percent + 50) / 100);
}
