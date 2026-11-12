import { describe, expect, it } from "vitest";
import {
  ANALYTICS_EVENTS,
  cartProperties,
  FEATURE_FLAGS,
  orderProperties,
  productAddedProperties,
  releaseProperties,
} from "../lib/analytics";
import { buildOrder } from "../lib/orders";

describe("event and flag names", () => {
  it("uses snake_case event names and kebab-case flag keys", () => {
    for (const name of Object.values(ANALYTICS_EVENTS)) {
      expect(name).toMatch(/^[a-z]+(_[a-z]+)*$/);
    }
    for (const key of Object.values(FEATURE_FLAGS)) {
      expect(key).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
  });
});

describe("releaseProperties", () => {
  it("shortens the commit and keeps the repo and environment", () => {
    expect(
      releaseProperties({
        repo: "demo-storefront",
        commitSha: "3051fac0123456789",
        environment: "production",
      })
    ).toEqual({
      appRepo: "demo-storefront",
      appVersion: "3051fac",
      appEnvironment: "production",
    });
  });

  it("falls back to local development values", () => {
    expect(releaseProperties({ repo: "", commitSha: undefined })).toEqual({
      appRepo: "local",
      appVersion: "dev",
      appEnvironment: "development",
    });
  });
});

describe("productAddedProperties", () => {
  it("describes the product and the quantity now in the cart", () => {
    expect(productAddedProperties("drip", 3)).toEqual({
      productId: "drip",
      category: "hot",
      priceCents: 350,
      quantityInCart: 3,
    });
  });

  it("throws for a product that is not on the menu", () => {
    expect(() => productAddedProperties("nope", 1)).toThrow();
  });
});

describe("cartProperties", () => {
  it("reports the total after the applied order promotion", () => {
    expect(
      cartProperties([{ productId: "drip", quantity: 3 }], "SAVE10")
    ).toEqual({ lineCount: 1, itemCount: 3, totalCents: 945 });
  });

  it("counts lines and items and prices the cart with the bulk discount", () => {
    expect(
      cartProperties([
        { productId: "drip", quantity: 3 },
        { productId: "espresso", quantity: 1 },
      ])
    ).toEqual({ lineCount: 2, itemCount: 4, totalCents: 1240 });
  });

  it("describes an empty cart", () => {
    expect(cartProperties([])).toEqual({
      lineCount: 0,
      itemCount: 0,
      totalCents: 0,
    });
  });
});

describe("orderProperties", () => {
  it("summarizes the order without the customer's name", () => {
    const order = buildOrder(
      {
        name: "Ada",
        pickup: "in-15",
        items: [
          { productId: "drip", quantity: 3 },
          { productId: "espresso", quantity: 1 },
        ],
      },
      "BB-ABC123",
      new Date("2026-01-01T00:00:00Z")
    );
    const properties = orderProperties(order);
    expect(properties).toEqual({
      orderId: "BB-ABC123",
      pickup: "in-15",
      lineCount: 2,
      itemCount: 4,
      totalCents: 1240,
    });
    expect(Object.values(properties)).not.toContain("Ada");
  });
});
