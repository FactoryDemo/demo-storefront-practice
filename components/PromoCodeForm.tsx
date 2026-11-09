"use client";

import { useState, type FormEvent } from "react";
import { findPromotion } from "../lib/promotions";
import { useCart } from "./CartProvider";

export function PromoCodeForm() {
  const { promoCode, setPromoCode } = useCart();
  const [code, setCode] = useState(promoCode);
  const [error, setError] = useState("");

  function applyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const promotion = findPromotion(code);
    if (!promotion) {
      setError("That promo code isn't valid.");
      return;
    }
    setPromoCode(promotion.code);
    setCode(promotion.code);
    setError("");
  }

  function removeCode() {
    setPromoCode("");
    setCode("");
    setError("");
  }

  return (
    <form className="promo-form" onSubmit={applyCode}>
      <label className="field">
        <span>Promo code</span>
        <input
          name="promoCode"
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            setError("");
          }}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "promo-error" : undefined}
        />
      </label>
      <div className="promo-actions">
        <button type="submit" className="button button-secondary">
          Apply
        </button>
        {promoCode && (
          <button
            type="button"
            className="button button-secondary"
            onClick={removeCode}
          >
            Remove code
          </button>
        )}
      </div>
      {error && (
        <p id="promo-error" className="field-hint" role="alert">
          {error}
        </p>
      )}
      <p className="field-hint" role="status">
        {promoCode ? `${promoCode} applied.` : ""}
      </p>
    </form>
  );
}
