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
import type { CartItem } from "../lib/types";
import { findPromotion } from "../lib/promotions";
import { track } from "./posthog";

const STORAGE_KEY = "bean-and-byte:cart";
const PROMO_STORAGE_KEY = "bean-and-byte:promo-code";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  /** False until the saved cart has been read from localStorage. */
  isLoaded: boolean;
  isOpen: boolean;
  promoCode: string;
  setPromoCode: (code: string) => void;
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
  const [promoCode, setPromoCode] = useState("");

  useEffect(() => {
    setItems(parseStoredCart(window.localStorage.getItem(STORAGE_KEY)));
    setPromoCode(
      findPromotion(window.localStorage.getItem(PROMO_STORAGE_KEY) ?? "")
        ?.code ?? ""
    );
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    // Writing before the first read would wipe the saved cart.
    if (isLoaded) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      window.localStorage.setItem(PROMO_STORAGE_KEY, promoCode);
    }
  }, [items, promoCode, isLoaded]);

  const addItem = useCallback((productId: string) => {
    setItems((current) => addCartItem(current, productId));
  }, []);

  const changeQuantity = useCallback((productId: string, delta: number) => {
    setItems((current) => changeCartQuantity(current, productId, delta));
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount: countItems(items),
      isLoaded,
      isOpen,
      promoCode,
      setPromoCode,
      addItem,
      changeQuantity,
      clear: () => {
        setItems([]);
        setPromoCode("");
      },
      openCart: () => {
        setIsOpen(true);
        track(ANALYTICS_EVENTS.cartOpened, cartProperties(items));
      },
      closeCart: () => setIsOpen(false),
    }),
    [items, promoCode, isLoaded, isOpen, addItem, changeQuantity]
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
