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
      setError("Enter a valid promo code.");
      return;
    }
    setPromoCode(promotion.code);
    setCode(promotion.code);
    setError("");
  }

  return (
    <form className="promo-form" onSubmit={applyCode}>
      <label className="field" htmlFor="promo-code">
        Promo code
        <input
          id="promo-code"
          name="promoCode"
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            setError("");
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "promo-error" : undefined}
          autoComplete="off"
          spellCheck={false}
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
            onClick={() => {
              setPromoCode("");
              setCode("");
              setError("");
            }}
          >
            Remove promo code
          </button>
        )}
      </div>
      {error && (
        <p id="promo-error" className="form-errors" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
