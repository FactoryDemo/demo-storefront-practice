import { formatCurrency } from "../lib/currency";
import { BULK_DISCOUNT_THRESHOLD } from "../lib/pricing";
import { getProduct } from "../lib/products";
import type { PricedLine } from "../lib/types";

type OrderLinesProps = {
  lines: PricedLine[];
  totalCents: number;
  promoCode?: string | null;
};

/** Read-only list of priced lines, any promo discount, and the total. */
export function OrderLines({ lines, totalCents, promoCode }: OrderLinesProps) {
  const subtotalCents = lines.reduce(
    (sum, line) => sum + line.lineTotalCents,
    0
  );
  const promoDiscountCents = subtotalCents - totalCents;

  return (
    <div className="order-lines">
      <ul>
        {lines.map((line) => (
          <li className="order-line" key={line.productId}>
            <span className="order-line-qty">{line.quantity}×</span>
            <span>
              {getProduct(line.productId).name}
              {line.quantity >= BULK_DISCOUNT_THRESHOLD && (
                <span className="tag">10% off</span>
              )}
            </span>
            <span>{formatCurrency(line.lineTotalCents)}</span>
          </li>
        ))}
      </ul>
      {promoCode && promoDiscountCents > 0 && (
        <div className="order-promo-discount">
          <span>{promoCode} · 10% off full-price items</span>
          <span>−{formatCurrency(promoDiscountCents)}</span>
        </div>
      )}
      <div className="order-total">
        <span>Total</span>
        <span>{formatCurrency(totalCents)}</span>
      </div>
    </div>
  );
}
