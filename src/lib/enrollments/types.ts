import type { CourseProgressSummary } from "@/lib/learning/progress";
import type { CourseRow, EnrollmentRow, ProfileRow } from "@/types/database";

export type EnrolledCourse = {
  enrollment: EnrollmentRow;
  course: Pick<
    CourseRow,
    | "id"
    | "slug"
    | "title_en"
    | "title_ar"
    | "summary_en"
    | "summary_ar"
    | "is_demo"
    | "duration_weeks"
  >;
  /** Read-only progress summary for list cards (no write side-effects). */
  progress: CourseProgressSummary;
};

export type DashboardStudentState =
  | { kind: "unconfigured" }
  | { kind: "unauthenticated" }
  | {
      kind: "authenticated";
      profile: ProfileRow | null;
      email: string;
      enrollments: EnrolledCourse[];
    };
