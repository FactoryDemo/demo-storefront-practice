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
import { track } from "./posthog";

const STORAGE_KEY = "bean-and-byte:cart";
const PROMO_STORAGE_KEY = "bean-and-byte:promo";

type CartContextValue = {
  items: CartItem[];
  promoCode: string;
  setPromoCode: (code: string) => void;
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
  const [promoCode, setPromoCode] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setItems(parseStoredCart(window.localStorage.getItem(STORAGE_KEY)));
    setPromoCode(window.localStorage.getItem(PROMO_STORAGE_KEY) ?? "");
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
      promoCode,
      setPromoCode,
      itemCount: countItems(items),
      isLoaded,
      isOpen,
      addItem,
      changeQuantity,
      clear: () => {
        setItems([]);
        setPromoCode("");
      },
      openCart: () => {
        setIsOpen(true);
        track(ANALYTICS_EVENTS.cartOpened, cartProperties(items, promoCode));
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
