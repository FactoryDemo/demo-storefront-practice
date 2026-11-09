"use client";

import Image from "next/image";
import { ANALYTICS_EVENTS, productAddedProperties } from "../lib/analytics";
import { formatCurrency } from "../lib/currency";
import type { Product } from "../lib/types";
import { useCart } from "./CartProvider";
import { track } from "./posthog";

export function ProductCard({ product }: { product: Product }) {
  const { items, addItem } = useCart();
  const inCart =
    items.find((item) => item.productId === product.id)?.quantity ?? 0;

  function add() {
    addItem(product.id);
    track(
      ANALYTICS_EVENTS.productAdded,
      productAddedProperties(product.id, inCart + 1)
    );
  }

  return (
    <article className="product-card">
      <div className="product-image">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 560px) 50vw, (max-width: 1160px) 33vw, 280px"
        />
      </div>
      <div className="product-body">
        <div className="product-heading">
          <h3 className="name">{product.name}</h3>
          <span className="price">{formatCurrency(product.priceCents)}</span>
        </div>
        <p className="product-description">{product.description}</p>
        <div className="product-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={add}
          >
            Add to cart
          </button>
          {inCart > 0 && <span className="in-cart">{inCart} in cart</span>}
        </div>
      </div>
    </article>
  );
}
