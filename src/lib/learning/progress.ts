export type LessonType = "video" | "text" | "pdf";

export type LessonProgressStatus = "not_started" | "in_progress" | "completed";

export type CourseProgressSummary = {
  totalLessons: number;
  completedLessons: number;
  percent: number;
};

/**
 * Derives learner-facing status from a lesson_progress row.
 * No row → not started; completed → completed; otherwise in progress.
 */
export function deriveLessonProgressStatus(input: {
  completed?: boolean | null;
  hasRow?: boolean;
} | null | undefined): LessonProgressStatus {
  if (!input || !input.hasRow) {
    return "not_started";
  }
  if (input.completed) {
    return "completed";
  }
  return "in_progress";
}

/**
 * Global course progress for enrolled students.
 * Percent is floored; empty courses report 0%.
 */
export function computeCourseProgress(
  totalLessons: number,
  completedLessons: number,
): CourseProgressSummary {
  const total = Math.max(0, Math.floor(totalLessons));
  const completed = Math.min(total, Math.max(0, Math.floor(completedLessons)));
  const percent =
    total === 0 ? 0 : Math.min(100, Math.floor((completed / total) * 100));
  return { totalLessons: total, completedLessons: completed, percent };
}

/**
 * Active enrollment gate used by the student reader.
 * URL params alone never grant access.
 */
export function isActiveEnrollmentRow(
  row: {
    status: string;
    payment_confirmed_at: string | null;
  } | null | undefined,
): row is {
  status: string;
  payment_confirmed_at: string;
} {
  if (!row) return false;
  return row.status === "active" && row.payment_confirmed_at != null;
}
