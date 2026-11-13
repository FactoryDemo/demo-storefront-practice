"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ANALYTICS_EVENTS, cartProperties } from "../lib/analytics";
import {
  addItem as addCartItem,
  changeQuantity as changeCartQuantity,
  countItems,
  parseStoredCart,
  parseStoredPromoCode,
} from "../lib/cart";
import { findPromotion, normalizePromoCode } from "../lib/promotions";
import type { CartItem } from "../lib/types";
import { track } from "./posthog";

const STORAGE_KEY = "bean-and-byte:cart";
const PROMO_STORAGE_KEY = "bean-and-byte:promo";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  /** The applied promo code, normalized, or null when none is applied. */
  promoCode: string | null;
  /** False until the saved cart has been read from localStorage. */
  isLoaded: boolean;
  isOpen: boolean;
  addItem: (productId: string) => void;
  changeQuantity: (productId: string, delta: number) => void;
  /** Apply a code. Returns false, and changes nothing, if it is not live. */
  applyPromoCode: (code: string) => boolean;
  removePromoCode: () => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

/** Holds the cart and promo code for every page and keeps them in localStorage. */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [promoCode, setPromoCodeState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setItems(parseStoredCart(window.localStorage.getItem(STORAGE_KEY)));
    setPromoCodeState(
      parseStoredPromoCode(window.localStorage.getItem(PROMO_STORAGE_KEY))
    );
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    // Writing before the first read would wipe the saved cart.
    if (isLoaded) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      window.localStorage.setItem(PROMO_STORAGE_KEY, promoCode ?? "");
    }
  }, [items, promoCode, isLoaded]);

  const addItem = useCallback((productId: string) => {
    setItems((current) => addCartItem(current, productId));
  }, []);

  const changeQuantity = useCallback((productId: string, delta: number) => {
    setItems((current) => changeCartQuantity(current, productId, delta));
  }, []);

  const applyPromoCode = useCallback((code: string): boolean => {
    const normalized = normalizePromoCode(code);
    if (!findPromotion(normalized)) {
      return false;
    }
    setPromoCodeState(normalized);
    return true;
  }, []);

  const removePromoCode = useCallback(() => setPromoCodeState(null), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount: countItems(items),
      promoCode,
      isLoaded,
      isOpen,
      addItem,
      changeQuantity,
      applyPromoCode,
      removePromoCode,
      clear: () => {
        setItems([]);
        setPromoCodeState(null);
      },
      openCart: () => {
        setIsOpen(true);
        track(ANALYTICS_EVENTS.cartOpened, cartProperties(items, promoCode));
      },
      closeCart: () => setIsOpen(false),
    }),
    [
      items,
      promoCode,
      isLoaded,
      isOpen,
      addItem,
      changeQuantity,
      applyPromoCode,
      removePromoCode,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const value = useContext(CartContext);
  if (!value) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return value;
}
