import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { getAdminAccess } from "@/lib/admin/access";

export default async function AdminLoginPage() {
  const access = await getAdminAccess();
  if (access.status === "ok") {
    redirect("/admin");
  }

  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}
