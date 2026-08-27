import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { DashboardShell } from "@/components/DashboardShell";
import { LearningAccessDenied } from "@/components/LearningAccessDenied";
import { StudentLessonClient } from "@/components/StudentLessonClient";
import {
  dashboardLessonPath,
  resolveCourseSlugParam,
} from "@/lib/courses/course-slug";
import { getStudentLesson } from "@/lib/learning/queries";
import { englishAbsoluteTitle } from "@/lib/titles";

export const metadata: Metadata = {
  title: { absolute: englishAbsoluteTitle("dashboardLessonReader") },
};

export default async function DashboardLessonPage({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonId: string }>;
}) {
  const { courseSlug, lessonId } = await params;
  const slug = resolveCourseSlugParam(courseSlug);
  const result = await getStudentLesson(slug, lessonId);

  if (result.kind === "unauthenticated") {
    redirect(
      `/login?next=${encodeURIComponent(dashboardLessonPath(slug, lessonId))}`,
    );
  }

  return (
    <DashboardShell
      titleKey="dashboard.lessonReaderTitle"
      noticeKey="dashboard.notice"
    >
      {result.kind === "ok" ? (
        <StudentLessonClient view={result.data} />
      ) : (
        <LearningAccessDenied reason={result.kind} />
      )}
    </DashboardShell>
  );
}
