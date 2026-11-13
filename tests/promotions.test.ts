import { describe, expect, it } from "vitest";
import { findPromotion, PROMOTIONS } from "../lib/promotions";
import type { PricedLine } from "../lib/types";

describe("findPromotion", () => {
  it("matches SAVE10 without case or whitespace sensitivity", () => {
    expect(findPromotion(" save10 ")?.code).toBe("SAVE10");
    expect(findPromotion("SAVE10")?.description).toBe("10% off the order");
  });

  it("returns null for an unknown or blank code", () => {
    expect(findPromotion("UNKNOWN")).toBeNull();
    expect(findPromotion("")).toBeNull();
    expect(findPromotion("   ")).toBeNull();
  });
});

function save10Discount(lines: PricedLine[]): number {
  const promotion = PROMOTIONS.find((item) => item.code === "SAVE10");
  if (!promotion) {
    throw new Error("SAVE10 is not registered");
  }
  return promotion.discountCents(lines);
}

describe("SAVE10 discount", () => {
  function discountFor(subtotalCents: number): number {
    return save10Discount([
      { productId: "latte", quantity: 1, lineTotalCents: subtotalCents },
    ]);
  }

  it("takes 10% of the order's subtotal", () => {
    expect(discountFor(1240)).toBe(124);
  });

  it("returns zero cents off an empty order", () => {
    expect(save10Discount([])).toBe(0);
  });

  it("rounds half a cent up and smaller remainders down", () => {
    expect(discountFor(4)).toBe(0); // 0.4 rounds down
    expect(discountFor(5)).toBe(1); // 0.5 rounds up
    expect(discountFor(14)).toBe(1); // 1.4 rounds down
    expect(discountFor(15)).toBe(2); // 1.5 rounds up
    expect(discountFor(295)).toBe(30); // 29.5 rounds up
  });

  it("sums every line before rounding, not each line separately", () => {
    // Per line: 0.5 + 0.5 would round to 2 cents; the order is 1 cent.
    expect(
      save10Discount([
        { productId: "espresso", quantity: 1, lineTotalCents: 5 },
        { productId: "espresso", quantity: 1, lineTotalCents: 5 },
      ])
    ).toBe(1);
  });
});
