import { cookies } from "next/headers";
import {
  cookieMatchesSession,
  readAdminVerificationCookie,
  signAdminVerificationCookie,
} from "@/lib/admin/email-verification/crypto";
import {
  adminVerificationCookieName,
  adminVerificationCookieOptions,
  shouldUseSecureAdminVerificationCookie,
} from "@/lib/admin/email-verification/cookie";
import {
  getAdminVerificationSecret,
  resolveAdminVerificationConfirmSecret,
  resolveAdminVerificationIssueSecret,
} from "@/lib/admin/email-verification/env";
import { sendAdminVerificationEmail } from "@/lib/admin/email-verification/send";
import {
  issueAdminVerificationChallenge,
  verifyAdminVerificationChallenge,
  type IssueAdminVerificationResult,
  type VerifyAdminVerificationResult,
} from "@/lib/admin/email-verification/service";
import { createSupabaseAdminVerificationStore } from "@/lib/admin/email-verification/store";
import type { Locale } from "@/types";

export { getAdminVerificationSecret };

export async function isAdminEmailVerificationValid(options: {
  userId: string;
  sessionId: string;
}): Promise<boolean> {
  const secret = getAdminVerificationSecret();
  if (!secret) {
    return false;
  }
  const jar = await cookies();
  const payload = readAdminVerificationCookie(
    jar.get(adminVerificationCookieName())?.value,
    secret,
  );
  if (!payload) {
    return false;
  }
  return cookieMatchesSession(payload, options.userId, options.sessionId);
}

export function readAdminVerificationCookieFromValue(
  raw: string | undefined,
  userId: string,
  secret: string,
): boolean {
  const payload = readAdminVerificationCookie(raw, secret);
  return Boolean(payload && payload.sub === userId);
}

export async function setAdminVerificationCookie(options: {
  userId: string;
  sessionId: string;
  issuedAt?: Date;
}): Promise<void> {
  const secret = getAdminVerificationSecret();
  if (!secret) {
    return;
  }
  const jar = await cookies();
  const value = signAdminVerificationCookie({
    secret,
    userId: options.userId,
    sessionId: options.sessionId,
    issuedAt: options.issuedAt ?? new Date(),
  });
  jar.set(
    adminVerificationCookieName(),
    value,
    adminVerificationCookieOptions(shouldUseSecureAdminVerificationCookie()),
  );
}

export async function clearAdminVerificationCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(adminVerificationCookieName(), "", {
    ...adminVerificationCookieOptions(shouldUseSecureAdminVerificationCookie()),
    maxAge: 0,
  });
}

export async function requestAdminEmailVerification(input: {
  profileId: string;
  role: string | null | undefined;
  sessionId: string;
  email: string;
  locale: Locale;
  forceNew?: boolean;
}): Promise<IssueAdminVerificationResult> {
  const resolved = resolveAdminVerificationIssueSecret();
  if (!resolved.ok) {
    return { ok: false, reason: resolved.reason };
  }
  return issueAdminVerificationChallenge(input, {
    store: createSupabaseAdminVerificationStore(),
    send: sendAdminVerificationEmail,
    secret: resolved.secret,
  });
}

export async function confirmAdminEmailVerification(input: {
  profileId: string;
  role: string | null | undefined;
  sessionId: string;
  code: string;
}): Promise<VerifyAdminVerificationResult> {
  const resolved = resolveAdminVerificationConfirmSecret();
  if (!resolved.ok) {
    return { ok: false, reason: resolved.reason };
  }
  const result = await verifyAdminVerificationChallenge(input, {
    store: createSupabaseAdminVerificationStore(),
    send: sendAdminVerificationEmail,
    secret: resolved.secret,
  });
  if (result.ok) {
    await setAdminVerificationCookie({
      userId: result.userId,
      sessionId: result.sessionId,
    });
  }
  return result;
}
