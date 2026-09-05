import { randomUUID } from "node:crypto";
import {
  generateAdminVerificationCode,
  hashAdminVerificationCode,
  hashesMatch,
  normalizeAdminVerificationCode,
} from "@/lib/admin/email-verification/crypto";
import {
  attemptsAfterFailure,
  canRequestAdminVerificationCode,
  classifyStoredChallenge,
  isChallengePending,
  nextChallengeExpiry,
  resendCooldownRemainingMs,
  type AdminVerificationFailureReason,
} from "@/lib/admin/email-verification/policy";
import type { AdminVerificationMailer } from "@/lib/admin/email-verification/send";
import type { AdminVerificationStore } from "@/lib/admin/email-verification/store";
import type { Locale } from "@/types";

export type IssueAdminVerificationResult =
  | { ok: true; issued: boolean; retryAfterSeconds: number }
  | { ok: false; reason: AdminVerificationFailureReason; retryAfterSeconds?: number };

export type VerifyAdminVerificationResult =
  | { ok: true; userId: string; sessionId: string }
  | { ok: false; reason: AdminVerificationFailureReason };

export type AdminVerificationServiceDeps = {
  store: AdminVerificationStore;
  send: AdminVerificationMailer;
  secret: string;
  now?: () => Date;
  createId?: () => string;
  createCode?: () => string;
};

function clock(deps: AdminVerificationServiceDeps): Date {
  return deps.now ? deps.now() : new Date();
}

export async function issueAdminVerificationChallenge(
  input: {
    profileId: string;
    role: string | null | undefined;
    sessionId: string;
    email: string;
    locale: Locale;
    forceNew?: boolean;
  },
  deps: AdminVerificationServiceDeps,
): Promise<IssueAdminVerificationResult> {
  if (!canRequestAdminVerificationCode(input.role)) {
    return { ok: false, reason: "not_admin" };
  }

  const now = clock(deps);
  const latest = await deps.store.findLatestForProfile(input.profileId);
  const cooldownMs = resendCooldownRemainingMs(latest, now);
  const pending = latest && isChallengePending(latest, now);

  if (pending && !input.forceNew) {
    return {
      ok: true,
      issued: false,
      retryAfterSeconds: Math.ceil(cooldownMs / 1000),
    };
  }

  if (input.forceNew && cooldownMs > 0) {
    return {
      ok: false,
      reason: "cooldown",
      retryAfterSeconds: Math.ceil(cooldownMs / 1000),
    };
  }

  if (!input.forceNew && latest && cooldownMs > 0 && !pending) {
    return {
      ok: false,
      reason: "cooldown",
      retryAfterSeconds: Math.ceil(cooldownMs / 1000),
    };
  }

  const code = (deps.createCode ?? generateAdminVerificationCode)();
  const id = (deps.createId ?? randomUUID)();
  const codeHash = hashAdminVerificationCode({
    secret: deps.secret,
    profileId: input.profileId,
    sessionId: input.sessionId,
    code,
  });

  await deps.store.supersedeOpenForProfile(input.profileId, now);
  await deps.store.insert({
    id,
    profileId: input.profileId,
    sessionId: input.sessionId,
    codeHash,
    expiresAt: nextChallengeExpiry(now),
    attemptCount: 0,
    lastSentAt: now,
  });

  const sent = await deps.send({
    to: input.email,
    locale: input.locale,
    code,
  });

  if (!sent.ok) {
    await deps.store.supersedeOpenForProfile(input.profileId, now);
    return { ok: false, reason: "email_unavailable" };
  }

  return { ok: true, issued: true, retryAfterSeconds: 60 };
}

export async function verifyAdminVerificationChallenge(
  input: {
    profileId: string;
    role: string | null | undefined;
    sessionId: string;
    code: string;
  },
  deps: AdminVerificationServiceDeps,
): Promise<VerifyAdminVerificationResult> {
  if (!canRequestAdminVerificationCode(input.role)) {
    return { ok: false, reason: "not_admin" };
  }

  const normalized = normalizeAdminVerificationCode(input.code);
  const now = clock(deps);
  const latest = await deps.store.findLatestForProfile(input.profileId);
  const classified = classifyStoredChallenge(latest, now);

  if (!latest || classified === "missing") {
    return { ok: false, reason: "invalid" };
  }
  if (classified !== "pending") {
    return { ok: false, reason: classified };
  }

  if (!normalized) {
    const next = attemptsAfterFailure(latest.attemptCount);
    if (next.locked) {
      await deps.store.lock(latest.id, next.attemptCount, now);
      return { ok: false, reason: "locked" };
    }
    await deps.store.incrementAttempts(latest.id, next.attemptCount);
    return { ok: false, reason: "invalid" };
  }

  const receivedHash = hashAdminVerificationCode({
    secret: deps.secret,
    profileId: input.profileId,
    sessionId: input.sessionId,
    code: normalized,
  });

  if (!hashesMatch(latest.codeHash, receivedHash) || latest.sessionId !== input.sessionId) {
    const next = attemptsAfterFailure(latest.attemptCount);
    if (next.locked) {
      await deps.store.lock(latest.id, next.attemptCount, now);
      return { ok: false, reason: "locked" };
    }
    await deps.store.incrementAttempts(latest.id, next.attemptCount);
    return { ok: false, reason: "invalid" };
  }

  await deps.store.consume(latest.id, now);
  return { ok: true, userId: input.profileId, sessionId: input.sessionId };
}
