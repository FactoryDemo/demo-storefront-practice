import { describe, expect, it } from "vitest";
import { calculateCartTotal } from "../lib/pricing";
import { PRODUCTS } from "../lib/products";
import { PROMOTIONS } from "../lib/promotions";

describe("FIN-212: promo codes never stack with bulk pricing", () => {
  it("preserves every bulk-priced product total for every promotion", () => {
    for (const product of PRODUCTS) {
      for (const quantity of [3, 4, 99]) {
        const cart = [{ productId: product.id, quantity }];
        for (const promotion of PROMOTIONS) {
          expect(calculateCartTotal(cart, promotion.code)).toBe(
            calculateCartTotal(cart)
          );
        }
      }
    }
  });

  it("keeps the reported Espresso bulk total at 797 cents", () => {
    expect(
      calculateCartTotal([{ productId: "espresso", quantity: 3 }], "SAVE10")
    ).toBe(797);
  });

  it("discounts only non-bulk lines in a mixed cart, rounding once", () => {
    expect(
      calculateCartTotal(
        [
          { productId: "drip", quantity: 3 },
          { productId: "espresso", quantity: 1 },
          { productId: "latte", quantity: 1 },
        ],
        "SAVE10"
      )
    ).toBe(1638); // 945 + 770 - 77, not 945 + 265 + 427.
  });
});
