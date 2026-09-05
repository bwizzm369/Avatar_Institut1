import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { getAdminAccess } from "@/lib/admin/access";
import { ADMIN_HOME_PATH, ADMIN_VERIFY_PATH } from "@/lib/admin/paths";

export default async function AdminLoginPage() {
  const access = await getAdminAccess();
  if (access.status === "ok") {
    redirect(ADMIN_HOME_PATH);
  }
  if (access.status === "needs_verification") {
    redirect(ADMIN_VERIFY_PATH);
  }

  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}
