import { countItems } from "./cart";
import type { Order } from "./orders";
import { calculateCartTotal } from "./pricing";
import { getProduct } from "./products";
import type { CartItem } from "./types";

/**
 * Product analytics event names sent to PostHog. Add new events here so the
 * names stay consistent across the UI.
 */
export const ANALYTICS_EVENTS = {
  productAdded: "product_added",
  cartOpened: "cart_opened",
  checkoutStarted: "checkout_started",
  orderPlaced: "order_placed",
  orderFailed: "order_failed",
} as const;

export type AnalyticsEvent =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

/** Feature flag keys as created in PostHog. A flag that cannot load is off. */
export const FEATURE_FLAGS = {
  menuAnnouncement: "menu-announcement",
} as const;

export type FeatureFlag = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];

export type AnalyticsProperties = Record<string, string | number | boolean>;

export type ReleaseInfo = {
  repo?: string;
  commitSha?: string;
  environment?: string;
};

/** Tags every event and error with the deployment that produced it. */
export function releaseProperties(info: ReleaseInfo): AnalyticsProperties {
  return {
    appRepo: info.repo || "local",
    appVersion: info.commitSha?.slice(0, 7) || "dev",
    appEnvironment: info.environment || "development",
  };
}

export function productAddedProperties(
  productId: string,
  quantityInCart: number
): AnalyticsProperties {
  const product = getProduct(productId);
  return {
    productId,
    category: product.category,
    priceCents: product.priceCents,
    quantityInCart,
  };
}

export function cartProperties(items: CartItem[]): AnalyticsProperties {
  return {
    lineCount: items.length,
    itemCount: countItems(items),
    totalCents: calculateCartTotal(items),
  };
}

/** Order facts for analytics. Never includes the customer's name. */
export function orderProperties(order: Order): AnalyticsProperties {
  return {
    orderId: order.id,
    pickup: order.pickup,
    lineCount: order.lines.length,
    itemCount: order.lines.reduce((sum, line) => sum + line.quantity, 0),
    totalCents: order.totalCents,
  };
}
