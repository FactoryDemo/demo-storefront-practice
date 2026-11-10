import { describe, expect, it } from "vitest";
import { getProduct, PRODUCTS } from "../lib/products";
import { PROMOTIONS } from "../lib/promotions";
import {
  calculateCartTotal,
  calculateLineTotal,
  calculatePromoDiscount,
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

  it.each(["SAVE10", "save10", "  SaVe10  "])(
    "takes 10%% off the whole order with %j",
    (promoCode) => {
      expect(
        calculateCartTotal(
          [
            { productId: "espresso", quantity: 1 }, // 295
            { productId: "latte", quantity: 2 }, // 950
          ],
          promoCode
        )
      ).toBe(1120); // 1245 - 125, rounded once
    }
  );

  it("applies SAVE10 only to non-bulk lines in a mixed cart", () => {
    const items = [
      { productId: "drip", quantity: 3 },
      { productId: "espresso", quantity: 1 },
    ];
    expect(calculateCartTotal(items, "SAVE10")).toBe(1210); // 945 + 295 - 30
    expect(calculateLineTotal(getProduct("drip"), 3)).toBe(945);
  });

  it.each([
    [1, 315],
    [2, 630],
    [3, 945],
  ])("recalculates SAVE10 for %i drip coffees", (quantity, total) => {
    expect(
      calculateCartTotal([{ productId: "drip", quantity }], "SAVE10")
    ).toBe(total);
  });

  it("never stacks any promo with bulk pricing for any catalog product", () => {
    // FIN-212: Finance's checkout rule, including the rounded Espresso case.
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

  it("only discounts valid positive-quantity lines", () => {
    expect(
      calculateCartTotal(
        [
          { productId: "espresso", quantity: 1 },
          { productId: "missing", quantity: 3 },
          { productId: "drip", quantity: 0 },
          { productId: "latte", quantity: -1 },
        ],
        "SAVE10"
      )
    ).toBe(265);
    expect(calculateCartTotal([], "SAVE10")).toBe(0);
  });

  it("leaves the cart unchanged for a blank promo code", () => {
    expect(
      calculateCartTotal([{ productId: "drip", quantity: 3 }], "  ")
    ).toBe(945);
  });
});

describe("calculatePromoDiscount", () => {
  const lines = [{ productId: "drip", quantity: 3, lineTotalCents: 945 }];

  it("does not discount bulk-priced lines", () => {
    expect(calculatePromoDiscount(lines, "SAVE10")).toBe(0);
    expect(calculatePromoDiscount([], "SAVE10")).toBe(0);
  });

  it("rounds once across eligible lines while excluding bulk lines", () => {
    expect(
      calculatePromoDiscount(
        [
          ...lines,
          { productId: "espresso", quantity: 1, lineTotalCents: 295 },
          { productId: "latte", quantity: 1, lineTotalCents: 475 },
        ],
        "SAVE10"
      )
    ).toBe(77);
  });

  it.each([undefined, "", "unknown"])(
    "returns no savings for %j",
    (promoCode) => {
      expect(calculatePromoDiscount(lines, promoCode)).toBe(0);
    }
  );
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
