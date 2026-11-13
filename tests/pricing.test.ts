import { describe, expect, it } from "vitest";
import { getProduct } from "../lib/products";
import {
  calculateCartTotal,
  calculateLineTotal,
  BULK_DISCOUNT_THRESHOLD,
  priceCart,
} from "../lib/pricing";
import { formatCurrency } from "../lib/currency";
import type { CartItem } from "../lib/types";

describe("calculateLineTotal", () => {
  it("returns the simple total below the bulk discount threshold", () => {
    const drip = getProduct("drip"); // 350 cents
    expect(calculateLineTotal(drip, 2)).toBe(700);
  });

  it("applies the bulk discount when buying three or more of one item", () => {
    const drip = getProduct("drip"); // 350 cents
    const gross = 350 * BULK_DISCOUNT_THRESHOLD; // 1050
    const expected = Math.round(gross * 0.9); // 945
    expect(calculateLineTotal(drip, BULK_DISCOUNT_THRESHOLD)).toBe(expected);
  });

  it("keeps applying the discount for larger quantities", () => {
    const beans = getProduct("beans"); // 1500 cents
    expect(calculateLineTotal(beans, 5)).toBe(Math.round(7500 * 0.9));
  });

  it("returns 0 for zero or negative quantities", () => {
    expect(calculateLineTotal(getProduct("latte"), 0)).toBe(0);
    expect(calculateLineTotal(getProduct("latte"), -2)).toBe(0);
  });
});

describe("calculateCartTotal", () => {
  it("sums line totals across the cart", () => {
    const items: CartItem[] = [
      { productId: "espresso", quantity: 1 }, // 295
      { productId: "latte", quantity: 2 }, // 950
    ];
    expect(calculateCartTotal(items)).toBe(1245);
  });

  it("mixes discounted and undiscounted lines correctly", () => {
    const items: CartItem[] = [
      { productId: "drip", quantity: 3 }, // bulk: 945
      { productId: "cold-brew", quantity: 1 }, // regular: 425
    ];
    expect(calculateCartTotal(items)).toBe(1370);
  });

  it("ignores lines with unknown products or zero quantities", () => {
    const items: CartItem[] = [
      { productId: "espresso", quantity: 1 },
      { productId: "does-not-exist", quantity: 3 },
      { productId: "drip", quantity: 0 },
    ];
    expect(calculateCartTotal(items)).toBe(295);
  });

  it("returns 0 for an empty cart", () => {
    expect(calculateCartTotal([])).toBe(0);
  });

  it("ignores unknown promo codes", () => {
    const items: CartItem[] = [{ productId: "latte", quantity: 2 }]; // 950
    expect(calculateCartTotal(items, "NOT-A-CODE")).toBe(950);
  });
});

describe("priceCart with a promo code", () => {
  it("takes 10% off only the lines below the bulk threshold (FIN-212)", () => {
    const items: CartItem[] = [
      { productId: "drip", quantity: 3 }, // bulk: 945, no promo
      { productId: "espresso", quantity: 1 }, // 295, 10% off is 30
    ];
    expect(priceCart(items, "SAVE10")).toEqual({
      lines: [
        { productId: "drip", quantity: 3, lineTotalCents: 945 },
        { productId: "espresso", quantity: 1, lineTotalCents: 295 },
      ],
      subtotalCents: 1240,
      promoCode: "SAVE10",
      discountCents: 30,
      totalCents: 1210,
    });
  });

  it("never stacks the promo on a bulk-priced line (FIN-212)", () => {
    const items: CartItem[] = [{ productId: "espresso", quantity: 3 }]; // bulk: 797
    expect(calculateCartTotal(items, "SAVE10")).toBe(797);
    expect(priceCart(items, "SAVE10")).toMatchObject({
      promoCode: "SAVE10",
      discountCents: 0,
      totalCents: 797,
    });
  });

  it("treats a line of exactly two as below the bulk threshold", () => {
    const items: CartItem[] = [{ productId: "espresso", quantity: 2 }]; // 590
    expect(priceCart(items, "SAVE10")).toMatchObject({
      discountCents: 59,
      totalCents: 531,
    });
  });

  it("applies the code regardless of case and surrounding spaces", () => {
    const items: CartItem[] = [{ productId: "latte", quantity: 2 }]; // 950
    expect(calculateCartTotal(items, " save10 ")).toBe(855);
  });

  it("reports no discount for an unknown code", () => {
    const items: CartItem[] = [{ productId: "latte", quantity: 2 }];
    expect(priceCart(items, "NOT-A-CODE")).toEqual({
      lines: [{ productId: "latte", quantity: 2, lineTotalCents: 950 }],
      subtotalCents: 950,
      promoCode: null,
      discountCents: 0,
      totalCents: 950,
    });
  });

  it("reports no discount when no code is given", () => {
    const items: CartItem[] = [{ productId: "latte", quantity: 2 }];
    expect(priceCart(items).discountCents).toBe(0);
    expect(priceCart(items, undefined).promoCode).toBeNull();
  });

  it("gives nothing off an empty cart", () => {
    expect(priceCart([], "SAVE10")).toMatchObject({
      subtotalCents: 0,
      discountCents: 0,
      totalCents: 0,
      promoCode: "SAVE10",
    });
  });

  it("rounds the discount half up to the nearest cent", () => {
    const items: CartItem[] = [{ productId: "espresso", quantity: 1 }]; // 295
    expect(priceCart(items, "SAVE10")).toMatchObject({
      discountCents: 30,
      totalCents: 265,
    });
  });

  it("never takes the total below zero", () => {
    expect(priceCart([], "SAVE10").totalCents).toBe(0);
  });
});

describe("formatCurrency", () => {
  it("formats typical amounts", () => {
    expect(formatCurrency(1234)).toBe("$12.34");
    expect(formatCurrency(295)).toBe("$2.95");
  });

  it("formats zero and large amounts", () => {
    expect(formatCurrency(0)).toBe("$0.00");
    expect(formatCurrency(123456)).toBe("$1,234.56");
  });
});
