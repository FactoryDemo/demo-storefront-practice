"use client";

import { useState, type FormEvent } from "react";
import { useCart } from "./CartProvider";

export function PromoCodeForm() {
  const { promoCode, applyPromoCode } = useCart();
  const [draft, setDraft] = useState(promoCode);
  const [error, setError] = useState("");

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!applyPromoCode(draft)) {
      setError("Enter a valid promo code.");
      return;
    }
    setDraft(draft.trim().toUpperCase());
    setError("");
  }

  function remove() {
    applyPromoCode("");
    setDraft("");
    setError("");
  }

  return (
    <form className="promo-form" onSubmit={apply}>
      <label className="field" htmlFor="promo-code">
        Promo code
      </label>
      <div className="promo-controls">
        <input
          id="promo-code"
          name="promoCode"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
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
      {promoCode && (
        <div className="promo-applied">
          <span role="status">{promoCode} applied.</span>
          <button
            type="button"
            className="button button-secondary"
            onClick={remove}
          >
            Remove promo code
          </button>
        </div>
      )}
    </form>
  );
}
