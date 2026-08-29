/**
 * Student-facing Digital Membership presentation helpers.
 * Reuses existing Student Pass entitlement and profiles.id — no new numbering.
 */

import {
  hasActiveStudentPass,
  type StudentPassSubscriptionFields,
} from "@/lib/admin/student-pass/types";
import type { Locale } from "@/types";

export type DigitalMemberCardStatus = "ACTIVE" | "INACTIVE";
export type MembershipPeriodPlan = "monthly" | "semiannual" | "annual";

export type StudentMembershipCard = {
  fullName: string;
  memberId: string;
  cardStatus: DigitalMemberCardStatus;
  joinedAt: string | null;
  expiresAt: string | null;
  plan: MembershipPeriodPlan | null;
  isEntitled: boolean;
};

export type StudentMembershipState =
  | { kind: "unconfigured" }
  | { kind: "unauthenticated" }
  | { kind: "ready"; card: StudentMembershipCard };

export const PUBLIC_MEMBER_ID_PREFIX = "AVT-M-";
export const PUBLIC_MEMBER_ID_FALLBACK = "—";

/**
 * Public Member ID derived from profiles.id (display only).
 * profiles.id stays the internal key — this never writes a new column.
 * Format: AVT-M- + first 8 hex chars of the UUID, uppercase, no dashes.
 */
export function studentMemberId(
  profileId: string | null | undefined,
): string {
  const hex = (profileId ?? "")
    .trim()
    .replace(/-/g, "")
    .replace(/[^0-9a-fA-F]/g, "")
    .toUpperCase();
  if (hex.length < 8) return PUBLIC_MEMBER_ID_FALLBACK;
  return `${PUBLIC_MEMBER_ID_PREFIX}${hex.slice(0, 8)}`;
}

/**
 * Card stamp follows the existing Student Pass entitlement check.
 * Active + unexpired → ACTIVE. Missing / inactive / cancelled / expired → INACTIVE.
 */
export function digitalMemberCardStatus(
  subscription: StudentPassSubscriptionFields | null | undefined,
  now: Date = new Date(),
): DigitalMemberCardStatus {
  return hasActiveStudentPass(subscription, now) ? "ACTIVE" : "INACTIVE";
}

/**
 * Membership date: Student Pass started_at when a subscription exists,
 * otherwise the profile created_at (institute account date).
 */
export function membershipJoinedAt(input: {
  startedAt: string | null | undefined;
  profileCreatedAt: string | null | undefined;
}): string | null {
  const started = input.startedAt?.trim();
  if (started) return started;
  const created = input.profileCreatedAt?.trim();
  return created || null;
}

/**
 * Infer the purchased plan from the synced subscription period only.
 * Plan is not a column; monthly / semiannual / annual follow period length.
 */
export function inferStudentPassPlanFromPeriod(
  startedAt: string | null | undefined,
  expiresAt: string | null | undefined,
): MembershipPeriodPlan | null {
  const start = startedAt ? Date.parse(startedAt) : Number.NaN;
  const end = expiresAt ? Date.parse(expiresAt) : Number.NaN;
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return null;
  }
  const days = (end - start) / 86_400_000;
  if (days >= 20 && days <= 40) return "monthly";
  if (days >= 150 && days <= 210) return "semiannual";
  if (days >= 330 && days <= 400) return "annual";
  return null;
}

export function formatMembershipDate(
  iso: string | null,
  locale: Locale,
): string {
  if (!iso) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (!match) return iso;
  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
  return date.toLocaleDateString(locale === "ar" ? "ar" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function membershipDisplayName(input: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}): string {
  const name = [input.firstName, input.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || (input.email ?? "").trim();
}

export function toStudentMembershipCard(input: {
  profileId: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  profileCreatedAt?: string | null;
  subscription?: StudentPassSubscriptionFields & {
    started_at?: string | null;
  } | null;
  now?: Date;
}): StudentMembershipCard {
  const isEntitled = hasActiveStudentPass(input.subscription, input.now);
  const startedAt = input.subscription?.started_at ?? null;
  const expiresAt = input.subscription?.expires_at ?? null;
  return {
    fullName: membershipDisplayName(input),
    memberId: studentMemberId(input.profileId),
    cardStatus: isEntitled ? "ACTIVE" : "INACTIVE",
    joinedAt: membershipJoinedAt({
      startedAt,
      profileCreatedAt: input.profileCreatedAt,
    }),
    expiresAt,
    plan: inferStudentPassPlanFromPeriod(startedAt, expiresAt),
    isEntitled,
  };
}
