/**
 * Student password recovery helpers.
 * Uses official Supabase Auth recovery only — never stores passwords.
 */

import { safeAuthRedirect } from "@/lib/auth/guards";

export const FORGOT_PASSWORD_PATH = "/forgot-password";
export const UPDATE_PASSWORD_PATH = "/update-password";
export const AUTH_CALLBACK_PATH = "/auth/callback";
export const PASSWORD_RESET_LOGIN_PATH = "/login?reset=ok";
export const PRODUCTION_APP_ORIGIN = "https://avatarinstitut.com";
export const PASSWORD_RECOVERY_COOKIE = "ai_password_recovery";
export const PASSWORD_RECOVERY_MAX_AGE_SECONDS = 15 * 60;

const AUTH_OTP_TYPES = new Set([
  "recovery",
  "email",
  "signup",
  "invite",
  "magiclink",
  "email_change",
]);

export function authRedirectOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

/**
 * Preview hosts are not in the Supabase Redirect URL allowlist.
 * Map them (and production-build localhost fallbacks) to the authorized origin.
 */
export function resolvePasswordResetOrigin(origin: string): string {
  const raw = origin.trim().replace(/\/$/, "");
  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    const host = url.hostname.toLowerCase();

    if (host === "avatarinstitut.com" || host === "www.avatarinstitut.com") {
      return `${url.protocol}//${host}`;
    }

    if (host.endsWith(".vercel.app")) {
      return PRODUCTION_APP_ORIGIN;
    }

    if (host === "localhost" || host === "127.0.0.1") {
      const vercelEnv = process.env.VERCEL_ENV;
      if (
        vercelEnv === "preview" ||
        vercelEnv === "production" ||
        process.env.NODE_ENV === "production"
      ) {
        return PRODUCTION_APP_ORIGIN;
      }
      return raw;
    }

    return raw;
  } catch {
    return PRODUCTION_APP_ORIGIN;
  }
}

/** Recovery email lands on the existing PKCE callback, then /update-password. */
export function passwordResetEmailRedirectTo(
  origin = authRedirectOrigin(),
): string {
  const base = resolvePasswordResetOrigin(origin);
  return `${base}${AUTH_CALLBACK_PATH}?next=${UPDATE_PASSWORD_PATH}`;
}

export function isPasswordResetNext(next: string): boolean {
  return next === UPDATE_PASSWORD_PATH;
}

export function isAuthOtpType(
  value: string | null | undefined,
): value is
  | "recovery"
  | "email"
  | "signup"
  | "invite"
  | "magiclink"
  | "email_change" {
  return Boolean(value && AUTH_OTP_TYPES.has(value));
}

export function decodeAuthParam(value: string | null | undefined): string {
  if (!value) return "";
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value.replace(/\+/g, " ");
  }
}

/**
 * Supabase verify failures land on Site URL or redirectTo as:
 * error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired
 * Do not treat /login?error=callback or /login?error=config as this case.
 */
export function isSupabaseEmailLinkError(params: {
  error?: string | null;
  errorCode?: string | null;
  errorDescription?: string | null;
}): boolean {
  const error = (params.error ?? "").trim().toLowerCase();
  const code = (params.errorCode ?? "").trim().toLowerCase();
  const desc = decodeAuthParam(params.errorDescription).toLowerCase();

  if (code === "otp_expired" || code === "otp_disabled") return true;
  if (desc.includes("email link is invalid") || desc.includes("has expired")) {
    return true;
  }
  if (error === "access_denied" && (code || desc)) return true;
  return false;
}

export function recoveryExpiredRedirect(): string {
  return `${FORGOT_PASSWORD_PATH}?error=expired`;
}

/**
 * Failed recovery goes to /forgot-password with a visible expired message.
 * Signup/login confirmation keeps /login?error=callback.
 */
export function callbackFailureRedirect(
  next: string,
  type: string | null = null,
): string {
  if (isPasswordResetNext(next) || type === "recovery") {
    return recoveryExpiredRedirect();
  }
  return "/login?error=callback";
}

export function resolveAuthCallbackNext(
  rawNext: string | null,
  type: string | null,
): string {
  const fallback =
    type === "recovery" ? UPDATE_PASSWORD_PATH : "/dashboard";
  return safeAuthRedirect(rawNext, fallback);
}

export function parseFragmentParams(hash: string): URLSearchParams {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  return new URLSearchParams(raw);
}

export function passwordRecoveryCookieOptions(secure: boolean): {
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: PASSWORD_RECOVERY_MAX_AGE_SECONDS,
  };
}

export type ClientAuthRecoveryTarget =
  | { kind: "redirect"; href: string }
  | {
      kind: "session";
      accessToken: string;
      refreshToken: string;
    };

/**
 * Client-only recovery routing (hash fragments never reach the server).
 * Query-string errors/codes are also handled here as a safety net.
 */
export function clientAuthRecoveryTarget(input: {
  pathname: string;
  search: string;
  hash: string;
}): ClientAuthRecoveryTarget | null {
  const search = new URLSearchParams(
    input.search.startsWith("?") ? input.search.slice(1) : input.search,
  );
  const hash = parseFragmentParams(input.hash);

  const errorParams = {
    error: hash.get("error") ?? search.get("error"),
    errorCode: hash.get("error_code") ?? search.get("error_code"),
    errorDescription:
      hash.get("error_description") ?? search.get("error_description"),
  };

  if (isSupabaseEmailLinkError(errorParams)) {
    if (input.pathname === FORGOT_PASSWORD_PATH) {
      return null;
    }
    return { kind: "redirect", href: recoveryExpiredRedirect() };
  }

  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  const hashType = hash.get("type");
  if (accessToken && refreshToken && hashType === "recovery") {
    return {
      kind: "session",
      accessToken,
      refreshToken,
    };
  }

  const code = search.get("code");
  const tokenHash = search.get("token_hash");
  const type = search.get("type") ?? hashType;
  if (
    (code || tokenHash) &&
    input.pathname !== AUTH_CALLBACK_PATH
  ) {
    const params = new URLSearchParams();
    if (code) params.set("code", code);
    if (tokenHash) params.set("token_hash", tokenHash);
    if (type) params.set("type", type);
    const next = resolveAuthCallbackNext(search.get("next"), type);
    params.set("next", next);
    return {
      kind: "redirect",
      href: `${AUTH_CALLBACK_PATH}?${params.toString()}`,
    };
  }

  return null;
}

/**
 * Same success payload whether or not the email exists.
 * Callers must not branch on Auth user lookup.
 */
export function genericResetRequestResult(): { ok: true } {
  return { ok: true };
}
