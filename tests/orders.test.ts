import { describe, expect, it } from "vitest";
import {
  buildOrder,
  MAX_LINE_QUANTITY,
  MAX_NAME_LENGTH,
  pickupLabel,
  validateOrderRequest,
} from "../lib/orders";

const VALID = {
  name: "Ada",
  pickup: "asap",
  items: [{ productId: "drip", quantity: 3 }],
};

function errorsFor(input: unknown): string[] {
  const result = validateOrderRequest(input);
  return result.ok ? [] : result.errors;
}

describe("validateOrderRequest", () => {
  it("accepts a valid order and trims the name", () => {
    const result = validateOrderRequest({ ...VALID, name: "  Ada  " });
    expect(result).toEqual({
      ok: true,
      request: { name: "Ada", pickup: "asap", items: VALID.items },
    });
  });

  it("rejects input that is not an object", () => {
    expect(errorsFor(null)).toEqual(["Order must be a JSON object."]);
    expect(errorsFor("order")).toEqual(["Order must be a JSON object."]);
  });

  it("requires a non-blank name within the length limit", () => {
    expect(errorsFor({ ...VALID, name: "   " })).toEqual([
      "Enter a name for the pickup order.",
    ]);
    expect(errorsFor({ ...VALID, name: 42 })).toHaveLength(1);
    expect(errorsFor({ ...VALID, name: "a".repeat(MAX_NAME_LENGTH) })).toEqual(
      []
    );
    expect(
      errorsFor({ ...VALID, name: "a".repeat(MAX_NAME_LENGTH + 1) })
    ).toEqual([`Name must be ${MAX_NAME_LENGTH} characters or fewer.`]);
  });

  it("requires a known pickup slot", () => {
    expect(errorsFor({ ...VALID, pickup: "tomorrow" })).toEqual([
      "Choose a pickup time.",
    ]);
  });

  it("requires at least one item", () => {
    expect(errorsFor({ ...VALID, items: [] })).toEqual([
      "Add at least one item to the order.",
    ]);
    expect(errorsFor({ ...VALID, items: "drip" })).toHaveLength(1);
  });

  it("rejects unknown products and bad quantities per line", () => {
    const errors = errorsFor({
      ...VALID,
      items: [
        { productId: "tea", quantity: 1 },
        { productId: "latte", quantity: 0 },
        { productId: "latte", quantity: 1.5 },
        { productId: "latte", quantity: MAX_LINE_QUANTITY + 1 },
        null,
      ],
    });
    expect(errors).toEqual([
      "Item 1 is not on the menu.",
      `Item 2 needs a whole quantity from 1 to ${MAX_LINE_QUANTITY}.`,
      `Item 3 needs a whole quantity from 1 to ${MAX_LINE_QUANTITY}.`,
      `Item 4 needs a whole quantity from 1 to ${MAX_LINE_QUANTITY}.`,
      "Item 5 is not on the menu.",
      `Item 5 needs a whole quantity from 1 to ${MAX_LINE_QUANTITY}.`,
    ]);
  });

  it("collects errors from every field at once", () => {
    expect(errorsFor({})).toHaveLength(3);
  });

  it("merges repeated products into one line", () => {
    const result = validateOrderRequest({
      ...VALID,
      items: [
        { productId: "drip", quantity: 1 },
        { productId: "espresso", quantity: 1 },
        { productId: "drip", quantity: 2 },
      ],
    });
    expect(result.ok && result.request.items).toEqual([
      { productId: "drip", quantity: 3 },
      { productId: "espresso", quantity: 1 },
    ]);
  });

  it("normalizes valid promo codes and accepts blank or omitted codes", () => {
    const result = validateOrderRequest({ ...VALID, promoCode: " save10 " });
    expect(result.ok && result.request.promoCode).toBe("SAVE10");
    expect(validateOrderRequest({ ...VALID, promoCode: "  " })).toEqual(
      validateOrderRequest(VALID)
    );
  });

  it.each(["UNKNOWN", 10, null, {}, ["SAVE10"]])(
    "rejects an invalid promo code: %j",
    (promoCode) => {
      expect(errorsFor({ ...VALID, promoCode })).toEqual([
        "Enter a valid promo code or remove it.",
      ]);
    }
  );
});

describe("buildOrder", () => {
  it("excludes merged bulk lines from the order discount", () => {
    const result = validateOrderRequest({
      ...VALID,
      promoCode: " save10 ",
      totalCents: 1, // Never trust a browser-supplied total.
      items: [
        { productId: "drip", quantity: 1 },
        { productId: "drip", quantity: 2 },
        { productId: "espresso", quantity: 1 },
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected a valid order");
    }
    const order = buildOrder(result.request, "BB-PROMO1", new Date());
    expect(order.totalCents).toBe(1210);
    expect(order.lines.map((line) => line.lineTotalCents)).toEqual([945, 295]);
  });

  it("prices lines and the total from the catalog", () => {
    const order = buildOrder(
      {
        name: "Ada",
        pickup: "in-15",
        items: [
          { productId: "drip", quantity: 3 }, // bulk: 945
          { productId: "espresso", quantity: 1 }, // 295
        ],
      },
      "BB-TEST01",
      new Date("2026-01-02T03:04:05.000Z")
    );
    expect(order).toEqual({
      id: "BB-TEST01",
      name: "Ada",
      pickup: "in-15",
      lines: [
        { productId: "drip", quantity: 3, lineTotalCents: 945 },
        { productId: "espresso", quantity: 1, lineTotalCents: 295 },
      ],
      totalCents: 1240,
      placedAt: "2026-01-02T03:04:05.000Z",
    });
  });
});

describe("pickupLabel", () => {
  it("returns the label for a known slot", () => {
    expect(pickupLabel("in-30")).toBe("In 30 minutes");
  });
});
