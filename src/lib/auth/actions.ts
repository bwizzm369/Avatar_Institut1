"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resolveStudentLoginDestination } from "@/lib/admin/auth-policy";
import { applyLegacyMatchAfterSignup } from "@/lib/auth/legacy-match-store";
import { cookies } from "next/headers";
import {
  authRedirectOrigin,
  genericResetRequestResult,
  passwordRecoveryCookieOptions,
  passwordResetEmailRedirectTo,
  PASSWORD_RECOVERY_COOKIE,
  PASSWORD_RESET_LOGIN_PATH,
} from "@/lib/auth/password-reset";
import {
  buildSignupUserMetadata,
  readSignupFormFields,
} from "@/lib/auth/signup-fields";
import {
  validateForgotPassword,
  validateLogin,
  validatePasswordReset,
  validateSignup,
} from "@/lib/auth/validation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AuthActionResult = {
  ok: boolean;
  errorKey?: string;
  fieldErrors?: Record<string, string>;
  needsEmailConfirmation?: boolean;
  redirectTo?: string;
};

function mapSignInError(error: {
  message?: string;
  code?: string;
  status?: number;
}): string {
  const code = (error.code ?? "").toLowerCase();
  const message = (error.message ?? "").toLowerCase();

  if (
    code === "email_not_confirmed" ||
    message.includes("email not confirmed")
  ) {
    return "auth.emailNotConfirmed";
  }

  if (
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("failed to fetch")
  ) {
    return "auth.networkError";
  }

  if (
    code === "invalid_credentials" ||
    message.includes("invalid login credentials") ||
    message.includes("invalid credentials")
  ) {
    return "auth.invalidCredentials";
  }

  return "auth.invalidCredentials";
}

export async function loginAction(
  formData: FormData,
): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, errorKey: "auth.configMissing" };
  }

  const parsed = validateLogin({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.ok) {
    return {
      ok: false,
      errorKey: "auth.validationFailed",
      fieldErrors: parsed.errors,
    };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.values.email,
      password: parsed.values.password,
    });

    if (error) {
      return { ok: false, errorKey: mapSignInError(error) };
    }

    const next = resolveStudentLoginDestination(
      String(formData.get("next") ?? "/dashboard"),
    );
    // Invalidate cached layouts so server components re-read the new session.
    revalidatePath("/", "layout");
    // Return redirect path to the client — do not throw redirect() here.
    // LoginForm's try/catch would otherwise swallow NEXT_REDIRECT.
    return { ok: true, redirectTo: next };
  } catch {
    return { ok: false, errorKey: "auth.networkError" };
  }
}

function isSignupEmailTakenError(error: {
  message?: string;
  code?: string;
}): boolean {
  const code = (error.code ?? "").toLowerCase();
  const message = (error.message ?? "").toLowerCase();
  return (
    code === "user_already_exists" ||
    code === "email_exists" ||
    message.includes("already been registered") ||
    message.includes("already registered") ||
    message.includes("user already exists") ||
    message.includes("email_exists") ||
    message.includes("already been taken")
  );
}

function isLikelyExistingSignupUser(user: {
  identities?: { id?: string }[] | null;
} | null): boolean {
  return Boolean(user && Array.isArray(user.identities) && user.identities.length === 0);
}

export async function signupAction(
  formData: FormData,
): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, errorKey: "auth.configMissing" };
  }

  const parsed = validateSignup(readSignupFormFields(formData));

  if (!parsed.ok) {
    return {
      ok: false,
      errorKey: "auth.validationFailed",
      fieldErrors: parsed.errors,
    };
  }

  const supabase = await createServerSupabaseClient();
  const origin = authRedirectOrigin();
  const metadata = buildSignupUserMetadata(parsed.values);

  const { data, error } = await supabase.auth.signUp({
    email: parsed.values.email,
    password: parsed.values.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
      data: metadata,
    },
  });

  if (error) {
    return {
      ok: false,
      errorKey: isSignupEmailTakenError(error)
        ? "auth.accountExists"
        : "auth.signupFailed",
    };
  }

  if (isLikelyExistingSignupUser(data.user)) {
    return { ok: false, errorKey: "auth.accountExists" };
  }

  if (data.user?.id) {
    try {
      await applyLegacyMatchAfterSignup({
        profileId: data.user.id,
        email: parsed.values.email,
        previouslyStudied: parsed.values.previouslyStudied,
        declaredCertificateNumber: parsed.values.declaredCertificateNumber,
      });
    } catch {
      // Profile already exists; matching is best-effort and must not block signup.
    }
  }

  if (!data.session) {
    return { ok: true, needsEmailConfirmation: true };
  }

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  if (!isSupabaseConfigured()) {
    redirect("/");
  }
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordResetAction(
  formData: FormData,
): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, errorKey: "auth.configMissing" };
  }

  const parsed = validateForgotPassword({
    email: String(formData.get("email") ?? ""),
  });

  if (!parsed.ok) {
    return {
      ok: false,
      errorKey: "auth.validationFailed",
      fieldErrors: parsed.errors,
    };
  }

  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.resetPasswordForEmail(parsed.values.email, {
      redirectTo: passwordResetEmailRedirectTo(),
    });
  } catch {
    // Still return the generic success so the UI cannot enumerate accounts.
  }

  return genericResetRequestResult();
}

export async function updatePasswordAction(
  formData: FormData,
): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, errorKey: "auth.configMissing" };
  }

  const parsed = validatePasswordReset({
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });

  if (!parsed.ok) {
    return {
      ok: false,
      errorKey: "auth.validationFailed",
      fieldErrors: parsed.errors,
    };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const cookieStore = await cookies();
    const recovery = cookieStore.get(PASSWORD_RECOVERY_COOKIE)?.value === "1";
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !recovery) {
      return { ok: false, errorKey: "auth.resetInvalid" };
    }

    const { error } = await supabase.auth.updateUser({
      password: parsed.values.password,
    });
    if (error) {
      return { ok: false, errorKey: "auth.resetUpdateFailed" };
    }

    await supabase.auth.signOut();
    cookieStore.set(
      PASSWORD_RECOVERY_COOKIE,
      "",
      passwordRecoveryCookieOptions(authRedirectOrigin().startsWith("https")),
    );
    cookieStore.delete(PASSWORD_RECOVERY_COOKIE);
    revalidatePath("/", "layout");
    return { ok: true, redirectTo: PASSWORD_RESET_LOGIN_PATH };
  } catch {
    return { ok: false, errorKey: "auth.networkError" };
  }
}

export async function markPasswordRecoveryAction(): Promise<{ ok: boolean }> {
  if (!isSupabaseConfigured()) {
    return { ok: false };
  }
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false };
  }
  const cookieStore = await cookies();
  cookieStore.set(
    PASSWORD_RECOVERY_COOKIE,
    "1",
    passwordRecoveryCookieOptions(authRedirectOrigin().startsWith("https")),
  );
  return { ok: true };
}
