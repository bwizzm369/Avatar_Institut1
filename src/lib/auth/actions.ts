"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { safeAuthRedirect } from "@/lib/auth/guards";
import { validateLogin, validateSignup } from "@/lib/auth/validation";
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

    const next = safeAuthRedirect(
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

export async function signupAction(
  formData: FormData,
): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, errorKey: "auth.configMissing" };
  }

  const parsed = validateSignup({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
  });

  if (!parsed.ok) {
    return {
      ok: false,
      errorKey: "auth.validationFailed",
      fieldErrors: parsed.errors,
    };
  }

  const supabase = await createServerSupabaseClient();
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email: parsed.values.email,
    password: parsed.values.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
      data: {
        first_name: parsed.values.firstName,
        last_name: parsed.values.lastName,
        locale: String(formData.get("locale") ?? "en"),
      },
    },
  });

  if (error) {
    return { ok: false, errorKey: "auth.signupFailed" };
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
