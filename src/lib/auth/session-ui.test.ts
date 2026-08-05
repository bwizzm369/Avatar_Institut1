import { describe, expect, it } from "vitest";
import { isClientSignedIn, resolveCartCheckoutCta } from "@/lib/auth/session-ui";

describe("client auth UI consistency", () => {
  it("treats dashboard and cart the same when a session user exists", () => {
    const state = {
      configured: true,
      ready: true,
      user: { id: "user-1" },
    };
    expect(isClientSignedIn(state)).toBe(true);
    expect(resolveCartCheckoutCta({ pending: false, ready: true, user: state.user })).toBe(
      "checkout",
    );
  });

  it("shows login CTAs when ready and unauthenticated", () => {
    expect(
      isClientSignedIn({ configured: true, ready: true, user: null }),
    ).toBe(false);
    expect(
      resolveCartCheckoutCta({ pending: false, ready: true, user: null }),
    ).toBe("login_required");
  });

  it("keeps checkout loading while auth is pending", () => {
    expect(
      resolveCartCheckoutCta({ pending: true, ready: true, user: { id: "u" } }),
    ).toBe("loading");
  });
});
