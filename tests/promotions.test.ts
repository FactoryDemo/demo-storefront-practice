import { describe, expect, it } from "vitest";
import { findPromotion, PROMOTIONS } from "../lib/promotions";
import type { PricedLine } from "../lib/types";

describe("findPromotion", () => {
  it("matches SAVE10 without case or whitespace sensitivity", () => {
    expect(findPromotion(" save10 ")?.code).toBe("SAVE10");
    expect(findPromotion("SAVE10")?.description).toBe("10% off your order");
  });

  it("returns null for an unknown code", () => {
    expect(findPromotion("UNKNOWN")).toBeNull();
  });
});

describe("SAVE10 discount", () => {
  const save10 = PROMOTIONS[0];

  it("discounts the priced order subtotal, including bulk-discounted lines", () => {
    const lines: PricedLine[] = [
      { productId: "drip", quantity: 3, lineTotalCents: 945 },
      { productId: "espresso", quantity: 1, lineTotalCents: 295 },
    ];
    expect(save10.discountCents(lines)).toBe(124);
  });

  it("rounds half-cent discounts up once for the order", () => {
    expect(
      save10.discountCents([
        { productId: "espresso", quantity: 1, lineTotalCents: 295 },
      ])
    ).toBe(30);
    expect(
      save10.discountCents([
        { productId: "espresso", quantity: 2, lineTotalCents: 590 },
      ])
    ).toBe(59);
  });

  it("returns zero cents off an empty order", () => {
    expect(save10.discountCents([])).toBe(0);
  });
});
