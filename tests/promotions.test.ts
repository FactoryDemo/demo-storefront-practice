import { describe, expect, it } from "vitest";
import { findPromotion } from "../lib/promotions";
import type { PricedLine } from "../lib/types";

function line(lineTotalCents: number): PricedLine {
  return { productId: "espresso", quantity: 1, lineTotalCents };
}

describe("findPromotion", () => {
  it.each(["SAVE10", "save10", "  SaVe10  "])(
    "recognizes and normalizes %j",
    (code) => {
      expect(findPromotion(code)).toMatchObject({
        code: "SAVE10",
        description: "10% off non-bulk items",
      });
    }
  );

  it.each(["", "   ", "SAVE", "SAVE100", "NOT-A-CODE"])(
    "does not recognize %j",
    (code) => {
      expect(findPromotion(code)).toBeNull();
    }
  );
});

describe("SAVE10 discount", () => {
  it.each([
    [0, 0],
    [294, 29],
    [295, 30],
    [296, 30],
    [1240, 124],
  ])("discounts a %i-cent subtotal by %i cents", (subtotal, discount) => {
    expect(findPromotion("SAVE10")?.discountCents([line(subtotal)])).toBe(
      discount
    );
  });

  it("rounds once across the order, not separately for each line", () => {
    expect(
      findPromotion("SAVE10")?.discountCents([line(295), line(295)])
    ).toBe(59);
  });

  it("does not discount an empty order", () => {
    expect(findPromotion("SAVE10")?.discountCents([])).toBe(0);
  });
});
