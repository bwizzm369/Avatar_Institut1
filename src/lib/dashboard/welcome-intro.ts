/**
 * Dashboard welcome copy: payment thanks only after a confirmed payment state.
 */

export function dashboardIntroMessageKey(input: {
  hasConfirmedCoursePayment: boolean;
  hasActiveMembership: boolean;
}): "dashboard.intro" | "dashboard.introPaid" {
  if (input.hasConfirmedCoursePayment || input.hasActiveMembership) {
    return "dashboard.introPaid";
  }
  return "dashboard.intro";
}

export function hasConfirmedCoursePayment(
  enrollments: Array<{ enrollment: { payment_confirmed_at: string | null } }>,
): boolean {
  return enrollments.some((item) =>
    Boolean(item.enrollment.payment_confirmed_at),
  );
}
