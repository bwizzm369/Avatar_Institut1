/**
 * Enrollment access rules.
 *
 * Browser clients (anon key) must never create enrollments.
 * Grants happen only via the service-role client after payment confirmation
 * or manual validation (future payment phase).
 */

export const CLIENT_ENROLLMENT_MUTATIONS_ALLOWED = false;

/** Public enrollment helpers intentionally limited to reads in the app layer. */
export const ENROLLMENT_CLIENT_OPERATIONS = ["getDashboardStudentState"] as const;

export type EnrollmentCreateContext = "browser" | "service_role";

/**
 * Returns whether creating an enrollment is allowed in the given context.
 * Always false for browser — enforced in application code and by RLS.
 */
export function canCreateEnrollment(
  context: EnrollmentCreateContext,
): boolean {
  if (context === "browser") {
    return false;
  }
  return context === "service_role";
}

/**
 * Placeholder for the future server-only enrollment grant.
 * Throws if called from a browser context marker.
 */
export function assertServerEnrollmentGrant(
  context: EnrollmentCreateContext,
): void {
  if (!canCreateEnrollment(context)) {
    throw new Error(
      "ENROLLMENT_CREATE_FORBIDDEN: enrollments may only be created server-side after payment confirmation or manual validation.",
    );
  }
}
