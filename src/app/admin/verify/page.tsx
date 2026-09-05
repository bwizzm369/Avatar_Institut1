import { redirect } from "next/navigation";
import { AdminEmailVerificationForm } from "@/components/admin/AdminEmailVerificationForm";
import { getAdminAccess, getAdminIdentity } from "@/lib/admin/access";
import { resolveSafeAdminRedirect } from "@/lib/admin/auth-policy";
import { requestAdminEmailVerification } from "@/lib/admin/email-verification/runtime";
import { ADMIN_HOME_PATH, ADMIN_LOGIN_PATH } from "@/lib/admin/paths";

export default async function AdminVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = resolveSafeAdminRedirect(params.next ?? ADMIN_HOME_PATH);
  const access = await getAdminAccess();

  if (access.status === "unconfigured" || access.status === "unauthenticated") {
    redirect(ADMIN_LOGIN_PATH);
  }

  if (access.status === "forbidden") {
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

  if (access.status === "ok") {
    redirect(next);
  }

  const identity = await getAdminIdentity();
  let emailUnavailable = false;
  let retryAfterSeconds = 60;

  if (identity.status === "ok") {
    const issued = await requestAdminEmailVerification({
      profileId: identity.userId,
      role: identity.profile.role,
      sessionId: identity.sessionId,
      email: identity.profile.email,
      locale: "en",
      forceNew: false,
    });
    if (!issued.ok && issued.reason === "email_unavailable") {
      emailUnavailable = true;
    }
    if (issued.ok) {
      retryAfterSeconds = issued.retryAfterSeconds;
    } else if (issued.retryAfterSeconds != null) {
      retryAfterSeconds = issued.retryAfterSeconds;
    }
  }

  return (
    <AdminEmailVerificationForm
      next={next}
      emailUnavailable={emailUnavailable}
      initialRetryAfterSeconds={retryAfterSeconds}
    />
  );
}
