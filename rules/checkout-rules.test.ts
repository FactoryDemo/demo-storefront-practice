/**
 * Checkout rules, owned by Finance (FIN-212).
 *
 * These encode pricing policy, not implementation details. If one fails,
 * the pricing code is wrong; changing an expectation here needs Finance
 * sign-off. Runs in CI on every pull request.
 */
import { describe, expect, it } from "vitest";
import { BULK_DISCOUNT_THRESHOLD, calculateCartTotal, calculateLineTotal } from "../lib/pricing";
import { PRODUCTS } from "../lib/products";
import { PROMOTIONS } from "../lib/promotions";
import type { CartItem } from "../lib/types";

const SAMPLE_CARTS: CartItem[][] = [
  [{ productId: "espresso", quantity: 1 }],
  [{ productId: "latte", quantity: 3 }],
  [
    { productId: "drip", quantity: 4 },
    { productId: "cold-brew", quantity: 1 },
  ],
  [
    { productId: "beans", quantity: 2 },
    { productId: "espresso", quantity: 6 },
    { productId: "latte", quantity: 1 },
  ],
];

describe("bulk pricing", () => {
  it("never takes more than 10% off a line", () => {
    for (const product of PRODUCTS) {
      for (let quantity = 1; quantity <= 12; quantity++) {
        const gross = product.priceCents * quantity;
        expect(calculateLineTotal(product, quantity)).toBeGreaterThanOrEqual(
          Math.floor((gross * 9) / 10)
        );
      }
    }
  });
});

describe("promo codes", () => {
  it("are unique and uppercase", () => {
    const codes = PROMOTIONS.map((promotion) => promotion.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const code of codes) {
      expect(code).toBe(code.toUpperCase());
    }
  });

  it("produce whole-cent, non-negative totals", () => {
    for (const promotion of PROMOTIONS) {
      for (const cart of SAMPLE_CARTS) {
        const total = calculateCartTotal(cart, promotion.code);
        expect(Number.isInteger(total)).toBe(true);
        expect(total).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("never stack with the bulk discount", () => {
    for (const promotion of PROMOTIONS) {
      for (const product of PRODUCTS) {
        const bulkCart: CartItem[] = [
          { productId: product.id, quantity: BULK_DISCOUNT_THRESHOLD },
        ];
        expect(
          calculateCartTotal(bulkCart, promotion.code),
          `${promotion.code} discounted an already bulk-priced ${product.name} line`
        ).toBe(calculateCartTotal(bulkCart));
      }
    }
  });
});
