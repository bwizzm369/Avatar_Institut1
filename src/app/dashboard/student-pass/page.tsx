import { DashboardStudentPassClient } from "@/components/DashboardStudentPassClient";
import { DashboardShell } from "@/components/DashboardShell";
import { loadStudentMembershipState } from "@/lib/student-pass/load";

export default async function DashboardStudentPassPage() {
  const state = await loadStudentMembershipState();

  return (
    <DashboardShell
      titleKey="dashboard.studentPassTitle"
      noticeKey="dashboard.studentPassNotice"
    >
      <DashboardStudentPassClient state={state} />
    </DashboardShell>
  );
}
