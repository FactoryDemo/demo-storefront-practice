"use client";

import { useState, type FormEvent } from "react";
import { useCart } from "./CartProvider";

export function PromoCodeForm() {
  const { promoCode, applyPromoCode, removePromoCode } = useCart();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!applyPromoCode(code)) {
      setError("Promo code is not recognized.");
      return;
    }
    setError("");
    setCode("");
  }

  if (promoCode) {
    return (
      <div className="promo-applied">
        <span role="status">{promoCode} applied</span>
        <button
          type="button"
          className="button button-secondary"
          onClick={removePromoCode}
        >
          Remove promo code
        </button>
      </div>
    );
  }

  return (
    <form className="promo-form" onSubmit={apply}>
      <label className="field" htmlFor="promo-code">
        <span>Promo code</span>
        <input
          id="promo-code"
          name="promoCode"
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            setError("");
          }}
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "promo-error" : undefined}
        />
      </label>
      <button type="submit" className="button button-secondary">
        Apply
      </button>
      {error && (
        <p id="promo-error" className="promo-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
