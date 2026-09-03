import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { safeAuthRedirect } from "@/lib/auth/guards";
import {
  authRedirectOrigin,
  callbackFailureRedirect,
  clientAuthRecoveryTarget,
  genericResetRequestResult,
  isPasswordResetNext,
  isSupabaseEmailLinkError,
  passwordResetEmailRedirectTo,
  PRODUCTION_APP_ORIGIN,
  recoveryExpiredRedirect,
  resolveAuthCallbackNext,
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

  it("uses the production callback URL with next=/update-password", () => {
    expect(passwordResetEmailRedirectTo(PRODUCTION_APP_ORIGIN)).toBe(
      "https://avatarinstitut.com/auth/callback?next=/update-password",
    );
  });

  it("maps Vercel Preview hosts to the authorized production callback URL", () => {
    expect(
      passwordResetEmailRedirectTo(
        "https://avatar-institut-platform-abc123-avatar313.vercel.app",
      ),
    ).toBe("https://avatarinstitut.com/auth/callback?next=/update-password");
  });

  it("keeps signup callback failures on /login", () => {
    expect(callbackFailureRedirect("/dashboard")).toBe("/login?error=callback");
    expect(callbackFailureRedirect("/update-password")).toBe(
      "/forgot-password?error=expired",
    );
    expect(callbackFailureRedirect("/dashboard", "recovery")).toBe(
      "/forgot-password?error=expired",
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

  it("maps expired Supabase email-link errors to /forgot-password", () => {
    expect(
      isSupabaseEmailLinkError({
        error: "access_denied",
        errorCode: "otp_expired",
        errorDescription: "Email+link+is+invalid+or+has+expired",
      }),
    ).toBe(true);
    expect(recoveryExpiredRedirect()).toBe("/forgot-password?error=expired");
    expect(
      isSupabaseEmailLinkError({
        error: "callback",
        errorCode: null,
        errorDescription: null,
      }),
    ).toBe(false);
  });

  it("refuses external or malicious next values", () => {
    expect(resolveAuthCallbackNext("https://evil.example", "recovery")).toBe(
      "/update-password",
    );
    expect(resolveAuthCallbackNext("//evil.example", "recovery")).toBe(
      "/update-password",
    );
    expect(resolveAuthCallbackNext("/\\evil", null)).toBe("/dashboard");
    expect(safeAuthRedirect("https://evil.example")).toBe("/dashboard");
    expect(safeAuthRedirect("//phish.test/login")).toBe("/dashboard");
    expect(safeAuthRedirect("https://avatarinstitut.com.evil")).toBe(
      "/dashboard",
    );
    expect(resolveAuthCallbackNext("/update-password", "recovery")).toBe(
      "/update-password",
    );
  });

  it("sends a valid recovery callback to /update-password", () => {
    expect(resolveAuthCallbackNext(null, "recovery")).toBe("/update-password");
    expect(resolveAuthCallbackNext("/update-password", null)).toBe(
      "/update-password",
    );
  });

  it("routes hash and query recovery failures away from the homepage", () => {
    expect(
      clientAuthRecoveryTarget({
        pathname: "/",
        search:
          "?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired",
        hash: "",
      }),
    ).toEqual({ kind: "redirect", href: "/forgot-password?error=expired" });

    expect(
      clientAuthRecoveryTarget({
        pathname: "/",
        search: "",
        hash: "#error=access_denied&error_code=otp_expired",
      }),
    ).toEqual({ kind: "redirect", href: "/forgot-password?error=expired" });

    expect(
      clientAuthRecoveryTarget({
        pathname: "/forgot-password",
        search: "?error=expired",
        hash: "#error=access_denied&error_code=otp_expired",
      }),
    ).toBeNull();
  });

  it("forwards recovery codes and token_hash to the callback", () => {
    expect(
      clientAuthRecoveryTarget({
        pathname: "/",
        search: "?token_hash=abc&type=recovery",
        hash: "",
      }),
    ).toEqual({
      kind: "redirect",
      href: "/auth/callback?token_hash=abc&type=recovery&next=%2Fupdate-password",
    });

    const implicit = clientAuthRecoveryTarget({
      pathname: "/",
      search: "",
      hash: "#access_token=tok&refresh_token=ref&type=recovery",
    });
    expect(implicit).toEqual({
      kind: "session",
      accessToken: "tok",
      refreshToken: "ref",
    });
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
    const middleware = readFileSync(
      path.resolve(process.cwd(), "src/middleware.ts"),
      "utf8",
    );

    expect(actions).toMatch(/authRedirectOrigin/);
    expect(actions).toMatch(/resetPasswordForEmail/);
    expect(actions).toMatch(/passwordResetEmailRedirectTo/);
    expect(actions).toMatch(/updateUser/);
    expect(actions).toMatch(/PASSWORD_RESET_LOGIN_PATH/);
    expect(actions).toMatch(/PASSWORD_RECOVERY_COOKIE/);
    expect(actions).not.toMatch(/createServiceRoleSupabaseClient/);
    expect(actions).not.toMatch(/admin\.updateUserById/);
    expect(actions).not.toMatch(/console\.(log|info|debug|error).*password/i);
    expect(forgot).toMatch(/resetPasswordForEmail/);
    expect(forgot).toMatch(
      /passwordResetEmailRedirectTo\(window\.location\.origin\)/,
    );
    expect(forgot).toMatch(/auth\.resetLinkExpired/);
    expect(forgot).not.toMatch(/createServiceRoleSupabaseClient/);
    expect(update).not.toMatch(/createServiceRoleSupabaseClient/);
    expect(update).toMatch(/auth\.newPassword/);
    expect(update).toMatch(/auth\.confirmNewPassword/);
    expect(update).toMatch(/auth\.submitNewPassword/);
    expect(login).toMatch(/\/forgot-password/);
    expect(login).toMatch(/auth\.resetSuccess/);
    expect(callback).toMatch(/exchangeCodeForSession/);
    expect(callback).toMatch(/verifyOtp/);
    expect(callback).toMatch(/callbackFailureRedirect/);
    expect(callback).toMatch(/recoveryExpiredRedirect/);
    expect(callback).not.toMatch(/new URL\("\/"/);
    expect(middleware).toMatch(/isSupabaseEmailLinkError/);
    expect(middleware).toMatch(/recoveryExpiredRedirect/);
  });
});
