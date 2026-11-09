"use client";

import { useState, type FormEvent } from "react";
import { findPromotion } from "../lib/promotions";
import { useCart } from "./CartProvider";

export function PromoCodeForm() {
  const { promoCode, setPromoCode } = useCart();
  const [code, setCode] = useState(promoCode ?? "");
  const [error, setError] = useState("");
  const promotion = promoCode ? findPromotion(promoCode) : null;

  function applyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const match = findPromotion(code);
    if (!match) {
      setError("This promo code is not valid.");
      return;
    }
    setPromoCode(match.code);
    setCode(match.code);
    setError("");
  }

  return (
    <form className="promo-form" onSubmit={applyCode}>
      <label className="field" htmlFor="promo-code">
        Promo code
      </label>
      <div className="promo-controls field">
        <input
          id="promo-code"
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
        <button type="submit" className="button button-secondary">
          Apply
        </button>
      </div>
      {error && (
        <p id="promo-error" className="form-errors" role="alert">
          {error}
        </p>
      )}
      {promotion && (
        <div className="promo-applied">
          <p className="bulk-note" role="status">
            {promotion.code} applied: {promotion.description}.
          </p>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => {
              setPromoCode(undefined);
              setCode("");
              setError("");
            }}
            aria-label="Remove promo code"
          >
            Remove
          </button>
        </div>
      )}
    </form>
  );
}
