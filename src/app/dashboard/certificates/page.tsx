import { DashboardCertificatesClient } from "@/components/DashboardCertificatesClient";
import { DashboardShell } from "@/components/DashboardShell";
import { loadStudentCertificatesState } from "@/lib/certificates/student";

export default async function DashboardCertificatesPage() {
  const state = await loadStudentCertificatesState();

  return (
    <DashboardShell
      titleKey="dashboard.certificatesTitle"
      noticeKey="dashboard.notice"
    >
      <DashboardCertificatesClient state={state} />
    </DashboardShell>
  );
}
