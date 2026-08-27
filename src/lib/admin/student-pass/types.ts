/**
 * Student Pass subscription domain types and pure helpers.
 * Billing (Stripe) is not wired — stripe_* fields are storage only.
 */

export const STUDENT_PASS_PRICE_EUR = 12;
export const STUDENT_PASS_PRICE_LABEL = "12 €/month";

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
