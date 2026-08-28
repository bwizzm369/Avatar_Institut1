/**
 * Student Pass subscription domain types and pure helpers.
 * Stripe billing writes source = stripe via the webhook sync helper.
 */

export const STUDENT_PASS_PRICE_EUR = 12;
export const STUDENT_PASS_PRICE_CENTS = 1200;
export const STUDENT_PASS_PRICE_LABEL = "12 €/month";
export const STUDENT_PASS_STRIPE_SOURCE = "stripe";

export const STUDENT_PASS_STRIPE_PLANS = [
  "monthly",
  "semiannual",
  "annual",
] as const;

export type StudentPassStripePlan = (typeof STUDENT_PASS_STRIPE_PLANS)[number];

export const STUDENT_PASS_STRIPE_PLAN_SPECS = {
  monthly: {
    eur: 12,
    cents: 1200,
    interval: "month",
    intervalCount: 1,
    label: "12 €/month",
  },
  semiannual: {
    eur: 72,
    cents: 7200,
    interval: "month",
    intervalCount: 6,
    label: "72 € / 6 months",
  },
  annual: {
    eur: 144,
    cents: 14400,
    interval: "year",
    intervalCount: 1,
    label: "144 €/year",
  },
} as const;

export function isStudentPassStripePlan(
  value: string | null | undefined,
): value is StudentPassStripePlan {
  return (
    value === "monthly" ||
    value === "semiannual" ||
    value === "annual"
  );
}

export const STUDENT_PASS_STATUSES = [
  "active",
  "inactive",
  "cancelled",
  "expired",
] as const;

export type StudentPassStatus = (typeof STUDENT_PASS_STATUSES)[number];

export const STUDENT_PASS_MANUAL_SOURCES = ["manual", "offline"] as const;
export type StudentPassManualSource =
  (typeof STUDENT_PASS_MANUAL_SOURCES)[number];

export type StudentPassSubscriptionFields = {
  status: StudentPassStatus | string;
  expires_at: string | null;
};

/**
 * Pure entitlement check (mirrors SQL has_active_student_pass).
 * True only when status = active AND expires_at is null or in the future.
 */
export function hasActiveStudentPass(
  subscription: StudentPassSubscriptionFields | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!subscription) return false;
  if (subscription.status !== "active") return false;
  if (subscription.expires_at == null) return true;
  const expiresAt = new Date(subscription.expires_at);
  if (Number.isNaN(expiresAt.getTime())) return false;
  return expiresAt.getTime() > now.getTime();
}

export function isStudentPassManualSource(
  value: string | null | undefined,
): value is StudentPassManualSource {
  return (
    value === "manual" ||
    value === "offline"
  );
}

export function isStudentPassStripeSource(
  value: string | null | undefined,
): boolean {
  return value === STUDENT_PASS_STRIPE_SOURCE;
}

/**
 * Admin must not convert a live Stripe-billed row into manual/offline.
 * Cancelled or expired Stripe rows may receive a later manual grant.
 */
export function isProtectedStripeStudentPass(row: {
  source?: string | null;
  status?: string | null;
  stripe_subscription_id?: string | null;
} | null | undefined): boolean {
  if (!row) return false;
  if (!isStudentPassStripeSource(row.source)) return false;
  if (!row.stripe_subscription_id?.trim()) return false;
  return row.status !== "cancelled" && row.status !== "expired";
}

export function isStudentPassStatus(
  value: string | null | undefined,
): value is StudentPassStatus {
  return (
    value === "active" ||
    value === "inactive" ||
    value === "cancelled" ||
    value === "expired"
  );
}

/**
 * Students must never mutate Student Pass rows from the browser.
 * Mutations are admin-only (or future service-role billing webhooks).
 */
export type StudentPassMutationContext = "student" | "admin" | "service_role";

export function canMutateStudentPass(
  context: StudentPassMutationContext,
): boolean {
  return context === "admin" || context === "service_role";
}

export function assertCanMutateStudentPass(
  context: StudentPassMutationContext,
): void {
  if (!canMutateStudentPass(context)) {
    throw new Error(
      "STUDENT_PASS_MUTATION_FORBIDDEN: students cannot modify their Student Pass.",
    );
  }
}
