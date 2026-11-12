import { formatCurrency } from "../lib/currency";

type PromoDiscountProps = {
  promoCode?: string;
  discountCents?: number;
};

export function PromoDiscount({
  promoCode,
  discountCents = 0,
}: PromoDiscountProps) {
  if (!promoCode) {
    return null;
  }
  return (
    <div className="promo-discount">
      <span>Promo ({promoCode})</span>
      <span>−{formatCurrency(discountCents)}</span>
    </div>
  );
}
