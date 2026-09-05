"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { decideAdminLogin, resolveSafeAdminRedirect } from "@/lib/admin/auth-policy";
import {
  clearAdminVerificationCookie,
  isAdminEmailVerificationValid,
  requestAdminEmailVerification,
} from "@/lib/admin/email-verification/runtime";
import { ADMIN_HOME_PATH, ADMIN_LOGIN_PATH } from "@/lib/admin/paths";
import { validateLogin } from "@/lib/auth/validation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AdminAuthResult = {
  ok: boolean;
  error?: string;
  redirectTo?: string;
};

/**
 * After browser sign-in, verify the session user has role = admin.
 * Admins are sent to administrative email verification.
 * Non-admins are signed out and refused.
 */
export async function verifyAdminSessionAction(
  nextPath?: string | null,
): Promise<AdminAuthResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const identity = await getAdminIdentity();

  if (identity.status === "unconfigured") {
    return { ok: false, error: "Supabase is not configured." };
  }

  const role =
    identity.status === "ok"
      ? identity.profile.role
      : identity.status === "forbidden"
        ? (identity.profile?.role ?? "student")
        : null;

  const decision = decideAdminLogin({
    authenticated: identity.status !== "unauthenticated",
    role,
    nextPath,
  });

  if (decision.outcome === "unauthenticated") {
    return { ok: false, error: decision.error };
  }

  if (decision.outcome === "deny") {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
    return { ok: false, error: decision.error };
  }

  if (identity.status !== "ok") {
    return { ok: false, error: "Access denied." };
  }

  const alreadyVerified = await isAdminEmailVerificationValid({
    userId: identity.userId,
    sessionId: identity.sessionId,
  });
  if (alreadyVerified) {
    revalidatePath("/admin", "layout");
    return { ok: true, redirectTo: resolveSafeAdminRedirect(nextPath) };
  }

  const issued = await requestAdminEmailVerification({
    profileId: identity.userId,
    role: identity.profile.role,
    sessionId: identity.sessionId,
    email: identity.profile.email,
    locale: "en",
    forceNew: true,
  });

  if (!issued.ok && issued.reason === "email_unavailable") {
    return {
      ok: false,
      error: "The verification email could not be sent. Please try again later.",
    };
  }

  if (!issued.ok && issued.reason === "not_admin") {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
    return {
      ok: false,
      error: "Access denied. This account is not an administrator.",
    };
  }

  revalidatePath("/admin", "layout");
  return { ok: true, redirectTo: decision.redirectTo };
}

/**
 * Optional server-side sign-in path (tests / non-browser). Prefer browser
 * sign-in + verifyAdminSessionAction so cookies stay in sync.
 */
export async function adminLoginAction(
  formData: FormData,
): Promise<AdminAuthResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const parsed = validateLogin({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.ok) {
    return { ok: false, error: "Please enter a valid email and password." };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.values.email,
      password: parsed.values.password,
    });

    if (error) {
      return { ok: false, error: "Invalid email or password." };
    }

    return verifyAdminSessionAction(
      String(formData.get("next") ?? ADMIN_HOME_PATH),
    );
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

export async function adminLogoutAction(): Promise<void> {
  await clearAdminVerificationCookie();
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/admin", "layout");
  redirect(ADMIN_LOGIN_PATH);
}
