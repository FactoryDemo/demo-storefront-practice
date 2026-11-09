import type { Order } from "../lib/orders";

const STORAGE_KEY = "bean-and-byte:last-order";

/** Keep the placed order for the confirmation page in this browser tab. */
export function saveLastOrder(order: Order): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  } catch {
    // Storage disabled or full: the confirmation page shows "not found".
  }
}

export function loadLastOrder(): Order | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Order) : null;
  } catch {
    return null;
  }
}
