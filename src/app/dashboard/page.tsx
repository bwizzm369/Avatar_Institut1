import { DashboardOverviewClient } from "@/components/DashboardOverviewClient";
import { DashboardShell } from "@/components/DashboardShell";
import { getDashboardStudentState } from "@/lib/enrollments/queries";

export default async function DashboardPage() {
  const state = await getDashboardStudentState();

  return (
    <DashboardShell titleKey="dashboard.title" noticeKey="dashboard.notice">
      <DashboardOverviewClient state={state} />
    </DashboardShell>
  );
}
