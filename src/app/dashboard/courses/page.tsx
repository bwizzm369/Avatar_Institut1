import { DashboardCoursesClient } from "@/components/DashboardCoursesClient";
import { DashboardShell } from "@/components/DashboardShell";
import { getDashboardStudentState } from "@/lib/enrollments/queries";

export default async function DashboardCoursesPage() {
  const state = await getDashboardStudentState();

  return (
    <DashboardShell
      titleKey="dashboard.coursesTitle"
      noticeKey="dashboard.notice"
    >
      <DashboardCoursesClient state={state} />
    </DashboardShell>
  );
}
