import { describe, expect, it } from "vitest";
import { findPromotion } from "../lib/promotions";

describe("findPromotion", () => {
  it.each(["SAVE10", "save10", "  SaVe10  "])(
    "finds SAVE10 using %j",
    (code) => {
      expect(findPromotion(code)).toMatchObject({
        code: "SAVE10",
        description: "10% off the order",
      });
    }
  );

  it.each(["", "   ", "NOT-A-CODE"])("rejects %j", (code) => {
    expect(findPromotion(code)).toBeNull();
  });

  it("discounts the combined subtotal once, rounding half cents up", () => {
    const promotion = findPromotion("SAVE10");
    expect(
      promotion?.discountCents([
        { productId: "espresso", quantity: 1, lineTotalCents: 295 },
        { productId: "cold-brew", quantity: 1, lineTotalCents: 425 },
      ])
    ).toBe(72);
    expect(
      promotion?.discountCents([
        { productId: "espresso", quantity: 1, lineTotalCents: 295 },
      ])
    ).toBe(30);
    expect(promotion?.discountCents([])).toBe(0);
  });
});
