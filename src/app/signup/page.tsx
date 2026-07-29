"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { signupAction } from "@/lib/auth/actions";
import { validateSignup } from "@/lib/auth/validation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { msg } from "@/lib/i18n";

function fieldErrorMessage(
  code: string | undefined,
  locale: "en" | "ar",
): string | null {
  if (!code) return null;
  if (code === "required") return msg("auth.error.required", locale);
  if (code === "invalid") return msg("auth.error.emailInvalid", locale);
  if (code === "tooShort") return msg("auth.error.passwordShort", locale);
  return msg("auth.validationFailed", locale);
}

export default function SignupPage() {
  const { locale } = useLocale();
  const router = useRouter();
  const configured = isSupabaseConfigured();

  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>(
    {},
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setFieldErrors({});

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("locale", locale);

    const parsed = validateSignup({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
    });

    if (!parsed.ok) {
      setFieldErrors({
        firstName: fieldErrorMessage(parsed.errors.firstName, locale),
        lastName: fieldErrorMessage(parsed.errors.lastName, locale),
        email: fieldErrorMessage(parsed.errors.email, locale),
        password: fieldErrorMessage(parsed.errors.password, locale),
      });
      setFeedback(msg("auth.validationFailed", locale));
      return;
    }

    if (!configured) {
      setFeedback(msg("auth.configMissing", locale));
      return;
    }

    setPending(true);
    try {
      const result = await signupAction(formData);
      if (!result.ok) {
        setFeedback(msg(result.errorKey ?? "auth.signupFailed", locale));
        return;
      }
      if (result.needsEmailConfirmation) {
        setFeedback(msg("auth.confirmEmail", locale));
        return;
      }
      router.refresh();
    } catch {
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="section">
      <div className="auth-card">
        <h1 className="display display-md">{msg("auth.signupTitle", locale)}</h1>
        <div className="notice-box" role="status">
          {configured
            ? msg("auth.connectedNotice", locale)
            : msg("auth.configMissing", locale)}
        </div>
        <form className="form-stack" onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="signup-first">{msg("auth.firstName", locale)}</label>
            <input
              id="signup-first"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              aria-invalid={fieldErrors.firstName ? true : undefined}
            />
            {fieldErrors.firstName ? (
              <p className="form-error" role="alert">
                {fieldErrors.firstName}
              </p>
            ) : null}
          </div>
          <div className="form-field">
            <label htmlFor="signup-last">{msg("auth.lastName", locale)}</label>
            <input
              id="signup-last"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              aria-invalid={fieldErrors.lastName ? true : undefined}
            />
            {fieldErrors.lastName ? (
              <p className="form-error" role="alert">
                {fieldErrors.lastName}
              </p>
            ) : null}
          </div>
          <div className="form-field">
            <label htmlFor="signup-email">{msg("auth.email", locale)}</label>
            <input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-invalid={fieldErrors.email ? true : undefined}
            />
            {fieldErrors.email ? (
              <p className="form-error" role="alert">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>
          <div className="form-field">
            <label htmlFor="signup-password">{msg("auth.password", locale)}</label>
            <input
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              aria-invalid={fieldErrors.password ? true : undefined}
            />
            {fieldErrors.password ? (
              <p className="form-error" role="alert">
                {fieldErrors.password}
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
              : msg("auth.submitSignup", locale)}
          </button>
        </form>
        {feedback ? (
          <div className="notice-box" role="status">
            {feedback}
          </div>
        ) : null}
        <p className="auth-switch">
          {msg("auth.hasAccount", locale)}{" "}
          <Link href="/login">{msg("nav.login", locale)}</Link>
        </p>
      </div>
    </section>
  );
}
