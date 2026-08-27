/**
 * Student password recovery helpers.
 * Uses official Supabase Auth recovery only — never stores passwords.
 */

export const FORGOT_PASSWORD_PATH = "/forgot-password";
export const UPDATE_PASSWORD_PATH = "/update-password";
export const PASSWORD_RESET_LOGIN_PATH = "/login?reset=ok";

export function authRedirectOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

/** Recovery email lands on the existing PKCE callback, then /update-password. */
export function passwordResetEmailRedirectTo(origin = authRedirectOrigin()): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/auth/callback?next=${UPDATE_PASSWORD_PATH}`;
}

export function isPasswordResetNext(next: string): boolean {
  return next === UPDATE_PASSWORD_PATH;
}

/**
 * Failed code exchange: recovery goes to the update page (expired/invalid UI).
 * Signup/login confirmation keeps the existing /login?error=callback path.
 */
export function callbackFailureRedirect(next: string): string {
  if (isPasswordResetNext(next)) {
    return `${UPDATE_PASSWORD_PATH}?error=invalid`;
  }
  return "/login?error=callback";
}

/**
 * Same success payload whether or not the email exists.
 * Callers must not branch on Auth user lookup.
 */
export function genericResetRequestResult(): { ok: true } {
  return { ok: true };
}
