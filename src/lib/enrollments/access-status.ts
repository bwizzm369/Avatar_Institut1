/**
 * Post-checkout access UI state helpers.
 * Enrollment grants happen only via verified Stripe webhook — never from this page.
 */

export type AccessUiState = "waiting" | "activated" | "delayed";

export const ACCESS_POLL_INTERVAL_MS = 5_000;
export const ACCESS_POLL_MAX_MS = 60_000;

export type AccessStatusPayload = {
  activated: boolean;
  courseSlug: string | null;
  courseSlugs: string[];
};

export type EnrollmentCourseRow = {
  course_id: string;
};

export type CourseSlugRow = {
  id: string;
  slug: string;
};

/**
 * Derives the visible success-page state from poll results and elapsed time.
 * Does not grant access — only interprets read-only enrollment checks.
 * "delayed" is informational; callers may keep polling until activated.
 */
export function deriveAccessUiState(input: {
  activated: boolean;
  elapsedMs: number;
  maxWaitMs?: number;
}): AccessUiState {
  if (input.activated) {
    return "activated";
  }
  const maxWaitMs = input.maxWaitMs ?? ACCESS_POLL_MAX_MS;
  if (input.elapsedMs >= maxWaitMs) {
    return "delayed";
  }
  return "waiting";
}

/**
 * True while the success page should keep auto-checking.
 * Stops only after a matching enrollment is confirmed.
 */
export function shouldContinueAccessPolling(state: AccessUiState): boolean {
  return state !== "activated";
}

/**
 * Read-only match: active enrollments that belong to the Stripe session course_ids.
 * session_id / course_ids alone never unlock — a matching enrollment row is required.
 */
export function resolveAccessFromSessionCourses(input: {
  expectedCourseIds: string[];
  enrollments: EnrollmentCourseRow[];
  courses: CourseSlugRow[];
}): AccessStatusPayload {
  const expected = new Set(
    input.expectedCourseIds.map((id) => id.trim()).filter(Boolean),
  );
  if (expected.size === 0) {
    return { activated: false, courseSlug: null, courseSlugs: [] };
  }

  const matchedIds = input.enrollments
    .map((row) => row.course_id)
    .filter((courseId) => expected.has(courseId));

  if (matchedIds.length === 0) {
    return { activated: false, courseSlug: null, courseSlugs: [] };
  }

  const slugById = new Map(
    input.courses.map((course) => [course.id, course.slug] as const),
  );
  const courseSlugs = matchedIds
    .map((courseId) => slugById.get(courseId))
    .filter((slug): slug is string => Boolean(slug));

  return {
    activated: true,
    courseSlug: courseSlugs[0] ?? null,
    courseSlugs,
  };
}

/**
 * Timeline helper for tests and UI reasoning:
 * already present → activated immediately;
 * appears later → switches to activated;
 * never appears → delayed after the soft timeout.
 */
export function resolveAccessTimeline(input: {
  checks: Array<{ elapsedMs: number; activated: boolean }>;
  maxWaitMs?: number;
}): AccessUiState[] {
  return input.checks.map((check) =>
    deriveAccessUiState({
      activated: check.activated,
      elapsedMs: check.elapsedMs,
      maxWaitMs: input.maxWaitMs,
    }),
  );
}
