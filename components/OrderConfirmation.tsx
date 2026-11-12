"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { pickupLabel, type Order } from "../lib/orders";
import { loadLastOrder } from "./lastOrder";
import { OrderLines } from "./OrderLines";

export function OrderConfirmation({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | "loading" | "missing">("loading");

  useEffect(() => {
    const saved = loadLastOrder();
    setOrder(saved && saved.id === orderId ? saved : "missing");
  }, [orderId]);

  if (order === "loading") {
    return <p className="muted">Loading your order…</p>;
  }
  if (order === "missing") {
    return (
      <div className="confirmation">
        <h1 className="page-title">Order not found</h1>
        <p>We can&apos;t find order {orderId} in this browser tab.</p>
        <Link href="/" className="button button-primary">
          Back to the menu
        </Link>
      </div>
    );
  }

  return (
    <div className="confirmation">
      <p className="eyebrow">Order {order.id}</p>
      <h1 className="page-title">Thanks, {order.name}. Your order is in.</h1>
      <p className="confirmation-pickup">
        Pickup: <strong>{pickupLabel(order.pickup)}</strong>. We&apos;ll call
        your name at the counter.
      </p>
      <OrderLines lines={order.lines} totalCents={order.totalCents} />
      <Link href="/" className="button button-secondary">
        Start a new order
      </Link>
    </div>
  );
}
