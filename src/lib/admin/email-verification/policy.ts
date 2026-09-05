import {
  CODE_TTL_MS,
  MAX_ATTEMPTS,
  RESEND_COOLDOWN_MS,
} from "@/lib/admin/email-verification/constants";
import type { ProfileRole } from "@/lib/admin/guards";
import { isAdminRole } from "@/lib/admin/guards";

export type AdminVerificationChallengeState = {
  id: string;
  profileId: string;
  sessionId: string;
  codeHash: string;
  expiresAt: Date;
  attemptCount: number;
  lastSentAt: Date;
  consumedAt: Date | null;
  supersededAt: Date | null;
  lockedAt: Date | null;
};

export type AdminVerificationFailureReason =
  | "not_admin"
  | "invalid"
  | "expired"
  | "locked"
  | "reused"
  | "cooldown"
  | "email_unavailable"
  | "unauthenticated";

export function canRequestAdminVerificationCode(role: string | null | undefined): boolean {
  return isAdminRole(role as ProfileRole);
}

export function isChallengeExpired(
  challenge: Pick<AdminVerificationChallengeState, "expiresAt">,
  now: Date,
): boolean {
  return now.getTime() > challenge.expiresAt.getTime();
}

export function isChallengeConsumed(
  challenge: Pick<AdminVerificationChallengeState, "consumedAt">,
): boolean {
  return challenge.consumedAt !== null;
}

export function isChallengeSuperseded(
  challenge: Pick<AdminVerificationChallengeState, "supersededAt">,
): boolean {
  return challenge.supersededAt !== null;
}

export function isChallengeLocked(
  challenge: Pick<AdminVerificationChallengeState, "lockedAt" | "attemptCount">,
): boolean {
  return challenge.lockedAt !== null || challenge.attemptCount >= MAX_ATTEMPTS;
}

export function isChallengePending(
  challenge: AdminVerificationChallengeState,
  now: Date,
): boolean {
  return (
    !isChallengeConsumed(challenge) &&
    !isChallengeSuperseded(challenge) &&
    !isChallengeLocked(challenge) &&
    !isChallengeExpired(challenge, now)
  );
}

export function resendCooldownRemainingMs(
  challenge: Pick<AdminVerificationChallengeState, "lastSentAt"> | null,
  now: Date,
): number {
  if (!challenge) {
    return 0;
  }
  const elapsed = now.getTime() - challenge.lastSentAt.getTime();
  return Math.max(0, RESEND_COOLDOWN_MS - elapsed);
}

export function nextChallengeExpiry(now: Date): Date {
  return new Date(now.getTime() + CODE_TTL_MS);
}

/** The fifth incorrect attempt locks immediately (attemptCount === MAX_ATTEMPTS). */
export function attemptsAfterFailure(current: number): {
  attemptCount: number;
  locked: boolean;
} {
  const attemptCount = current + 1;
  return {
    attemptCount,
    locked: attemptCount >= MAX_ATTEMPTS,
  };
}

export function classifyStoredChallenge(
  challenge: AdminVerificationChallengeState | null,
  now: Date,
): AdminVerificationFailureReason | "pending" | "missing" {
  if (!challenge) {
    return "missing";
  }
  if (isChallengeSuperseded(challenge)) {
    return "reused";
  }
  if (isChallengeConsumed(challenge)) {
    return "reused";
  }
  if (isChallengeLocked(challenge)) {
    return "locked";
  }
  if (isChallengeExpired(challenge, now)) {
    return "expired";
  }
  return "pending";
}
