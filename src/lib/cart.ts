import type { CartItem, Course } from "@/types";

export const CART_STORAGE_KEY = "avatar-institut-cart";

export function courseToCartItem(course: Course): CartItem {
  return {
    courseId: course.id,
    slug: course.slug,
    title: course.title,
    priceCents: course.priceCents,
    currency: course.currency,
    addedAt: new Date().toISOString(),
  };
}

export function addItemToCart(items: CartItem[], course: Course): CartItem[] {
  if (items.some((item) => item.courseId === course.id)) {
    return items;
  }
  return [...items, courseToCartItem(course)];
}

export function removeItemFromCart(items: CartItem[], courseId: string): CartItem[] {
  return items.filter((item) => item.courseId !== courseId);
}

export function getCartTotalCents(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.priceCents, 0);
}

export function parseCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCartItem);
  } catch {
    return [];
  }
}

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.courseId === "string" &&
    typeof item.slug === "string" &&
    typeof item.priceCents === "number" &&
    typeof item.currency === "string" &&
    typeof item.addedAt === "string" &&
    typeof item.title === "object" &&
    item.title !== null
  );
}

/** Read cart from a Storage-like object. Never call during SSR render. */
export function readCartFromStorage(storage: Pick<Storage, "getItem">): CartItem[] {
  return parseCart(storage.getItem(CART_STORAGE_KEY));
}

/** Persist cart only after client hydration has completed. */
export function writeCartToStorage(
  storage: Pick<Storage, "setItem">,
  items: CartItem[],
): void {
  storage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

/**
 * Guard against overwriting localStorage with the empty initial state
 * before the first client read has finished.
 */
export function canPersistCart(hydrated: boolean): boolean {
  return hydrated;
}
