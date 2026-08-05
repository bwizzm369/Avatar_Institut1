import { describe, expect, it } from "vitest";
import {
  addItemToCart,
  canPersistCart,
  clearCartFromStorage,
  GUEST_CART_STORAGE_KEY,
  getCartTotalCents,
  loadCartForActor,
  mergeCartItems,
  parseCart,
  persistCartForActor,
  readCartFromStorage,
  removePurchasedCartItems,
  removePurchasedCoursesFromActorCart,
  removeItemFromCart,
  resolveCartStorageKey,
  writeCartToStorage,
} from "@/lib/cart";
import { DEMO_COURSES } from "@/lib/courses";

function memoryStorage(initial: Record<string, string> = {}) {
  const store = { ...initial };
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    _store: store,
  };
}

describe("cart helpers", () => {
  it("adds a course once", () => {
    const course = DEMO_COURSES[0];
    const once = addItemToCart([], course);
    const twice = addItemToCart(once, course);
    expect(once).toHaveLength(1);
    expect(twice).toHaveLength(1);
    expect(twice[0]?.courseId).toBe(course.id);
  });

  it("removes a course and totals prices", () => {
    const first = DEMO_COURSES[0];
    const second = DEMO_COURSES[1];
    const items = addItemToCart(addItemToCart([], first), second);
    expect(getCartTotalCents(items)).toBe(first.priceCents + second.priceCents);
    const remaining = removeItemFromCart(items, first.id);
    expect(remaining).toHaveLength(1);
    expect(getCartTotalCents(remaining)).toBe(second.priceCents);
  });

  it("parses valid cart JSON and rejects invalid payloads", () => {
    const course = DEMO_COURSES[0];
    const items = addItemToCart([], course);
    expect(parseCart(JSON.stringify(items))).toHaveLength(1);
    expect(parseCart("not-json")).toEqual([]);
    expect(parseCart(JSON.stringify([{ foo: "bar" }]))).toEqual([]);
  });

  it("rehydrates cart from storage without reading during SSR defaults", () => {
    const course = DEMO_COURSES[0];
    const items = addItemToCart([], course);
    const storage = memoryStorage();
    writeCartToStorage(storage, items, GUEST_CART_STORAGE_KEY);
    const hydrated = readCartFromStorage(storage);
    expect(hydrated).toHaveLength(1);
    expect(hydrated[0]?.courseId).toBe(course.id);
    expect(getCartTotalCents(hydrated)).toBe(course.priceCents);
  });

  it("does not persist until hydration is complete", () => {
    expect(canPersistCart(false)).toBe(false);
    expect(canPersistCart(true)).toBe(true);

    const storage = memoryStorage();
    const course = DEMO_COURSES[0];
    const seeded = addItemToCart([], course);
    writeCartToStorage(storage, seeded, GUEST_CART_STORAGE_KEY);

    // Simulate pre-hydration guard: empty state must not overwrite storage
    if (canPersistCart(false)) {
      writeCartToStorage(storage, [], GUEST_CART_STORAGE_KEY);
    }
    expect(readCartFromStorage(storage)).toHaveLength(1);

    if (canPersistCart(true)) {
      writeCartToStorage(storage, seeded, GUEST_CART_STORAGE_KEY);
    }
    expect(readCartFromStorage(storage)).toHaveLength(1);
  });

  it("shows an empty guest cart after logout while keeping the user cart stored", () => {
    const storage = memoryStorage();
    const userId = "user-a";
    const userCart = addItemToCart([], DEMO_COURSES[0]);

    persistCartForActor(storage, userId, userCart);
    clearCartFromStorage(storage, GUEST_CART_STORAGE_KEY);

    expect(loadCartForActor(storage, null)).toEqual([]);
    expect(readCartFromStorage(storage, resolveCartStorageKey(userId))).toEqual(
      userCart,
    );
  });

  it("restores the same account cart on reconnection", () => {
    const storage = memoryStorage();
    const userId = "user-a";
    const userCart = addItemToCart([], DEMO_COURSES[0]);

    persistCartForActor(storage, userId, userCart);

    expect(loadCartForActor(storage, userId)).toEqual(userCart);
  });

  it("keeps carts isolated between different accounts", () => {
    const storage = memoryStorage();
    const userACart = addItemToCart([], DEMO_COURSES[0]);
    const userBCart = addItemToCart([], DEMO_COURSES[1]);

    persistCartForActor(storage, "user-a", userACart);
    persistCartForActor(storage, "user-b", userBCart);

    expect(loadCartForActor(storage, "user-a")).toEqual(userACart);
    expect(loadCartForActor(storage, "user-b")).toEqual(userBCart);
  });

  it("merges the guest cart into the account once on login without duplicates", () => {
    const storage = memoryStorage();
    const guestCart = addItemToCart(
      addItemToCart([], DEMO_COURSES[0]),
      DEMO_COURSES[1],
    );
    const userCart = addItemToCart([], DEMO_COURSES[1]);

    writeCartToStorage(storage, guestCart, GUEST_CART_STORAGE_KEY);
    persistCartForActor(storage, "user-a", userCart);

    const merged = loadCartForActor(storage, "user-a");

    expect(merged).toEqual(mergeCartItems(userCart, guestCart));
    expect(readCartFromStorage(storage)).toEqual([]);
    expect(loadCartForActor(storage, "user-a")).toEqual(merged);
  });

  it("removes only purchased courses from the signed-in cart after payment confirmation", () => {
    const storage = memoryStorage();
    const userId = "user-a";
    const guestCart = addItemToCart([], DEMO_COURSES[2]);
    const userCart = addItemToCart(
      addItemToCart([], DEMO_COURSES[0]),
      DEMO_COURSES[1],
    );

    writeCartToStorage(storage, guestCart, GUEST_CART_STORAGE_KEY);
    persistCartForActor(storage, userId, userCart);

    const remaining = removePurchasedCoursesFromActorCart(storage, userId, [
      DEMO_COURSES[0].slug,
    ]);

    expect(remaining).toEqual(
      removePurchasedCartItems(userCart, [DEMO_COURSES[0].slug]),
    );
    expect(readCartFromStorage(storage, resolveCartStorageKey(userId))).toEqual(
      remaining,
    );
    expect(readCartFromStorage(storage)).toEqual(guestCart);
  });
});
