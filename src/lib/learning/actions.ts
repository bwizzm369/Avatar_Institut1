"use server";

import { revalidatePath } from "next/cache";
import { requireActiveEnrollmentForCourse } from "@/lib/learning/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type MarkLessonCompleteResult =
  | { ok: true }
  | { ok: false; errorKey: string };

/**
 * Marks a lesson complete via the authenticated user's session (RLS).
 * Enrollment is re-checked server-side; URL alone never grants write access.
 */
export async function markLessonCompleteAction(input: {
  courseSlug: string;
  lessonId: string;
}): Promise<MarkLessonCompleteResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, errorKey: "auth.configMissing" };
  }

  const lessonId = input.lessonId.trim();
  const courseSlug = input.courseSlug.trim();
  if (!lessonId || !courseSlug) {
    return { ok: false, errorKey: "learning.invalidRequest" };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, errorKey: "dashboard.unauthenticated" };
  }

  const { data: courseIdRaw } = await supabase.rpc("lesson_course_id", {
    p_lesson_id: lessonId,
  });
  const courseId = (courseIdRaw as string | null) ?? null;
  if (!courseId) {
    return { ok: false, errorKey: "learning.lessonNotFound" };
  }

  const { data: courseRow } = await supabase
    .from("courses")
    .select("slug")
    .eq("id", courseId)
    .maybeSingle();

  if (!courseRow || (courseRow as { slug: string }).slug !== courseSlug) {
    return { ok: false, errorKey: "learning.accessDenied" };
  }

  const access = await requireActiveEnrollmentForCourse(courseId);
  if (access.kind === "unauthenticated") {
    return { ok: false, errorKey: "dashboard.unauthenticated" };
  }
  if (access.kind !== "ok") {
    return { ok: false, errorKey: "learning.accessDenied" };
  }

  const completedAt = new Date().toISOString();
  const { error } = await supabase.from("lesson_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      completed: true,
      completed_at: completedAt,
    },
    { onConflict: "user_id,lesson_id" },
  );

  if (error) {
    return { ok: false, errorKey: "learning.progressSaveFailed" };
  }

  revalidatePath(`/dashboard/courses/${courseSlug}`);
  revalidatePath(`/dashboard/courses/${courseSlug}/lessons/${lessonId}`);
  revalidatePath("/dashboard/courses");

  return { ok: true };
}
