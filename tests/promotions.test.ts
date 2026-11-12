import { describe, expect, it } from "vitest";
import { findPromotion } from "../lib/promotions";

describe("findPromotion", () => {
  it("matches SAVE10 without regard to case or surrounding whitespace", () => {
    expect(findPromotion("  SaVe10  ")?.code).toBe("SAVE10");
  });

  it("does not match empty, unknown, or partial codes", () => {
    for (const code of ["", " ", "SAVE", "SAVE100", "NOT-A-CODE"]) {
      expect(findPromotion(code)).toBeNull();
    }
  });

  it.each([
    [294, 29],
    [295, 30],
    [296, 30],
    [0, 0],
  ])("rounds the discount on %i cents to %i cents", (subtotal, discount) => {
    expect(
      findPromotion("SAVE10")?.discountCents([
        { productId: "espresso", quantity: 1, lineTotalCents: subtotal },
      ])
    ).toBe(discount);
  });
});
