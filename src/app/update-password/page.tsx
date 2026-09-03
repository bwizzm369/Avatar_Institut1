import { cookies } from "next/headers";
import { Suspense } from "react";
import { PASSWORD_RECOVERY_COOKIE } from "@/lib/auth/password-reset";
import { UpdatePasswordForm } from "./UpdatePasswordForm";

export default async function UpdatePasswordPage() {
  const jar = await cookies();
  const hasRecoverySession = jar.get(PASSWORD_RECOVERY_COOKIE)?.value === "1";

  return (
    <Suspense fallback={null}>
      <UpdatePasswordForm hasRecoverySession={hasRecoverySession} />
    </Suspense>
  );
}
