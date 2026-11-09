import { formatCurrency } from "../lib/currency";
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
        {promotion.code} ({promotion.description})
      </span>
      <span>−{formatCurrency(promotion.discountCents(lines))}</span>
    </div>
  );
}
