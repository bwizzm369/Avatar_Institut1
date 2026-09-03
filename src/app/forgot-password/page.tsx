"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { requestPasswordResetAction } from "@/lib/auth/actions";
import { passwordResetEmailRedirectTo } from "@/lib/auth/password-reset";
import { validateForgotPassword } from "@/lib/auth/validation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { msg } from "@/lib/i18n";

function emailErrorMessage(
  code: string | undefined,
  locale: "en" | "ar",
): string | null {
  if (!code) return null;
  if (code === "required") return msg("auth.error.required", locale);
  if (code === "invalid") return msg("auth.error.emailInvalid", locale);
  return msg("auth.validationFailed", locale);
}

export default function ForgotPasswordPage() {
  const { locale } = useLocale();
  const searchParams = useSearchParams();
  const configured = isSupabaseConfigured();
  const expiredLink = searchParams.get("error") === "expired";
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(() =>
    expiredLink ? msg("auth.resetLinkExpired", locale) : null,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailError(null);
    setFeedback(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const parsed = validateForgotPassword({
      email: String(formData.get("email") ?? ""),
    });

    if (!parsed.ok) {
      setEmailError(emailErrorMessage(parsed.errors.email, locale));
      setFeedback(msg("auth.validationFailed", locale));
      return;
    }

    if (!configured) {
      setFeedback(msg("auth.configMissing", locale));
      return;
    }

    setPending(true);
    try {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.resetPasswordForEmail(parsed.values.email, {
        redirectTo: passwordResetEmailRedirectTo(window.location.origin),
      });
      setSent(true);
      setFeedback(msg("auth.resetSent", locale));
    } catch {
      try {
        const result = await requestPasswordResetAction(formData);
        if (!result.ok && result.errorKey === "auth.configMissing") {
          setFeedback(msg("auth.configMissing", locale));
          return;
        }
        if (!result.ok && result.fieldErrors?.email) {
          setEmailError(emailErrorMessage(result.fieldErrors.email, locale));
          setFeedback(msg("auth.validationFailed", locale));
          return;
        }
      } catch {
        // Same generic success — never reveal whether the account exists.
      }
      setSent(true);
      setFeedback(msg("auth.resetSent", locale));
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="section">
      <div className="auth-card">
        <h1 className="display display-md">
          {msg("auth.forgotTitle", locale)}
        </h1>
        <div className="notice-box" role={expiredLink ? "alert" : "status"}>
          {!configured
            ? msg("auth.configMissing", locale)
            : expiredLink
              ? msg("auth.resetLinkExpired", locale)
              : msg("auth.forgotNotice", locale)}
        </div>
        <form
          className="form-stack"
          method="post"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="form-field">
            <label htmlFor="forgot-email">{msg("auth.email", locale)}</label>
            <input
              id="forgot-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={sent}
              aria-invalid={emailError ? true : undefined}
            />
            {emailError ? (
              <p className="form-error" role="alert">
                {emailError}
              </p>
            ) : null}
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={pending || sent || !configured}
          >
            {pending
              ? msg("auth.submitting", locale)
              : msg("auth.sendResetLink", locale)}
          </button>
        </form>
        {feedback ? (
          <div className="notice-box" role={expiredLink && !sent ? "alert" : "status"}>
            {feedback}
          </div>
        ) : null}
        <p className="auth-switch">
          <Link href="/login">{msg("auth.backToLogin", locale)}</Link>
        </p>
      </div>
    </section>
  );
}
