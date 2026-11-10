import { formatCurrency } from "../lib/currency";
import { calculatePromotionDiscount } from "../lib/pricing";
import { findPromotion } from "../lib/promotions";
import type { PricedLine } from "../lib/types";

type PromotionDiscountProps = {
  lines: PricedLine[];
  promoCode?: string;
};

export function PromotionDiscount({
  lines,
  promoCode,
}: PromotionDiscountProps) {
  const promotion = findPromotion(promoCode ?? "");
  if (!promotion) {
    return null;
  }
  return (
    <div className="promotion-discount" role="status">
      <span>
        {promotion.code} · {promotion.description}
      </span>
      <span>
        −{formatCurrency(calculatePromotionDiscount(lines, promotion.code))}
      </span>
    </div>
  );
}
