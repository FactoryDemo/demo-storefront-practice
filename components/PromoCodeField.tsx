"use client";

import { useId } from "react";
import { findPromotion } from "../lib/promotions";
import { useCart } from "./CartProvider";

export function PromoCodeField() {
  const statusId = useId();
  const { promoCode, setPromoCode } = useCart();
  const promotion = findPromotion(promoCode);
  const isInvalid = promoCode.trim().length > 0 && !promotion;

  return (
    <div>
      <label className="field">
        <span>Promo code</span>
        <input
          name="promoCode"
          value={promoCode}
          onChange={(event) => setPromoCode(event.target.value)}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={isInvalid}
          aria-describedby={statusId}
        />
      </label>
      <p
        id={statusId}
        className={`field-hint${isInvalid ? " promo-code-error" : ""}`}
        role="status"
      >
        {promotion
          ? `${promotion.code} applied: ${promotion.description}. Clear the field to remove it.`
          : isInvalid
            ? "Promo code not recognized. No discount applied. Clear it to continue."
            : "Enter SAVE10 for 10% off full-price items. Does not stack with bulk discounts."}
      </p>
    </div>
  );
}
