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
  loadCartForActor,
  persistCartForActor,
  removePurchasedCartItems,
  removeItemFromCart,
} from "@/lib/cart";
import { useAuth } from "@/components/AuthProvider";
import type { CartItem, Course } from "@/types";

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  totalCents: number;
  /** False until localStorage has been read on the client. */
  ready: boolean;
  addCourse: (course: Course) => void;
  removeCourse: (courseId: string) => void;
  removePurchasedCourses: (slugs: string[]) => void;
  hasCourse: (courseId: string) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, ready: authReady, configured: authConfigured } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (authConfigured && !authReady) {
      setItems([]);
      setReady(false);
      return;
    }

    setItems(loadCartForActor(window.localStorage, user?.id ?? null));
    setReady(true);
  }, [authConfigured, authReady, user?.id]);

  useEffect(() => {
    if (!canPersistCart(ready)) return;
    persistCartForActor(window.localStorage, user?.id ?? null, items);
  }, [items, ready, user?.id]);

  const addCourse = useCallback((course: Course) => {
    setItems((current) => addItemToCart(current, course));
  }, []);

  const removeCourse = useCallback((courseId: string) => {
    setItems((current) => removeItemFromCart(current, courseId));
  }, []);

  const removePurchasedCourses = useCallback((slugs: string[]) => {
    setItems((current) => removePurchasedCartItems(current, slugs));
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
      removePurchasedCourses,
      hasCourse,
    }),
    [items, ready, addCourse, removeCourse, removePurchasedCourses, hasCourse],
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
