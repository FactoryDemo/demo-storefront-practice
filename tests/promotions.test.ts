import { describe, expect, it } from "vitest";
import { findPromotion } from "../lib/promotions";

describe("findPromotion", () => {
  it("finds SAVE10 regardless of case or surrounding whitespace", () => {
    expect(findPromotion("  save10  ")?.code).toBe("SAVE10");
    expect(findPromotion("SAVE10")?.description).toBe("10% off the order");
  });

  it("does not match blank or unknown codes", () => {
    expect(findPromotion("   ")).toBeNull();
    expect(findPromotion("SAVE100")).toBeNull();
  });

  it("rounds the discount once on the order subtotal, not each line", () => {
    const promotion = findPromotion("SAVE10");
    expect(
      promotion?.discountCents([
        { productId: "espresso", quantity: 1, lineTotalCents: 295 },
        { productId: "cold-brew", quantity: 1, lineTotalCents: 425 },
      ])
    ).toBe(72);
    expect(promotion?.discountCents([])).toBe(0);
  });
});
