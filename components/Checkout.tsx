"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ANALYTICS_EVENTS,
  cartProperties,
  orderProperties,
} from "../lib/analytics";
import { formatCurrency } from "../lib/currency";
import {
  MAX_NAME_LENGTH,
  PICKUP_SLOTS,
  type Order,
  type PickupSlotId,
} from "../lib/orders";
import { priceCart } from "../lib/pricing";
import type { CartItem } from "../lib/types";
import { useCart } from "./CartProvider";
import { saveLastOrder } from "./lastOrder";
import { OrderLines } from "./OrderLines";
import { track } from "./posthog";
import { PromoCodeField } from "./PromoCodeField";

type SubmitResult =
  { ok: true; order: Order } | { ok: false; errors: string[] };

export function Checkout() {
  const { items, promoCode, isLoaded, clear } = useCart();
  const router = useRouter();
  const startTracked = useRef(false);

  useEffect(() => {
    if (isLoaded && items.length > 0 && !startTracked.current) {
      startTracked.current = true;
      track(ANALYTICS_EVENTS.checkoutStarted, cartProperties(items));
    }
  }, [isLoaded, items]);

  if (!isLoaded) {
    return <p className="muted">Loading your cart…</p>;
  }
  if (items.length === 0) {
    return (
      <div className="checkout-empty">
        <p>Your cart is empty.</p>
        <Link href="/" className="button button-primary">
          Browse the menu
        </Link>
      </div>
    );
  }

  const pricing = priceCart(items, promoCode ?? undefined);

  function onPlaced(order: Order) {
    track(ANALYTICS_EVENTS.orderPlaced, orderProperties(order));
    saveLastOrder(order);
    clear();
    router.push(`/orders/${order.id}`);
  }

  return (
    <div className="checkout">
      <section className="checkout-panel" aria-labelledby="pickup-title">
        <h2 id="pickup-title">Pickup details</h2>
        <CheckoutForm
          items={items}
          promoCode={promoCode}
          totalCents={pricing.totalCents}
          onPlaced={onPlaced}
        />
      </section>
      <aside className="checkout-summary" aria-labelledby="summary-title">
        <h2 id="summary-title">Order summary</h2>
        <PromoCodeField />
        <OrderLines
          lines={pricing.lines}
          subtotalCents={pricing.subtotalCents}
          promoCode={pricing.promoCode}
          discountCents={pricing.discountCents}
          totalCents={pricing.totalCents}
        />
        <Link href="/" className="text-link">
          ← Keep shopping
        </Link>
      </aside>
    </div>
  );
}

type CheckoutFormProps = {
  items: CartItem[];
  promoCode: string | null;
  totalCents: number;
  onPlaced: (order: Order) => void;
};

function CheckoutForm({
  items,
  promoCode,
  totalCents,
  onPlaced,
}: CheckoutFormProps) {
  const [name, setName] = useState("");
  const [pickup, setPickup] = useState<PickupSlotId>("asap");
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors([]);
    const result = await submitOrder({
      name,
      pickup,
      items,
      ...(promoCode ? { promoCode } : {}),
    });
    if (result.ok) {
      onPlaced(result.order);
      return;
    }
    track(ANALYTICS_EVENTS.orderFailed, { errorCount: result.errors.length });
    setErrors(result.errors);
    setIsSubmitting(false);
  }

  return (
    <form className="checkout-form" onSubmit={placeOrder}>
      <label className="field">
        <span>Name for the order</span>
        <input
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={MAX_NAME_LENGTH}
          autoComplete="given-name"
        />
      </label>
      <label className="field">
        <span>Pickup time</span>
        <select
          name="pickup"
          value={pickup}
          onChange={(event) => setPickup(event.target.value as PickupSlotId)}
        >
          {PICKUP_SLOTS.map((slot) => (
            <option key={slot.id} value={slot.id}>
              {slot.label}
            </option>
          ))}
        </select>
      </label>
      <p className="field-hint">
        Pick up at the counter. This is a demo: you pay nothing and no card is
        ever charged.
      </p>
      {errors.length > 0 && (
        <div className="form-errors" role="alert">
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      <button
        type="submit"
        className="button button-primary button-block"
        disabled={isSubmitting}
      >
        {isSubmitting
          ? "Placing order…"
          : `Place order · ${formatCurrency(totalCents)}`}
      </button>
    </form>
  );
}

async function submitOrder(body: {
  name: string;
  pickup: PickupSlotId;
  items: CartItem[];
  promoCode?: string;
}): Promise<SubmitResult> {
  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data: unknown = await response.json();
    if (response.ok) {
      return { ok: true, order: data as Order };
    }
    const errors = (data as { errors?: string[] }).errors;
    return {
      ok: false,
      errors: errors ?? ["Something went wrong. Try again."],
    };
  } catch {
    return {
      ok: false,
      errors: ["We couldn't reach the shop. Check your connection and retry."],
    };
  }
}
