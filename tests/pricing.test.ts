import { describe, expect, it } from "vitest";
import { getProduct, PRODUCTS } from "../lib/products";
import { PROMOTIONS } from "../lib/promotions";
import {
  calculateCartTotal,
  calculateLineTotal,
  BULK_DISCOUNT_THRESHOLD,
} from "../lib/pricing";
import { formatCurrency } from "../lib/currency";
import type { CartItem } from "../lib/types";

describe("calculateLineTotal", () => {
  it("returns the simple total below the bulk discount threshold", () => {
    const drip = getProduct("drip"); // 350 cents
    expect(calculateLineTotal(drip, 2)).toBe(700);
  });

  it("applies the bulk discount when buying three or more of one item", () => {
    const drip = getProduct("drip"); // 350 cents
    const gross = 350 * BULK_DISCOUNT_THRESHOLD; // 1050
    const expected = Math.round(gross * 0.9); // 945
    expect(calculateLineTotal(drip, BULK_DISCOUNT_THRESHOLD)).toBe(expected);
  });

  it("keeps applying the discount for larger quantities", () => {
    const beans = getProduct("beans"); // 1500 cents
    expect(calculateLineTotal(beans, 5)).toBe(Math.round(7500 * 0.9));
  });

  it("returns 0 for zero or negative quantities", () => {
    expect(calculateLineTotal(getProduct("latte"), 0)).toBe(0);
    expect(calculateLineTotal(getProduct("latte"), -2)).toBe(0);
  });
});

describe("calculateCartTotal", () => {
  it("sums line totals across the cart", () => {
    const items: CartItem[] = [
      { productId: "espresso", quantity: 1 }, // 295
      { productId: "latte", quantity: 2 }, // 950
    ];
    expect(calculateCartTotal(items)).toBe(1245);
  });

  it("mixes discounted and undiscounted lines correctly", () => {
    const items: CartItem[] = [
      { productId: "drip", quantity: 3 }, // bulk: 945
      { productId: "cold-brew", quantity: 1 }, // regular: 425
    ];
    expect(calculateCartTotal(items)).toBe(1370);
  });

  it("ignores lines with unknown products or zero quantities", () => {
    const items: CartItem[] = [
      { productId: "espresso", quantity: 1 },
      { productId: "does-not-exist", quantity: 3 },
      { productId: "drip", quantity: 0 },
    ];
    expect(calculateCartTotal(items)).toBe(295);
  });

  it("returns 0 for an empty cart", () => {
    expect(calculateCartTotal([])).toBe(0);
  });

  it("ignores unknown promo codes", () => {
    const items: CartItem[] = [{ productId: "latte", quantity: 2 }]; // 950
    expect(calculateCartTotal(items, "NOT-A-CODE")).toBe(950);
  });

  it("takes 10% off the order with SAVE10", () => {
    const items: CartItem[] = [
      { productId: "drip", quantity: 2 }, // 700
      { productId: "espresso", quantity: 2 }, // 590, subtotal 1290
    ];
    expect(calculateCartTotal(items, "SAVE10")).toBe(1161);
  });

  it("never stacks a promo code with bulk pricing (FIN-212)", () => {
    for (const product of PRODUCTS) {
      for (const quantity of [3, 4, 99]) {
        const items = [{ productId: product.id, quantity }];
        for (const promotion of PROMOTIONS) {
          expect(calculateCartTotal(items, promotion.code)).toBe(
            calculateCartTotal(items)
          );
        }
      }
    }
    expect(
      calculateCartTotal([{ productId: "espresso", quantity: 3 }], "SAVE10")
    ).toBe(797);
  });

  it("discounts only non-bulk lines in a mixed cart", () => {
    const items = [
      { productId: "drip", quantity: 3 }, // bulk: 945
      { productId: "espresso", quantity: 1 }, // SAVE10: 295 - 30
    ];
    expect(calculateCartTotal(items, "SAVE10")).toBe(1210);
    expect(calculateCartTotal([...items].reverse(), "SAVE10")).toBe(1210);
  });

  it("re-evaluates promo eligibility when crossing the bulk threshold", () => {
    for (const quantity of [2, 3, 4, 2]) {
      const expected = { 2: 531, 3: 797, 4: 1062 }[quantity];
      expect(
        calculateCartTotal([{ productId: "espresso", quantity }], "SAVE10")
      ).toBe(expected);
    }
  });

  it("matches SAVE10 case-insensitively and ignores whitespace", () => {
    const items: CartItem[] = [{ productId: "latte", quantity: 2 }]; // 950
    expect(calculateCartTotal(items, " save10 ")).toBe(855);
  });

  it("rounds the SAVE10 discount to the nearest cent", () => {
    const items: CartItem[] = [{ productId: "espresso", quantity: 1 }]; // 295
    expect(calculateCartTotal(items, "SAVE10")).toBe(265); // 29.5 rounds to 30
  });

  it("leaves an empty cart at 0 with SAVE10", () => {
    expect(calculateCartTotal([], "SAVE10")).toBe(0);
  });

  it("ignores an empty promo code", () => {
    const items: CartItem[] = [{ productId: "latte", quantity: 2 }];
    expect(calculateCartTotal(items, "")).toBe(950);
  });
});

describe("formatCurrency", () => {
  it("formats typical amounts", () => {
    expect(formatCurrency(1234)).toBe("$12.34");
    expect(formatCurrency(295)).toBe("$2.95");
  });

  it("formats zero and large amounts", () => {
    expect(formatCurrency(0)).toBe("$0.00");
    expect(formatCurrency(123456)).toBe("$1,234.56");
  });
});
