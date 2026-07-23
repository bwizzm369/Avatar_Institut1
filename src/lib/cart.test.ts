import { describe, expect, it } from "vitest";
import {
  addItemToCart,
  canPersistCart,
  getCartTotalCents,
  parseCart,
  readCartFromStorage,
  removeItemFromCart,
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
    writeCartToStorage(storage, items);
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
    writeCartToStorage(storage, seeded);

    // Simulate pre-hydration guard: empty state must not overwrite storage
    if (canPersistCart(false)) {
      writeCartToStorage(storage, []);
    }
    expect(readCartFromStorage(storage)).toHaveLength(1);

    if (canPersistCart(true)) {
      writeCartToStorage(storage, seeded);
    }
    expect(readCartFromStorage(storage)).toHaveLength(1);
  });
});
