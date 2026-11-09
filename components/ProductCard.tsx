"use client";

import Image from "next/image";
import { formatCurrency } from "../lib/currency";
import type { Product } from "../lib/types";
import { useCart } from "./CartProvider";

export function ProductCard({ product }: { product: Product }) {
  const { items, addItem } = useCart();
  const inCart =
    items.find((item) => item.productId === product.id)?.quantity ?? 0;

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
            onClick={() => addItem(product.id)}
          >
            Add to cart
          </button>
          {inCart > 0 && <span className="in-cart">{inCart} in cart</span>}
        </div>
      </div>
    </article>
  );
}
