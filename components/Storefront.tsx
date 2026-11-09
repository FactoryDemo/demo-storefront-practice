import Image from "next/image";
import { BULK_DISCOUNT_THRESHOLD } from "../lib/pricing";
import { CATEGORIES, productsInCategory } from "../lib/products";
import { MenuAnnouncement } from "./MenuAnnouncement";
import { ProductCard } from "./ProductCard";

export default function Storefront() {
  return (
    <>
      <MenuAnnouncement />
      <section className="hero">
        <div>
          <p className="eyebrow">Order ahead · Ready in about 10 minutes</p>
          <h1>Bean &amp; Byte</h1>
          <p className="hero-lede">
            Small-batch coffee and a short menu, made carefully. Order ahead and
            skip the line.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#menu">
              Start an order
            </a>
            <span className="hero-note">
              Buy {BULK_DISCOUNT_THRESHOLD} or more of one item and that line is
              10% off.
            </span>
          </div>
        </div>
        <div className="hero-image">
          <Image
            src="/products/latte.jpg"
            alt="A latte with tulip latte art on a cream saucer"
            fill
            priority
            sizes="(max-width: 860px) 100vw, 540px"
          />
        </div>
      </section>

      <nav className="category-nav" aria-label="Menu categories">
        {CATEGORIES.map((category) => (
          <a key={category.id} href={`#${category.id}`}>
            {category.name}
          </a>
        ))}
      </nav>

      <div id="menu">
        {CATEGORIES.map((category) => (
          <section
            key={category.id}
            id={category.id}
            className="menu-section"
            aria-labelledby={`${category.id}-title`}
          >
            <div className="menu-section-header">
              <h2 id={`${category.id}-title`}>{category.name}</h2>
              <p>{category.description}</p>
            </div>
            <div className="product-grid">
              {productsInCategory(category.id).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
