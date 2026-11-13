import { formatCurrency } from "../lib/currency";
import { BULK_DISCOUNT_THRESHOLD } from "../lib/pricing";
import { getProduct } from "../lib/products";
import type { PricedLine } from "../lib/types";

type OrderLinesProps = {
  lines: PricedLine[];
  subtotalCents: number;
  promoCode: string | null;
  discountCents: number;
  totalCents: number;
};

/** Read-only list of priced lines, any promo discount, and the order total. */
export function OrderLines({
  lines,
  subtotalCents,
  promoCode,
  discountCents,
  totalCents,
}: OrderLinesProps) {
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
      {discountCents > 0 && (
        <>
          <div className="order-subtotal">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotalCents)}</span>
          </div>
          <div className="order-discount">
            <span>
              Promo <span className="tag">{promoCode}</span>
            </span>
            <span>−{formatCurrency(discountCents)}</span>
          </div>
        </>
      )}
      <div className="order-total">
        <span>Total</span>
        <span>{formatCurrency(totalCents)}</span>
      </div>
    </div>
  );
}
