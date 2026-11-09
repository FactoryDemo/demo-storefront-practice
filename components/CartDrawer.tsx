"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { formatCurrency } from "../lib/currency";
import {
  BULK_DISCOUNT_THRESHOLD,
  calculateCartTotal,
  calculateLineTotal,
  priceLines,
} from "../lib/pricing";
import { getProduct } from "../lib/products";
import type { CartItem } from "../lib/types";
import { useCart } from "./CartProvider";
import { PromoCodeForm } from "./PromoCodeForm";
import { PromoDiscount } from "./PromoDiscount";

export function CartDrawer() {
  const { items, promoCode, isOpen, closeCart, changeQuantity } = useCart();
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    closeButton.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeCart();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeCart]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className="cart-overlay" onClick={closeCart} aria-hidden="true" />
      <aside
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
      >
        <div className="cart-drawer-header">
          <h2 id="cart-title">Your cart</h2>
          <button
            ref={closeButton}
            type="button"
            className="icon-button"
            onClick={closeCart}
            aria-label="Close cart"
          >
            ×
          </button>
        </div>
        {items.length === 0 ? (
          <p className="cart-empty">Your cart is empty. The coffee awaits.</p>
        ) : (
          <>
            <ul className="cart-lines">
              {items.map((item) => (
                <CartLine
                  key={item.productId}
                  item={item}
                  onChange={changeQuantity}
                />
              ))}
            </ul>
            <div className="cart-drawer-footer">
              <p className="bulk-note">
                Buy {BULK_DISCOUNT_THRESHOLD} or more of any one item and that
                line is 10% off.
              </p>
              <PromoCodeForm />
              <PromoDiscount lines={priceLines(items)} promoCode={promoCode} />
              <div className="cart-total">
                <span>Total</span>
                <span>
                  {formatCurrency(calculateCartTotal(items, promoCode))}
                </span>
              </div>
              <Link
                href="/checkout"
                className="button button-primary button-block"
                onClick={closeCart}
              >
                Checkout
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

type CartLineProps = {
  item: CartItem;
  onChange: (productId: string, delta: number) => void;
};

function CartLine({ item, onChange }: CartLineProps) {
  const product = getProduct(item.productId);
  const isBulk = item.quantity >= BULK_DISCOUNT_THRESHOLD;

  return (
    <li className="cart-line">
      <Image
        src={product.image}
        alt=""
        width={64}
        height={64}
        className="cart-line-image"
      />
      <div>
        <div className="cart-line-name">{product.name}</div>
        <div className="cart-line-meta">
          {formatCurrency(product.priceCents)} each
          {isBulk ? " · 10% off this line" : ""}
        </div>
        <div className="qty-controls">
          <button
            type="button"
            onClick={() => onChange(item.productId, -1)}
            aria-label={`Remove one ${product.name}`}
          >
            −
          </button>
          <span>{item.quantity}</span>
          <button
            type="button"
            onClick={() => onChange(item.productId, 1)}
            aria-label={`Add one ${product.name}`}
          >
            +
          </button>
        </div>
      </div>
      <div className="cart-line-total">
        {formatCurrency(calculateLineTotal(product, item.quantity))}
      </div>
    </li>
  );
}
