import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminAccess } from "@/lib/admin/access";
import { decideAdminConsoleAccess } from "@/lib/admin/auth-policy";
import { ADMIN_LOGIN_PATH } from "@/lib/admin/paths";

export default async function AdminConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await getAdminAccess();
  const gate = decideAdminConsoleAccess({ status: access.status });

  if (gate.outcome === "redirect_login") {
    redirect(ADMIN_LOGIN_PATH);
  }

  if (gate.outcome === "redirect_verify") {
    redirect(gate.redirectTo);
  }

  if (gate.outcome === "deny" || access.status !== "ok") {
    return (
      <div className="admin-denied">
        <div className="admin-denied-card">
          <h1>Access denied</h1>
          <p>
            This account does not have administrator privileges. Return to the
            student dashboard or sign in with an admin account.
          </p>
          <div className="admin-denied-actions">
            <a href="/dashboard" className="admin-btn-primary">
              Go to student dashboard
            </a>
            <a href={ADMIN_LOGIN_PATH} className="admin-btn-ghost">
              Admin sign in
            </a>
          </div>
        </div>
      </div>
    );
  }

  const { profile } = access;
  const displayName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
    profile.email;

  return (
    <AdminShell email={profile.email} displayName={displayName}>
      {children}
    </AdminShell>
  );
}
