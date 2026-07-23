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
import {
  addItemToCart,
  canPersistCart,
  getCartTotalCents,
  readCartFromStorage,
  removeItemFromCart,
  writeCartToStorage,
} from "@/lib/cart";
import type { CartItem, Course } from "@/types";

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  totalCents: number;
  /** False until localStorage has been read on the client. */
  ready: boolean;
  addCourse: (course: Course) => void;
  removeCourse: (courseId: string) => void;
  hasCourse: (courseId: string) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  // Single mount effect: read storage first, then mark ready (batched).
  useEffect(() => {
    setItems(readCartFromStorage(window.localStorage));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!canPersistCart(ready)) return;
    writeCartToStorage(window.localStorage, items);
  }, [items, ready]);

  const addCourse = useCallback((course: Course) => {
    setItems((current) => addItemToCart(current, course));
  }, []);

  const removeCourse = useCallback((courseId: string) => {
    setItems((current) => removeItemFromCart(current, courseId));
  }, []);

  const hasCourse = useCallback(
    (courseId: string) => items.some((item) => item.courseId === courseId),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      itemCount: items.length,
      totalCents: getCartTotalCents(items),
      ready,
      addCourse,
      removeCourse,
      hasCourse,
    }),
    [items, ready, addCourse, removeCourse, hasCourse],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
