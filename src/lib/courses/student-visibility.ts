/**
 * Student-facing visibility (dashboard lists + course reader).
 * Demo/test courses stay in the database and enrollments are not revoked;
 * they are simply never shown or opened in the student experience.
 * Unpublished non-demo courses remain visible when the student has a
 * valid enrollment — this helper does not inspect is_published.
 */
export function isVisibleToEnrolledStudent(course: {
  is_demo: boolean;
}): boolean {
  return course.is_demo !== true;
}
