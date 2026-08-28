import { DashboardStudentPassClient } from "@/components/DashboardStudentPassClient";
import { DashboardShell } from "@/components/DashboardShell";
import { loadStudentMembershipState } from "@/lib/student-pass/load";

function parseCheckoutNotice(
  value: string | string[] | undefined,
): "success" | "cancelled" | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "success" || raw === "cancelled") return raw;
  return null;
}

export default async function DashboardStudentPassPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string | string[] }>;
}) {
  const params = await searchParams;
  const state = await loadStudentMembershipState();

  return (
    <DashboardShell
      titleKey="dashboard.studentPassTitle"
      noticeKey="dashboard.studentPassNotice"
    >
      <DashboardStudentPassClient
        state={state}
        checkout={parseCheckoutNotice(params.checkout)}
      />
    </DashboardShell>
  );
}
