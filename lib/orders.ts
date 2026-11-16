import { calculateCartTotal, priceLines } from "./pricing";
import { PRODUCTS } from "./products";
import { findPromotion } from "./promotions";
import type { CartItem, PricedLine } from "./types";

export type PickupSlotId = "asap" | "in-15" | "in-30" | "in-45" | "in-60";

export type PickupSlot = {
  id: PickupSlotId;
  label: string;
};

export const PICKUP_SLOTS: PickupSlot[] = [
  { id: "asap", label: "As soon as possible (about 10 minutes)" },
  { id: "in-15", label: "In 15 minutes" },
  { id: "in-30", label: "In 30 minutes" },
  { id: "in-45", label: "In 45 minutes" },
  { id: "in-60", label: "In 1 hour" },
];

export const MAX_NAME_LENGTH = 60;
export const MAX_LINE_QUANTITY = 99;

/** A validated checkout request: who is picking up, when, and what. */
export type OrderRequest = {
  name: string;
  pickup: PickupSlotId;
  items: CartItem[];
  /** Normalized promo code, or null when none was given. */
  promoCode?: string | null;
};

/** A placed order. Totals are computed on the server from the catalog. */
export type Order = {
  id: string;
  name: string;
  pickup: PickupSlotId;
  lines: PricedLine[];
  promoCode: string | null;
  /** Cents taken off by the promo code, so lines plus this less equal the total. */
  promoDiscountCents: number;
  totalCents: number;
  placedAt: string;
};

export type OrderValidation =
  { ok: true; request: OrderRequest } | { ok: false; errors: string[] };

/**
 * Check an untrusted checkout payload. Quantities for the same product are
 * merged, so the order has one line per product.
 */
export function validateOrderRequest(input: unknown): OrderValidation {
  if (typeof input !== "object" || input === null) {
    return { ok: false, errors: ["Order must be a JSON object."] };
  }
  const { name, pickup, items, promoCode } = input as Record<string, unknown>;
  const errors = [
    ...validateName(name),
    ...validatePickup(pickup),
    ...validateItems(items),
    ...validatePromoCode(promoCode),
  ];
  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    request: {
      name: (name as string).trim(),
      pickup: pickup as PickupSlotId,
      items: mergeItems(items as CartItem[]),
      promoCode: normalizePromoCode(promoCode),
    },
  };
}

/** Price a validated request into an order. */
export function buildOrder(
  request: OrderRequest,
  id: string,
  placedAt: Date
): Order {
  const totalCents = calculateCartTotal(
    request.items,
    request.promoCode ?? undefined
  );
  const subtotalCents = calculateCartTotal(request.items);
  return {
    id,
    name: request.name,
    pickup: request.pickup,
    lines: priceLines(request.items),
    promoCode: request.promoCode ?? null,
    promoDiscountCents: subtotalCents - totalCents,
    totalCents,
    placedAt: placedAt.toISOString(),
  };
}

export function pickupLabel(id: PickupSlotId): string {
  return PICKUP_SLOTS.find((slot) => slot.id === id)?.label ?? id;
}

function validateName(name: unknown): string[] {
  if (typeof name !== "string" || name.trim().length === 0) {
    return ["Enter a name for the pickup order."];
  }
  if (name.trim().length > MAX_NAME_LENGTH) {
    return [`Name must be ${MAX_NAME_LENGTH} characters or fewer.`];
  }
  return [];
}

function normalizePromoCode(promoCode: unknown): string | null {
  if (typeof promoCode !== "string" || promoCode.trim() === "") {
    return null;
  }
  return promoCode.trim().toUpperCase();
}

function validatePromoCode(promoCode: unknown): string[] {
  if (promoCode === undefined || promoCode === null) {
    return [];
  }
  if (typeof promoCode !== "string") {
    return ["Promo code must be text."];
  }
  const normalized = normalizePromoCode(promoCode);
  return normalized === null || findPromotion(normalized)
    ? []
    : ["That promo code isn't valid."];
}

function validatePickup(pickup: unknown): string[] {
  const known = PICKUP_SLOTS.some((slot) => slot.id === pickup);
  return known ? [] : ["Choose a pickup time."];
}

function validateItems(items: unknown): string[] {
  if (!Array.isArray(items) || items.length === 0) {
    return ["Add at least one item to the order."];
  }
  return items.flatMap(validateItem);
}

function validateItem(item: unknown, index: number): string[] {
  const { productId, quantity } = (item ?? {}) as Record<string, unknown>;
  const errors: string[] = [];
  if (!PRODUCTS.some((product) => product.id === productId)) {
    errors.push(`Item ${index + 1} is not on the menu.`);
  }
  if (!isValidQuantity(quantity)) {
    errors.push(
      `Item ${index + 1} needs a whole quantity from 1 to ${MAX_LINE_QUANTITY}.`
    );
  }
  return errors;
}

function isValidQuantity(quantity: unknown): boolean {
  return (
    typeof quantity === "number" &&
    Number.isInteger(quantity) &&
    quantity >= 1 &&
    quantity <= MAX_LINE_QUANTITY
  );
}

function mergeItems(items: CartItem[]): CartItem[] {
  const merged = new Map<string, number>();
  for (const { productId, quantity } of items) {
    merged.set(productId, (merged.get(productId) ?? 0) + quantity);
  }
  return Array.from(merged, ([productId, quantity]) => ({
    productId,
    quantity,
  }));
}
