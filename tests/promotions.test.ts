import { describe, expect, it } from "vitest";
import {
  findPromotion,
  normalizePromoCode,
  PROMOTIONS,
} from "../lib/promotions";
import type { PricedLine } from "../lib/types";

function line(lineTotalCents: number): PricedLine {
  return { productId: "espresso", quantity: 1, lineTotalCents };
}

function save10() {
  const promotion = findPromotion("SAVE10");
  if (!promotion) {
    throw new Error("SAVE10 must be registered");
  }
  return promotion;
}

describe("normalizePromoCode", () => {
  it("trims and uppercases a typed code", () => {
    expect(normalizePromoCode("  save10 ")).toBe("SAVE10");
  });
});

describe("findPromotion", () => {
  it("finds SAVE10 regardless of case or surrounding spaces", () => {
    expect(findPromotion("SAVE10")?.code).toBe("SAVE10");
    expect(findPromotion("save10")?.code).toBe("SAVE10");
    expect(findPromotion(" Save10 ")?.code).toBe("SAVE10");
  });

  it("returns null for unknown or near-miss codes", () => {
    expect(findPromotion("SAVE")).toBeNull();
    expect(findPromotion("SAVE100")).toBeNull();
    expect(findPromotion("")).toBeNull();
  });

  it("registers SAVE10 once", () => {
    expect(PROMOTIONS.map((promotion) => promotion.code)).toEqual(["SAVE10"]);
  });
});

describe("SAVE10 discount", () => {
  it("takes 10% of the order subtotal", () => {
    expect(save10().discountCents([line(1240)])).toBe(124);
  });

  it("rounds half up to the nearest cent", () => {
    // 10% of 295 is 29.5 cents, which rounds up to 30.
    expect(save10().discountCents([line(295)])).toBe(30);
    // 10% of 294 is 29.4 cents, which rounds down to 29.
    expect(save10().discountCents([line(294)])).toBe(29);
    // 10% of 1005 is 100.5 cents, which rounds up to 101.
    expect(save10().discountCents([line(1005)])).toBe(101);
  });

  it("gives nothing off an empty order or a zero subtotal", () => {
    expect(save10().discountCents([])).toBe(0);
    expect(save10().discountCents([line(0)])).toBe(0);
  });

  it("sums every line before taking the percentage", () => {
    expect(save10().discountCents([line(295), line(295), line(295)])).toBe(89);
  });
});
