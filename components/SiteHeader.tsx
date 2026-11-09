"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export function SiteHeader() {
  const { itemCount, openCart } = useCart();
  const label = `Cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}`;

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="wordmark">
          Bean &amp; Byte
        </Link>
        <nav className="site-nav" aria-label="Main">
          <Link href="/#menu">Menu</Link>
          <button
            type="button"
            className="cart-button"
            onClick={openCart}
            aria-label={label}
          >
            Cart
            <span className="cart-count">{itemCount}</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
