import { describe, expect, it } from "vitest";
import { findPromotion } from "../lib/promotions";

describe("findPromotion", () => {
  it.each(["SAVE10", "save10", "  SaVe10  "])(
    "finds and normalizes %s",
    (code) => {
      expect(findPromotion(code)).toMatchObject({
        code: "SAVE10",
        description: "10% off the order",
      });
    }
  );

  it.each(["", "   ", "SAVE", "SAVE100", "NOT-A-CODE"])(
    "rejects an inactive code: %s",
    (code) => {
      expect(findPromotion(code)).toBeNull();
    }
  );

  it("gives no discount for an empty order", () => {
    expect(findPromotion("SAVE10")?.discountCents([])).toBe(0);
  });

  it.each([
    [294, 29],
    [295, 30],
    [296, 30],
  ])("rounds the discount on %i cents to %i cents", (subtotal, discount) => {
    expect(
      findPromotion("SAVE10")?.discountCents([
        { productId: "espresso", quantity: 1, lineTotalCents: subtotal },
      ])
    ).toBe(discount);
  });
});
