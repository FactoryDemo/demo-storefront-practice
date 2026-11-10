import { formatCurrency } from "../lib/currency";
import { calculatePromoDiscount } from "../lib/pricing";
import { findPromotion } from "../lib/promotions";
import type { PricedLine } from "../lib/types";

type PromoDiscountProps = {
  lines: PricedLine[];
  promoCode?: string;
};

export function PromoDiscount({ lines, promoCode }: PromoDiscountProps) {
  const promotion = promoCode ? findPromotion(promoCode) : null;
  if (!promotion) {
    return null;
  }
  return (
    <div className="promo-discount">
      <span>
        {promotion.code} · {promotion.description}
      </span>
      <span>-{formatCurrency(calculatePromoDiscount(lines, promoCode))}</span>
    </div>
  );
}
