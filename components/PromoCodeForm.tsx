"use client";

import { useState, type FormEvent } from "react";
import { findPromotion } from "../lib/promotions";
import { useCart } from "./CartProvider";

export function PromoCodeForm() {
  const { promoCode, setPromoCode } = useCart();
  const [input, setInput] = useState(promoCode);
  const [error, setError] = useState("");
  const promotion = findPromotion(promoCode);

  function applyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const matched = findPromotion(input);
    if (!matched) {
      setError("Promo code not recognized.");
      return;
    }
    setPromoCode(matched.code);
    setInput(matched.code);
    setError("");
  }

  return (
    <div className="promo-code">
      <form onSubmit={applyCode}>
        <label className="field">
          <span>Promo code</span>
          <input
            name="promoCode"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setError("");
            }}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "promo-error" : undefined}
          />
        </label>
        <button type="submit" className="button button-secondary">
          Apply
        </button>
      </form>
      {error && (
        <p id="promo-error" className="form-errors" role="alert">
          {error}
        </p>
      )}
      {promotion && (
        <>
          <p className="field-hint" role="status">
            {promotion.code} applied · {promotion.description}
          </p>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => {
              setPromoCode("");
              setInput("");
              setError("");
            }}
          >
            Remove promo code
          </button>
        </>
      )}
    </div>
  );
}
