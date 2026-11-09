import { describe, expect, it } from "vitest";
import {
  CATEGORIES,
  getProduct,
  PRODUCTS,
  productsInCategory,
} from "../lib/products";

describe("catalog", () => {
  it("has unique product ids in kebab-case", () => {
    const ids = PRODUCTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
  });

  it("prices every product in whole, positive cents", () => {
    for (const product of PRODUCTS) {
      expect(Number.isInteger(product.priceCents)).toBe(true);
      expect(product.priceCents).toBeGreaterThan(0);
    }
  });

  it("gives every product a photo under /products/", () => {
    for (const product of PRODUCTS) {
      expect(product.image).toBe(`/products/${product.id}.jpg`);
    }
  });

  it("puts every product in a known category, and none is empty", () => {
    const known = new Set(CATEGORIES.map((c) => c.id));
    for (const product of PRODUCTS) {
      expect(known.has(product.category)).toBe(true);
    }
    for (const category of CATEGORIES) {
      expect(productsInCategory(category.id).length).toBeGreaterThan(0);
    }
  });

  it("looks products up by id and rejects unknown ids", () => {
    expect(getProduct("latte").name).toBe("Latte");
    expect(() => getProduct("tea")).toThrow("Unknown product id: tea");
  });
});
