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
} from "../lib/cart";
import { findPromotion } from "../lib/promotions";
import type { CartItem } from "../lib/types";
import { track } from "./posthog";

const STORAGE_KEY = "bean-and-byte:cart";

type CartContextValue = {
  items: CartItem[];
  /** Normalized code of the applied promotion, or null. */
  promoCode: string | null;
  applyPromoCode: (code: string) => boolean;
  itemCount: number;
  /** False until the saved cart has been read from localStorage. */
  isLoaded: boolean;
  isOpen: boolean;
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
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

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

  const applyPromoCode = useCallback((code: string) => {
    const promotion = findPromotion(code);
    setPromoCode(promotion ? promotion.code : null);
    return promotion !== null;
  }, []);

  const changeQuantity = useCallback((productId: string, delta: number) => {
    setItems((current) => changeCartQuantity(current, productId, delta));
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      promoCode,
      applyPromoCode,
      itemCount: countItems(items),
      isLoaded,
      isOpen,
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
      promoCode,
      applyPromoCode,
      isLoaded,
      isOpen,
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
