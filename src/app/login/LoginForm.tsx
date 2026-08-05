"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { useAuth } from "@/components/AuthProvider";
import { safeAuthRedirect } from "@/lib/auth/guards";
import { validateLogin } from "@/lib/auth/validation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { msg } from "@/lib/i18n";

function fieldErrorMessage(
  code: string | undefined,
  locale: "en" | "ar",
): string | null {
  if (!code) return null;
  if (code === "required") return msg("auth.error.required", locale);
  if (code === "invalid") return msg("auth.error.emailInvalid", locale);
  return msg("auth.validationFailed", locale);
}

function mapBrowserSignInError(error: {
  message?: string;
  code?: string;
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

  return "auth.invalidCredentials";
}

export function LoginForm() {
  const { locale } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const next = searchParams.get("next") ?? "/dashboard";
  const urlError = searchParams.get("error");
  const configured = isSupabaseConfigured();

  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(() => {
    if (urlError === "config") return msg("auth.configMissing", locale);
    if (urlError === "callback") return msg("auth.callbackFailed", locale);
    return null;
  });
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setEmailError(null);
    setPasswordError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const parsed = validateLogin({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });

    if (!parsed.ok) {
      setEmailError(fieldErrorMessage(parsed.errors.email, locale));
      setPasswordError(fieldErrorMessage(parsed.errors.password, locale));
      setFeedback(msg("auth.validationFailed", locale));
      return;
    }

    if (!configured) {
      setFeedback(msg("auth.configMissing", locale));
      return;
    }

    setPending(true);
    try {
      // Sign in on the browser client so AuthProvider receives SIGNED_IN and
      // cookies are written where getUser() / Header / cart CTA can see them.
      // Server Action login alone left the browser session null → SIGN IN TO PAY.
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.values.email,
        password: parsed.values.password,
      });

      if (error) {
        setFeedback(msg(mapBrowserSignInError(error), locale));
        return;
      }

      const redirectTo = safeAuthRedirect(next);
      await refresh();
      router.push(redirectTo);
      router.refresh();
    } catch {
      setFeedback(msg("auth.networkError", locale));
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="section">
      <div className="auth-card">
        <h1 className="display display-md">{msg("auth.loginTitle", locale)}</h1>
        <div className="notice-box" role="status">
          {configured
            ? msg("auth.connectedNotice", locale)
            : msg("auth.configMissing", locale)}
        </div>
        <form
          className="form-stack"
          method="post"
          onSubmit={handleSubmit}
          noValidate
        >
          <input type="hidden" name="next" value={next} />
          <div className="form-field">
            <label htmlFor="login-email">{msg("auth.email", locale)}</label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-invalid={emailError ? true : undefined}
            />
            {emailError ? (
              <p className="form-error" role="alert">
                {emailError}
              </p>
            ) : null}
          </div>
          <div className="form-field">
            <label htmlFor="login-password">{msg("auth.password", locale)}</label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              aria-invalid={passwordError ? true : undefined}
            />
            {passwordError ? (
              <p className="form-error" role="alert">
                {passwordError}
              </p>
            ) : null}
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={pending}
          >
            {pending
              ? msg("auth.submitting", locale)
              : msg("auth.submitLogin", locale)}
          </button>
        </form>
        {feedback ? (
          <div className="notice-box" role="alert">
            {feedback}
          </div>
        ) : null}
        <p className="auth-switch">
          {msg("auth.noAccount", locale)}{" "}
          <Link href="/signup">{msg("nav.signup", locale)}</Link>
        </p>
      </div>
    </section>
  );
}
