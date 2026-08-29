import { DashboardOverviewClient } from "@/components/DashboardOverviewClient";
import { DashboardShell } from "@/components/DashboardShell";
import { loadStudentCertificatesState } from "@/lib/certificates/student";
import { getDashboardStudentState } from "@/lib/enrollments/queries";
import { loadStudentMembershipState } from "@/lib/student-pass/load";

export default async function DashboardPage() {
  const [state, membership, certificates] = await Promise.all([
    getDashboardStudentState(),
    loadStudentMembershipState(),
    loadStudentCertificatesState(),
  ]);

  return (
    <DashboardShell titleKey="dashboard.title" noticeKey="dashboard.notice">
      <DashboardOverviewClient
        state={state}
        membership={membership}
        certificates={certificates}
      />
    </DashboardShell>
  );
}
