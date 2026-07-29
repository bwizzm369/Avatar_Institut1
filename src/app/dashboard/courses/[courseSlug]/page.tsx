import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { DashboardShell } from "@/components/DashboardShell";
import { LearningAccessDenied } from "@/components/LearningAccessDenied";
import { StudentCourseClient } from "@/components/StudentCourseClient";
import { getStudentCourseBySlug } from "@/lib/learning/queries";
import { englishAbsoluteTitle } from "@/lib/titles";

export const metadata: Metadata = {
  title: { absolute: englishAbsoluteTitle("dashboardCourseReader") },
};

export default async function DashboardCourseDetailPage({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;
  const result = await getStudentCourseBySlug(courseSlug);

  if (result.kind === "unauthenticated") {
    redirect(
      `/login?next=${encodeURIComponent(`/dashboard/courses/${courseSlug}`)}`,
    );
  }

  return (
    <DashboardShell
      titleKey="dashboard.courseReaderTitle"
      noticeKey="dashboard.notice"
    >
      {result.kind === "ok" ? (
        <StudentCourseClient view={result.data} />
      ) : (
        <LearningAccessDenied reason={result.kind} />
      )}
    </DashboardShell>
  );
}
