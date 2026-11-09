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

  it("takes SAVE10 off only non-bulk lines in a mixed cart", () => {
    const items: CartItem[] = [
      { productId: "drip", quantity: 3 }, // bulk: 945
      { productId: "espresso", quantity: 1 }, // regular: 295
    ];
    // FIN-212: retain $9.45 bulk pricing; $2.95 less $0.30 = $2.65.
    expect(calculateCartTotal(items, "SAVE10")).toBe(1210);
    expect(calculateCartTotal(items, "  save10  ")).toBe(1210);
  });

  it.each(PRODUCTS)("never stacks promos on bulk-priced $id", (product) => {
    for (const quantity of [3, 4, 99]) {
      const items = [{ productId: product.id, quantity }];
      for (const promotion of PROMOTIONS) {
        expect(calculateCartTotal(items, promotion.code)).toBe(
          calculateLineTotal(product, quantity)
        );
      }
    }
  });

  it("keeps FIN-212's three Espressos at 797 cents with SAVE10", () => {
    expect(
      calculateCartTotal([{ productId: "espresso", quantity: 3 }], "SAVE10")
    ).toBe(797);
  });

  it("rounds once across eligible lines while leaving bulk lines unchanged", () => {
    expect(
      calculateCartTotal(
        [
          { productId: "drip", quantity: 3 },
          { productId: "espresso", quantity: 1 },
          { productId: "latte", quantity: 1 },
        ],
        "SAVE10"
      )
    ).toBe(1638); // 945 + 770 - 77
    expect(
      calculateCartTotal([{ productId: "drip", quantity: 2 }], "SAVE10")
    ).toBe(630);
  });

  it("rounds the order discount to the nearest cent", () => {
    expect(
      calculateCartTotal([{ productId: "espresso", quantity: 1 }], "SAVE10")
    ).toBe(265); // 295 less a rounded 30-cent discount
    expect(
      calculateCartTotal(
        [
          { productId: "espresso", quantity: 1 },
          { productId: "latte", quantity: 1 },
        ],
        "SAVE10"
      )
    ).toBe(693); // 770 less 77 cents, not two rounded discounts
  });

  it("keeps empty and invalid-only carts at zero with SAVE10", () => {
    expect(calculateCartTotal([], "SAVE10")).toBe(0);
    expect(
      calculateCartTotal(
        [
          { productId: "does-not-exist", quantity: 3 },
          { productId: "drip", quantity: 0 },
          { productId: "latte", quantity: -1 },
        ],
        "SAVE10"
      )
    ).toBe(0);
  });

  it.each(["", "   "])("ignores a blank promo code %j", (code) => {
    expect(
      calculateCartTotal([{ productId: "drip", quantity: 1 }], code)
    ).toBe(350);
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
