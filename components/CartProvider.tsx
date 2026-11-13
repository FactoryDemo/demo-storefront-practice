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
import { findPromotion } from "../lib/promotions";
import { ANALYTICS_EVENTS, cartProperties } from "../lib/analytics";
import {
  addItem as addCartItem,
  changeQuantity as changeCartQuantity,
  countItems,
  parseStoredCart,
} from "../lib/cart";
import type { CartItem } from "../lib/types";
import { track } from "./posthog";

const STORAGE_KEY = "bean-and-byte:cart";
const PROMO_STORAGE_KEY = "bean-and-byte:promo";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  /** False until the saved cart has been read from localStorage. */
  isLoaded: boolean;
  isOpen: boolean;
  addItem: (productId: string) => void;
  changeQuantity: (productId: string, delta: number) => void;
  /** The applied promo code (uppercase), or null. */
  promoCode: string | null;
  /** Applies a code if it is a live promotion; returns whether it was. */
  applyPromoCode: (code: string) => boolean;
  removePromoCode: () => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

/** Holds the cart for every page and keeps it in localStorage. */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setItems(parseStoredCart(window.localStorage.getItem(STORAGE_KEY)));
    const savedPromo = window.localStorage.getItem(PROMO_STORAGE_KEY);
    setPromoCode(savedPromo && findPromotion(savedPromo) ? savedPromo : null);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    // Writing before the first read would wipe the saved cart.
    if (isLoaded) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isLoaded]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    if (promoCode) {
      window.localStorage.setItem(PROMO_STORAGE_KEY, promoCode);
    } else {
      window.localStorage.removeItem(PROMO_STORAGE_KEY);
    }
  }, [promoCode, isLoaded]);

  const addItem = useCallback((productId: string) => {
    setItems((current) => addCartItem(current, productId));
  }, []);

  const changeQuantity = useCallback((productId: string, delta: number) => {
    setItems((current) => changeCartQuantity(current, productId, delta));
  }, []);

  const applyPromoCode = useCallback((code: string) => {
    const promotion = findPromotion(code);
    setPromoCode(promotion ? promotion.code : null);
    return promotion !== null;
  }, []);

  const removePromoCode = useCallback(() => setPromoCode(null), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount: countItems(items),
      isLoaded,
      isOpen,
      addItem,
      changeQuantity,
      promoCode,
      applyPromoCode,
      removePromoCode,
      clear: () => {
        setItems([]);
        setPromoCode(null);
      },
      openCart: () => {
        setIsOpen(true);
        track(ANALYTICS_EVENTS.cartOpened, cartProperties(items));
      },
      closeCart: () => setIsOpen(false),
    }),
    [
      items,
      isLoaded,
      isOpen,
      promoCode,
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
