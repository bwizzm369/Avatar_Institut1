import { ADMIN_EMAIL_VERIFICATION_COOKIE } from "@/lib/admin/email-verification/constants";

export type AdminVerificationCookieOptions = {
  httpOnly: true;
  secure: boolean;
  sameSite: "strict";
  path: "/";
};

export function adminVerificationCookieName(): string {
  return ADMIN_EMAIL_VERIFICATION_COOKIE;
}

export function adminVerificationCookieOptions(secure: boolean): AdminVerificationCookieOptions {
  return {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/",
  };
}

export function shouldUseSecureAdminVerificationCookie(): boolean {
  return process.env.NODE_ENV === "production";
}
