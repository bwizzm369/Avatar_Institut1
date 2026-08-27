import { hasActiveStudentPassForProfile } from "@/lib/admin/student-pass/access";
import { resolveCourseSlugParam } from "@/lib/courses/course-slug";
import { isVisibleToEnrolledStudent } from "@/lib/courses/student-visibility";
import {
  computeCourseProgress,
  deriveLessonProgressStatus,
  isActiveEnrollmentRow,
  type CourseProgressSummary,
  type LessonProgressStatus,
  type LessonType,
} from "@/lib/learning/progress";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  CourseRow,
  EnrollmentRow,
} from "@/types/database";

/** Lesson fields safe to send to the client for enrolled students. */
export type StudentLessonSummary = {
  id: string;
  moduleId: string;
  title_en: string;
  title_ar: string;
  durationMinutes: number;
  sortOrder: number;
  lessonType: LessonType;
  isPreview: boolean;
  /** True when a Bunny id exists — raw id is never sent to the browser. */
  hasBunnyVideo: boolean;
  progressStatus: LessonProgressStatus;
};

export type StudentModuleSummary = {
  id: string;
  title_en: string;
  title_ar: string;
  sortOrder: number;
  lessons: StudentLessonSummary[];
};

export type StudentCourseView = {
  course: Pick<
    CourseRow,
    | "id"
    | "slug"
    | "title_en"
    | "title_ar"
    | "summary_en"
    | "summary_ar"
    | "description_en"
    | "description_ar"
    | "is_demo"
    | "duration_weeks"
  >;
  /** Null when access is via active Student Pass + included course. */
  enrollment: EnrollmentRow | null;
  accessVia: "enrollment" | "student_pass";
  modules: StudentModuleSummary[];
  progress: CourseProgressSummary;
};

export type StudentLessonView = {
  courseSlug: string;
  courseTitle_en: string;
  courseTitle_ar: string;
  moduleTitle_en: string;
  moduleTitle_ar: string;
  lesson: StudentLessonSummary & {
    text_content_en: string;
    text_content_ar: string;
    pdf_url: string | null;
  };
  progress: CourseProgressSummary;
};

export type LearningAccessResult<T> =
  | { kind: "unconfigured" }
  | { kind: "unauthenticated" }
  | { kind: "forbidden" }
  | { kind: "not_found" }
  | { kind: "ok"; data: T };

type LessonDbRow = {
  id: string;
  module_id: string;
  title_en: string;
  title_ar: string;
  duration_minutes: number;
  sort_order: number;
  lesson_type: LessonType;
  bunny_video_id: string | null;
  text_content_en: string;
  text_content_ar: string;
  pdf_url: string | null;
  is_preview: boolean;
};

type ModuleDbRow = {
  id: string;
  course_id: string;
  title_en: string;
  title_ar: string;
  sort_order: number;
};

type ProgressDbRow = {
  lesson_id: string;
  completed: boolean;
};

/**
 * Server-side course access check.
 * Allows active individual enrollment OR (active Student Pass + included course).
 * Never trusts URL parameters alone. Does not revoke individual enrollments.
 */
export async function requireActiveEnrollmentForCourse(
  courseId: string,
): Promise<
  | { kind: "unconfigured" }
  | { kind: "unauthenticated" }
  | { kind: "forbidden" }
  | {
      kind: "ok";
      userId: string;
      enrollment: EnrollmentRow | null;
      accessVia: "enrollment" | "student_pass";
    }
> {
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

  const { data } = await supabase
    .from("enrollments")
    .select("*")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();

  const enrollment = data as EnrollmentRow | null;
  if (isActiveEnrollmentRow(enrollment)) {
    return {
      kind: "ok",
      userId: user.id,
      enrollment,
      accessVia: "enrollment",
    };
  }

  const { data: courseFlags } = await supabase
    .from("courses")
    .select("student_pass_included")
    .eq("id", courseId)
    .maybeSingle();

  if (
    courseFlags?.student_pass_included &&
    (await hasActiveStudentPassForProfile(user.id))
  ) {
    return {
      kind: "ok",
      userId: user.id,
      enrollment: null,
      accessVia: "student_pass",
    };
  }

  return { kind: "forbidden" };
}

export async function getStudentCourseBySlug(
  courseSlug: string,
): Promise<LearningAccessResult<StudentCourseView>> {
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

  const slug = resolveCourseSlugParam(courseSlug);
  if (!slug) {
    return { kind: "not_found" };
  }

  const { data: courseData } = await supabase
    .from("courses")
    .select(
      "id, slug, title_en, title_ar, summary_en, summary_ar, description_en, description_ar, is_demo, duration_weeks",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!courseData) {
    return { kind: "not_found" };
  }

  const course = courseData as StudentCourseView["course"];
  if (!isVisibleToEnrolledStudent(course)) {
    return { kind: "not_found" };
  }

  const access = await requireActiveEnrollmentForCourse(course.id);
  if (access.kind !== "ok") {
    return { kind: access.kind };
  }

  const { data: moduleRows } = await supabase
    .from("course_modules")
    .select("id, course_id, title_en, title_ar, sort_order")
    .eq("course_id", course.id)
    .order("sort_order", { ascending: true });

  const modulesRaw = (moduleRows ?? []) as ModuleDbRow[];
  const moduleIds = modulesRaw.map((m) => m.id);

  let lessonsRaw: LessonDbRow[] = [];
  if (moduleIds.length > 0) {
    const { data: lessonRows } = await supabase
      .from("lessons")
      .select(
        "id, module_id, title_en, title_ar, duration_minutes, sort_order, lesson_type, bunny_video_id, text_content_en, text_content_ar, pdf_url, is_preview",
      )
      .in("module_id", moduleIds)
      .order("sort_order", { ascending: true });
    lessonsRaw = (lessonRows ?? []) as LessonDbRow[];
  }

  const lessonIds = lessonsRaw.map((l) => l.id);
  const progressMap = new Map<string, ProgressDbRow>();
  if (lessonIds.length > 0) {
    const { data: progressRows } = await supabase
      .from("lesson_progress")
      .select("lesson_id, completed")
      .eq("user_id", user.id)
      .in("lesson_id", lessonIds);
    for (const row of (progressRows ?? []) as ProgressDbRow[]) {
      progressMap.set(row.lesson_id, row);
    }
  }

  const modules: StudentModuleSummary[] = modulesRaw.map((mod) => {
    const lessons = lessonsRaw
      .filter((lesson) => lesson.module_id === mod.id)
      .map((lesson) => toLessonSummary(lesson, progressMap.get(lesson.id)));
    return {
      id: mod.id,
      title_en: mod.title_en,
      title_ar: mod.title_ar,
      sortOrder: mod.sort_order,
      lessons,
    };
  });

  const allLessons = modules.flatMap((m) => m.lessons);
  const completedLessons = allLessons.filter(
    (l) => l.progressStatus === "completed",
  ).length;

  return {
    kind: "ok",
    data: {
      course,
      enrollment: access.enrollment,
      accessVia: access.accessVia,
      modules,
      progress: computeCourseProgress(allLessons.length, completedLessons),
    },
  };
}

export async function getStudentLesson(
  courseSlug: string,
  lessonId: string,
): Promise<LearningAccessResult<StudentLessonView>> {
  const courseResult = await getStudentCourseBySlug(courseSlug);
  if (courseResult.kind !== "ok") {
    return { kind: courseResult.kind };
  }

  const { data: courseView } = courseResult;
  let found: {
    module: StudentModuleSummary;
    lesson: StudentLessonSummary;
  } | null = null;

  for (const mod of courseView.modules) {
    const lesson = mod.lessons.find((l) => l.id === lessonId);
    if (lesson) {
      found = { module: mod, lesson };
      break;
    }
  }

  if (!found) {
    return { kind: "not_found" };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { kind: "unauthenticated" };
  }

  // Mark as in progress when opened (RLS-gated upsert).
  if (found.lesson.progressStatus === "not_started") {
    await supabase.from("lesson_progress").upsert(
      {
        user_id: user.id,
        lesson_id: lessonId,
        completed: false,
        completed_at: null,
      },
      { onConflict: "user_id,lesson_id" },
    );
    found.lesson = { ...found.lesson, progressStatus: "in_progress" };
  }

  const { data: lessonRow } = await supabase
    .from("lessons")
    .select("text_content_en, text_content_ar, pdf_url")
    .eq("id", lessonId)
    .maybeSingle();

  const content = (lessonRow ?? {
    text_content_en: "",
    text_content_ar: "",
    pdf_url: null,
  }) as {
    text_content_en: string;
    text_content_ar: string;
    pdf_url: string | null;
  };

  return {
    kind: "ok",
    data: {
      courseSlug: courseView.course.slug,
      courseTitle_en: courseView.course.title_en,
      courseTitle_ar: courseView.course.title_ar,
      moduleTitle_en: found.module.title_en,
      moduleTitle_ar: found.module.title_ar,
      lesson: {
        ...found.lesson,
        text_content_en: content.text_content_en,
        text_content_ar: content.text_content_ar,
        pdf_url: content.pdf_url,
      },
      progress: courseView.progress,
    },
  };
}

function toLessonSummary(
  lesson: LessonDbRow,
  progress: ProgressDbRow | undefined,
): StudentLessonSummary {
  return {
    id: lesson.id,
    moduleId: lesson.module_id,
    title_en: lesson.title_en,
    title_ar: lesson.title_ar,
    durationMinutes: lesson.duration_minutes,
    sortOrder: lesson.sort_order,
    lessonType: lesson.lesson_type,
    isPreview: lesson.is_preview,
    hasBunnyVideo: Boolean(lesson.bunny_video_id),
    progressStatus: deriveLessonProgressStatus({
      hasRow: Boolean(progress),
      completed: progress?.completed ?? false,
    }),
  };
}
