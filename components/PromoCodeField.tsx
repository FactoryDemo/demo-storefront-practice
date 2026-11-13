"use client";

import { useId, useState, type FormEvent } from "react";
import { findPromotion } from "../lib/promotions";
import { useCart } from "./CartProvider";

/** Enter a promo code, or show the applied one with a way to remove it. */
export function PromoCodeField() {
  const { promoCode, applyPromoCode, removePromoCode } = useCart();
  const [draft, setDraft] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);
  const inputId = useId();
  const statusId = useId();

  if (promoCode) {
    const promotion = findPromotion(promoCode);
    return (
      <div className="promo-field">
        <p className="promo-applied" role="status">
          <span className="tag">{promoCode}</span>
          {promotion ? ` ${promotion.description}.` : ""}
        </p>
        <button type="button" className="text-button" onClick={removePromoCode}>
          Remove code
        </button>
      </div>
    );
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (applyPromoCode(draft)) {
      setDraft("");
      setIsInvalid(false);
    } else {
      setIsInvalid(true);
    }
  }

  return (
    <form className="promo-field" onSubmit={onSubmit} noValidate>
      <label className="field" htmlFor={inputId}>
        <span>Promo code</span>
      </label>
      <div className="promo-row">
        <input
          id={inputId}
          name="promoCode"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setIsInvalid(false);
          }}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={isInvalid}
          aria-describedby={statusId}
        />
        <button
          type="submit"
          className="button button-secondary"
          disabled={draft.trim().length === 0}
        >
          Apply
        </button>
      </div>
      <p
        id={statusId}
        className={isInvalid ? "promo-error" : "field-hint"}
        role="status"
      >
        {isInvalid ? "Promo code not recognized. No discount applied." : ""}
      </p>
    </form>
  );
}
