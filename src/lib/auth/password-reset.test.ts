import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  authRedirectOrigin,
  callbackFailureRedirect,
  genericResetRequestResult,
  isPasswordResetNext,
  passwordResetEmailRedirectTo,
  UPDATE_PASSWORD_PATH,
} from "@/lib/auth/password-reset";

describe("password reset helpers", () => {
  it("sends recovery through the existing auth callback", () => {
    expect(
      passwordResetEmailRedirectTo("http://localhost:3000"),
    ).toBe("http://localhost:3000/auth/callback?next=/update-password");
    expect(isPasswordResetNext(UPDATE_PASSWORD_PATH)).toBe(true);
    expect(isPasswordResetNext("/dashboard")).toBe(false);
  });

  it("keeps signup callback failures on /login", () => {
    expect(callbackFailureRedirect("/dashboard")).toBe("/login?error=callback");
    expect(callbackFailureRedirect("/update-password")).toBe(
      "/update-password?error=invalid",
    );
  });

  it("returns a generic success that does not encode account existence", () => {
    expect(genericResetRequestResult()).toEqual({ ok: true });
  });

  it("falls back to localhost when NEXT_PUBLIC_APP_URL is empty", () => {
    const previous = process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(authRedirectOrigin()).toBe("http://localhost:3000");
    if (previous === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = previous;
    }
  });
});

describe("password reset source invariants", () => {
  it("uses official Auth recovery and never the service-role client", () => {
    const actions = readFileSync(
      path.resolve(process.cwd(), "src/lib/auth/actions.ts"),
      "utf8",
    );
    const forgot = readFileSync(
      path.resolve(process.cwd(), "src/app/forgot-password/page.tsx"),
      "utf8",
    );
    const update = readFileSync(
      path.resolve(process.cwd(), "src/app/update-password/UpdatePasswordForm.tsx"),
      "utf8",
    );
    const login = readFileSync(
      path.resolve(process.cwd(), "src/app/login/LoginForm.tsx"),
      "utf8",
    );
    const callback = readFileSync(
      path.resolve(process.cwd(), "src/app/auth/callback/route.ts"),
      "utf8",
    );

    expect(actions).toMatch(/authRedirectOrigin/);
    expect(actions).toMatch(/resetPasswordForEmail/);
    expect(actions).toMatch(/updateUser/);
    expect(actions).not.toMatch(/createServiceRoleSupabaseClient/);
    expect(actions).not.toMatch(/admin\.updateUserById/);
    expect(actions).not.toMatch(/console\.(log|info|debug|error).*password/i);
    expect(forgot).not.toMatch(/createServiceRoleSupabaseClient/);
    expect(update).not.toMatch(/createServiceRoleSupabaseClient/);
    expect(login).toMatch(/\/forgot-password/);
    expect(callback).toMatch(/exchangeCodeForSession/);
    expect(callback).toMatch(/callbackFailureRedirect/);
  });
});
