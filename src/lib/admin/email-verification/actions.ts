"use server";

import { getAdminIdentity } from "@/lib/admin/access";
import { resolveSafeAdminRedirect } from "@/lib/admin/auth-policy";
import {
  confirmAdminEmailVerification,
  requestAdminEmailVerification,
} from "@/lib/admin/email-verification/runtime";
import type { AdminVerificationFailureReason } from "@/lib/admin/email-verification/policy";
import { ADMIN_HOME_PATH } from "@/lib/admin/paths";
import { isLocale } from "@/lib/i18n";
import type { Locale } from "@/types";

export type AdminEmailVerificationActionResult = {
  ok: boolean;
  reason?: AdminVerificationFailureReason;
  redirectTo?: string;
  retryAfterSeconds?: number;
};

function readLocale(value: FormDataEntryValue | null): Locale {
  const raw = String(value ?? "en");
  return isLocale(raw) ? raw : "en";
}

export async function submitAdminEmailVerificationAction(
  formData: FormData,
): Promise<AdminEmailVerificationActionResult> {
  const identity = await getAdminIdentity();
  if (identity.status === "unauthenticated" || identity.status === "unconfigured") {
    return { ok: false, reason: "unauthenticated" };
  }
  if (identity.status !== "ok") {
    return { ok: false, reason: "not_admin" };
  }

  const result = await confirmAdminEmailVerification({
    profileId: identity.userId,
    role: identity.profile.role,
    sessionId: identity.sessionId,
    code: String(formData.get("code") ?? ""),
  });

  if (!result.ok) {
    return { ok: false, reason: result.reason };
  }

  return {
    ok: true,
    redirectTo: resolveSafeAdminRedirect(String(formData.get("next") ?? ADMIN_HOME_PATH)),
  };
}

export async function resendAdminEmailVerificationAction(
  formData: FormData,
): Promise<AdminEmailVerificationActionResult> {
  const identity = await getAdminIdentity();
  if (identity.status === "unauthenticated" || identity.status === "unconfigured") {
    return { ok: false, reason: "unauthenticated" };
  }
  if (identity.status !== "ok") {
    return { ok: false, reason: "not_admin" };
  }

  const issued = await requestAdminEmailVerification({
    profileId: identity.userId,
    role: identity.profile.role,
    sessionId: identity.sessionId,
    email: identity.profile.email,
    locale: readLocale(formData.get("locale")),
    forceNew: true,
  });

  if (!issued.ok) {
    return {
      ok: false,
      reason: issued.reason,
      retryAfterSeconds: issued.retryAfterSeconds,
    };
  }

  return {
    ok: true,
    retryAfterSeconds: issued.retryAfterSeconds,
  };
}
