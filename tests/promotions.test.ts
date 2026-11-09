import { describe, expect, it } from "vitest";
import { findPromotion } from "../lib/promotions";

describe("findPromotion", () => {
  it.each(["SAVE10", "save10", "  SaVe10  "])(
    "matches and normalizes %j",
    (code) => {
      expect(findPromotion(code)).toMatchObject({
        code: "SAVE10",
        description: "10% off non-bulk items",
      });
    }
  );

  it.each(["", "  ", "SAVE", "SAVE100", "NOT-A-CODE"])(
    "does not match %j",
    (code) => {
      expect(findPromotion(code)).toBeNull();
    }
  );

  it.each([
    [0, 0],
    [4, 0],
    [5, 1],
    [6, 1],
    [295, 30],
    [945, 95],
    [1240, 124],
  ])("rounds the discount on %i cents to %i cents", (subtotal, expected) => {
    const promotion = findPromotion("SAVE10");
    expect(
      promotion?.discountCents([
        { productId: "drip", quantity: 1, lineTotalCents: subtotal },
      ])
    ).toBe(expected);
  });

  it("rounds once for the whole order, not separately per line", () => {
    expect(
      findPromotion("SAVE10")?.discountCents([
        { productId: "espresso", quantity: 1, lineTotalCents: 295 },
        { productId: "latte", quantity: 1, lineTotalCents: 475 },
      ])
    ).toBe(77);
    expect(findPromotion("SAVE10")?.discountCents([])).toBe(0);
  });
});
