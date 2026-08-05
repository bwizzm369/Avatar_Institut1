import type { CartItem, Course } from "@/types";

export const CART_STORAGE_KEY = "avatar-institut-cart";
export const GUEST_CART_STORAGE_KEY = `${CART_STORAGE_KEY}:guest`;
export const CHECKOUT_PENDING_STORAGE_KEY = `${CART_STORAGE_KEY}:checkout-pending`;

type StorageReader = Pick<Storage, "getItem">;
type StorageWriter = Pick<Storage, "setItem" | "removeItem">;
type CartStorage = StorageReader & StorageWriter;

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

export function mergeCartItems(current: CartItem[], incoming: CartItem[]): CartItem[] {
  const merged = [...current];
  for (const item of incoming) {
    if (!merged.some((currentItem) => currentItem.courseId === item.courseId)) {
      merged.push(item);
    }
  }
  return merged;
}

export function removePurchasedCartItems(
  items: CartItem[],
  purchasedSlugs: string[],
): CartItem[] {
  if (purchasedSlugs.length === 0) return items;
  const purchased = new Set(purchasedSlugs);
  return items.filter((item) => !purchased.has(item.slug));
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
export function readCartFromStorage(
  storage: StorageReader,
  storageKey = GUEST_CART_STORAGE_KEY,
): CartItem[] {
  return parseCart(storage.getItem(storageKey));
}

/** Persist cart only after client hydration has completed. */
export function writeCartToStorage(
  storage: Pick<Storage, "setItem">,
  items: CartItem[],
  storageKey = GUEST_CART_STORAGE_KEY,
): void {
  storage.setItem(storageKey, JSON.stringify(items));
}

export function clearCartFromStorage(
  storage: Pick<Storage, "removeItem">,
  storageKey = GUEST_CART_STORAGE_KEY,
): void {
  storage.removeItem(storageKey);
}

export function resolveCartStorageKey(userId: string | null | undefined): string {
  if (!userId) return GUEST_CART_STORAGE_KEY;
  return `${CART_STORAGE_KEY}:user:${userId}`;
}

export function resolvePendingCheckoutStorageKey(
  userId: string | null | undefined,
): string {
  if (!userId) return `${CHECKOUT_PENDING_STORAGE_KEY}:guest`;
  return `${CHECKOUT_PENDING_STORAGE_KEY}:user:${userId}`;
}

export function loadCartForActor(
  storage: CartStorage,
  userId: string | null | undefined,
): CartItem[] {
  const actorKey = resolveCartStorageKey(userId);
  if (!userId) {
    return readCartFromStorage(storage, actorKey);
  }

  const guestItems = readCartFromStorage(storage, GUEST_CART_STORAGE_KEY);
  const userItems = readCartFromStorage(storage, actorKey);
  const merged = mergeCartItems(userItems, guestItems);
  writeCartToStorage(storage, merged, actorKey);
  clearCartFromStorage(storage, GUEST_CART_STORAGE_KEY);
  return merged;
}

export function persistCartForActor(
  storage: Pick<Storage, "setItem">,
  userId: string | null | undefined,
  items: CartItem[],
): void {
  writeCartToStorage(storage, items, resolveCartStorageKey(userId));
}

export function writePendingCheckoutSlugs(
  storage: Pick<Storage, "setItem">,
  userId: string | null | undefined,
  slugs: string[],
): void {
  storage.setItem(resolvePendingCheckoutStorageKey(userId), JSON.stringify(slugs));
}

export function readPendingCheckoutSlugs(
  storage: StorageReader,
  userId: string | null | undefined,
): string[] {
  const raw = storage.getItem(resolvePendingCheckoutStorageKey(userId));
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((slug): slug is string => typeof slug === "string");
  } catch {
    return [];
  }
}

export function clearPendingCheckoutSlugs(
  storage: Pick<Storage, "removeItem">,
  userId: string | null | undefined,
): void {
  storage.removeItem(resolvePendingCheckoutStorageKey(userId));
}

export function removePurchasedCoursesFromActorCart(
  storage: CartStorage,
  userId: string | null | undefined,
  purchasedSlugs: string[],
): CartItem[] {
  const actorKey = resolveCartStorageKey(userId);
  const currentItems = readCartFromStorage(storage, actorKey);
  const remainingItems = removePurchasedCartItems(currentItems, purchasedSlugs);
  writeCartToStorage(storage, remainingItems, actorKey);
  return remainingItems;
}

/**
 * Guard against overwriting localStorage with the empty initial state
 * before the first client read has finished.
 */
export function canPersistCart(hydrated: boolean): boolean {
  return hydrated;
}
