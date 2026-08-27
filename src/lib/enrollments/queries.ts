import { isVisibleToEnrolledStudent } from "@/lib/courses/student-visibility";
import { computeCourseProgress } from "@/lib/learning/progress";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { EnrollmentRow } from "@/types/database";
import type {
  DashboardStudentState,
  EnrolledCourse,
} from "@/lib/enrollments/types";

export type { DashboardStudentState, EnrolledCourse };

/**
 * Loads the current student's dashboard data.
 * Read-only: never inserts enrollments.
 * Progress is computed from existing lesson_progress rows only.
 */
export async function getDashboardStudentState(): Promise<DashboardStudentState> {
  if (!isSupabaseConfigured()) {
    return { kind: "unconfigured" };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { kind: "unauthenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const { data: enrollmentRows } = await supabase
    .from("enrollments")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .not("payment_confirmed_at", "is", null)
    .order("created_at", { ascending: false });

  const enrollments: EnrolledCourse[] = [];
  const rows = (enrollmentRows ?? []) as EnrollmentRow[];

  if (rows.length > 0) {
    const courseIds = [...new Set(rows.map((row) => row.course_id))];
    const { data: courses } = await supabase
      .from("courses")
      .select(
        "id, slug, title_en, title_ar, summary_en, summary_ar, is_demo, duration_weeks",
      )
      .in("id", courseIds);

    const courseMap = new Map(
      ((courses ?? []) as EnrolledCourse["course"][]).map((course) => [
        course.id,
        course,
      ]),
    );

    const { data: moduleRows } = await supabase
      .from("course_modules")
      .select("id, course_id")
      .in("course_id", courseIds);

    const modules = (moduleRows ?? []) as { id: string; course_id: string }[];
    const moduleIds = modules.map((m) => m.id);
    const moduleToCourse = new Map(modules.map((m) => [m.id, m.course_id]));

    const lessonsByCourse = new Map<string, string[]>();
    if (moduleIds.length > 0) {
      const { data: lessonRows } = await supabase
        .from("lessons")
        .select("id, module_id")
        .in("module_id", moduleIds);

      for (const lesson of (lessonRows ?? []) as {
        id: string;
        module_id: string;
      }[]) {
        const courseId = moduleToCourse.get(lesson.module_id);
        if (!courseId) continue;
        const list = lessonsByCourse.get(courseId) ?? [];
        list.push(lesson.id);
        lessonsByCourse.set(courseId, list);
      }
    }

    const allLessonIds = [...lessonsByCourse.values()].flat();
    const completedLessonIds = new Set<string>();
    if (allLessonIds.length > 0) {
      const { data: progressRows } = await supabase
        .from("lesson_progress")
        .select("lesson_id, completed")
        .eq("user_id", user.id)
        .eq("completed", true)
        .in("lesson_id", allLessonIds);

      for (const row of (progressRows ?? []) as {
        lesson_id: string;
        completed: boolean;
      }[]) {
        if (row.completed) completedLessonIds.add(row.lesson_id);
      }
    }

    for (const enrollment of rows) {
      const course = courseMap.get(enrollment.course_id);
      if (!course || !isVisibleToEnrolledStudent(course)) continue;
      const lessonIds = lessonsByCourse.get(course.id) ?? [];
      const completed = lessonIds.filter((id) =>
        completedLessonIds.has(id),
      ).length;
      enrollments.push({
        enrollment,
        course,
        progress: computeCourseProgress(lessonIds.length, completed),
      });
    }
  }

  return {
    kind: "authenticated",
    profile: profile ?? null,
    email: user.email ?? profile?.email ?? "",
    enrollments,
  };
}
