import type Stripe from "stripe";
import { assertServerEnrollmentGrant } from "@/lib/enrollments/policy";
import type { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";

export type EnrollmentGrantClient = ReturnType<
  typeof createServiceRoleSupabaseClient
>;

export type GrantResult =
  | { ok: true; grantedCourseIds: string[]; skipped: boolean }
  | { ok: false; error: string };

/**
 * Creates or updates enrollments after server-confirmed payment.
 * Idempotent on (user_id, course_id).
 */
export async function grantEnrollmentsAfterPayment(input: {
  supabase: EnrollmentGrantClient;
  userId: string;
  courseIds: string[];
  confirmedAt?: string;
}): Promise<GrantResult> {
  assertServerEnrollmentGrant("service_role");

  const courseIds = [...new Set(input.courseIds.filter(Boolean))];
  if (!input.userId || courseIds.length === 0) {
    return { ok: false, error: "missing_user_or_courses" };
  }

  const confirmedAt = input.confirmedAt ?? new Date().toISOString();
  const grantedCourseIds: string[] = [];

  for (const courseId of courseIds) {
    const { error } = await input.supabase.from("enrollments").upsert(
      {
        user_id: input.userId,
        course_id: courseId,
        status: "active",
        enrolled_at: confirmedAt,
        payment_confirmed_at: confirmedAt,
      },
      { onConflict: "user_id,course_id" },
    );

    if (error) {
      return { ok: false, error: error.message };
    }
    grantedCourseIds.push(courseId);
  }

  return { ok: true, grantedCourseIds, skipped: false };
}

export function parseCourseIdsFromMetadata(
  metadata: Stripe.Metadata | null | undefined,
): string[] {
  const raw = metadata?.course_ids?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function parseUserIdFromSession(
  session: Pick<Stripe.Checkout.Session, "metadata" | "client_reference_id">,
): string | null {
  const fromMeta = session.metadata?.user_id?.trim();
  if (fromMeta) return fromMeta;
  const fromRef = session.client_reference_id?.trim();
  return fromRef || null;
}
