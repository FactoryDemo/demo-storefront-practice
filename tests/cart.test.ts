import { describe, expect, it } from "vitest";
import {
  addItem,
  changeQuantity,
  countItems,
  parseStoredCart,
} from "../lib/cart";
import type { CartItem } from "../lib/types";

describe("addItem", () => {
  it("starts a new line, then increments it", () => {
    const once = addItem([], "drip");
    expect(once).toEqual([{ productId: "drip", quantity: 1 }]);
    expect(addItem(once, "drip")).toEqual([{ productId: "drip", quantity: 2 }]);
  });

  it("keeps other lines untouched", () => {
    const items: CartItem[] = [{ productId: "latte", quantity: 2 }];
    expect(addItem(items, "drip")).toEqual([
      { productId: "latte", quantity: 2 },
      { productId: "drip", quantity: 1 },
    ]);
  });
});

describe("changeQuantity", () => {
  it("removes a line that reaches zero", () => {
    const items: CartItem[] = [{ productId: "drip", quantity: 1 }];
    expect(changeQuantity(items, "drip", -1)).toEqual([]);
  });

  it("ignores a decrement for a product not in the cart", () => {
    expect(changeQuantity([], "drip", -1)).toEqual([]);
  });
});

describe("countItems", () => {
  it("sums quantities across lines", () => {
    expect(
      countItems([
        { productId: "drip", quantity: 3 },
        { productId: "espresso", quantity: 1 },
      ])
    ).toBe(4);
    expect(countItems([])).toBe(0);
  });
});

describe("parseStoredCart", () => {
  it("returns an empty cart for missing or malformed data", () => {
    expect(parseStoredCart(null)).toEqual([]);
    expect(parseStoredCart("not json")).toEqual([]);
    expect(parseStoredCart('{"productId":"drip"}')).toEqual([]);
  });

  it("keeps valid lines and drops unknown products and bad quantities", () => {
    const raw = JSON.stringify([
      { productId: "drip", quantity: 3 },
      { productId: "retired-blend", quantity: 1 },
      { productId: "latte", quantity: 0 },
      { productId: "latte", quantity: 1.5 },
      null,
    ]);
    expect(parseStoredCart(raw)).toEqual([{ productId: "drip", quantity: 3 }]);
  });
});
