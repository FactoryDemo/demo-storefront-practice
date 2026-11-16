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

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  /** False until the saved cart has been read from localStorage. */
  isLoaded: boolean;
  isOpen: boolean;
  /** The applied promo code, or null. Only valid codes are stored. */
  promoCode: string | null;
  /** Returns false (and keeps the current code) when the code is unknown. */
  applyPromoCode: (code: string) => boolean;
  removePromoCode: () => void;
  addItem: (productId: string) => void;
  changeQuantity: (productId: string, delta: number) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

/** Holds the cart for every page and keeps it in localStorage. */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [promoCode, setPromoCode] = useState<string | null>(null);

  useEffect(() => {
    setItems(parseStoredCart(window.localStorage.getItem(STORAGE_KEY)));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    // Writing before the first read would wipe the saved cart.
    if (isLoaded) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addItem = useCallback((productId: string) => {
    setItems((current) => addCartItem(current, productId));
  }, []);

  const changeQuantity = useCallback((productId: string, delta: number) => {
    setItems((current) => changeCartQuantity(current, productId, delta));
  }, []);

  const applyPromoCode = useCallback((code: string) => {
    const promotion = findPromotion(code);
    if (promotion) {
      setPromoCode(promotion.code);
    }
    return promotion !== null;
  }, []);

  const removePromoCode = useCallback(() => setPromoCode(null), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount: countItems(items),
      isLoaded,
      isOpen,
      promoCode,
      applyPromoCode,
      removePromoCode,
      addItem,
      changeQuantity,
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
      applyPromoCode,
      removePromoCode,
      addItem,
      changeQuantity,
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
