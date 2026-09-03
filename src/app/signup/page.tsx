"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { PasswordInput } from "@/components/PasswordInput";
import { signupAction } from "@/lib/auth/actions";
import { readSignupFormFields } from "@/lib/auth/signup-fields";
import { validateSignup } from "@/lib/auth/validation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { msg } from "@/lib/i18n";
import type { Locale } from "@/types";

function fieldErrorMessage(
  code: string | undefined,
  locale: Locale,
): string | null {
  if (!code) return null;
  if (code === "required") return msg("auth.error.required", locale);
  if (code === "invalid") return msg("auth.error.emailInvalid", locale);
  if (code === "tooShort") return msg("auth.error.passwordShort", locale);
  if (code === "tooLong") return msg("auth.error.tooLong", locale);
  if (code === "mismatch") return msg("auth.error.passwordMismatch", locale);
  return msg("auth.validationFailed", locale);
}

export default function SignupPage() {
  const { locale, setLocale } = useLocale();
  const router = useRouter();
  const configured = isSupabaseConfigured();

  const [pending, setPending] = useState(false);
  const [previouslyStudied, setPreviouslyStudied] = useState<"yes" | "no" | "">(
    "",
  );
  const [feedbackKey, setFeedbackKey] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>(
    {},
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedbackKey(null);
    setFieldErrors({});

    const form = event.currentTarget;
    const formData = new FormData(form);
    const parsed = validateSignup(readSignupFormFields(formData));

    if (!parsed.ok) {
      const nextErrors: Record<string, string> = {};
      for (const [key, code] of Object.entries(parsed.errors)) {
        if (code) nextErrors[key] = code;
      }
      setFieldErrors(nextErrors);
      setFeedbackKey("auth.validationFailed");
      return;
    }

    if (!configured) {
      setFeedbackKey("auth.configMissing");
      return;
    }

    setPending(true);
    try {
      const result = await signupAction(formData);
      if (!result.ok) {
        setFeedbackKey(result.errorKey ?? "auth.signupFailed");
        return;
      }
      if (result.needsEmailConfirmation) {
        setFeedbackKey("auth.confirmEmail");
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
      <div className="auth-card auth-card-signup">
        <h1 className="display display-md">{msg("auth.signupTitle", locale)}</h1>
        <div className="notice-box" role="status">
          {configured
            ? msg("auth.connectedNotice", locale)
            : msg("auth.configMissing", locale)}
        </div>
        <form className="form-stack" onSubmit={handleSubmit} noValidate>
          <fieldset className="form-fieldset">
            <legend>{msg("auth.section.identity", locale)}</legend>
            <div className="form-field">
              <label htmlFor="signup-first">
                {msg("auth.firstName", locale)}
              </label>
              <input
                id="signup-first"
                name="firstName"
                type="text"
                autoComplete="given-name"
                required
                aria-invalid={fieldErrors.firstName ? true : undefined}
              />
              {fieldErrorMessage(fieldErrors.firstName, locale) ? (
                <p className="form-error" role="alert">
                  {fieldErrorMessage(fieldErrors.firstName, locale)}
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
              {fieldErrorMessage(fieldErrors.lastName, locale) ? (
                <p className="form-error" role="alert">
                  {fieldErrorMessage(fieldErrors.lastName, locale)}
                </p>
              ) : null}
            </div>
          </fieldset>

          <fieldset className="form-fieldset">
            <legend>{msg("auth.section.contact", locale)}</legend>
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
              {fieldErrorMessage(fieldErrors.email, locale) ? (
                <p className="form-error" role="alert">
                  {fieldErrorMessage(fieldErrors.email, locale)}
                </p>
              ) : null}
            </div>
            <div className="form-field">
              <label htmlFor="signup-phone">{msg("auth.phone", locale)}</label>
              <input
                id="signup-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                aria-invalid={fieldErrors.phone ? true : undefined}
              />
              {fieldErrorMessage(fieldErrors.phone, locale) ? (
                <p className="form-error" role="alert">
                  {fieldErrorMessage(fieldErrors.phone, locale)}
                </p>
              ) : null}
            </div>
            <div className="form-field">
              <label htmlFor="signup-country">
                {msg("auth.country", locale)}
              </label>
              <input
                id="signup-country"
                name="country"
                type="text"
                autoComplete="country-name"
                required
                aria-invalid={fieldErrors.country ? true : undefined}
              />
              {fieldErrorMessage(fieldErrors.country, locale) ? (
                <p className="form-error" role="alert">
                  {fieldErrorMessage(fieldErrors.country, locale)}
                </p>
              ) : null}
            </div>
          </fieldset>

          <fieldset className="form-fieldset">
            <legend>{msg("auth.section.account", locale)}</legend>
            <div className="form-field">
              <label htmlFor="signup-password">
                {msg("auth.password", locale)}
              </label>
              <PasswordInput
                id="signup-password"
                name="password"
                autoComplete="new-password"
                required
                minLength={8}
                aria-invalid={fieldErrors.password ? true : undefined}
              />
              {fieldErrorMessage(fieldErrors.password, locale) ? (
                <p className="form-error" role="alert">
                  {fieldErrorMessage(fieldErrors.password, locale)}
                </p>
              ) : null}
            </div>
            <div className="form-field">
              <label htmlFor="signup-confirm">
                {msg("auth.confirmPassword", locale)}
              </label>
              <PasswordInput
                id="signup-confirm"
                name="confirmPassword"
                autoComplete="new-password"
                required
                minLength={8}
                aria-invalid={fieldErrors.confirmPassword ? true : undefined}
              />
              {fieldErrorMessage(fieldErrors.confirmPassword, locale) ? (
                <p className="form-error" role="alert">
                  {fieldErrorMessage(fieldErrors.confirmPassword, locale)}
                </p>
              ) : null}
            </div>
          </fieldset>

          <fieldset className="form-fieldset">
            <legend>{msg("auth.section.language", locale)}</legend>
            <div className="form-field">
              <span className="form-label-text">
                {msg("auth.preferredLanguage", locale)}
              </span>
              <div className="form-choice-row" role="radiogroup">
                <label className="form-choice">
                  <input
                    type="radio"
                    name="locale"
                    value="ar"
                    checked={locale === "ar"}
                    onChange={() => setLocale("ar")}
                  />
                  {msg("auth.language.ar", locale)}
                </label>
                <label className="form-choice">
                  <input
                    type="radio"
                    name="locale"
                    value="en"
                    checked={locale === "en"}
                    onChange={() => setLocale("en")}
                  />
                  {msg("auth.language.en", locale)}
                </label>
              </div>
            </div>
          </fieldset>

          <fieldset className="form-fieldset">
            <legend>{msg("auth.section.history", locale)}</legend>
            <div className="form-field">
              <span className="form-label-text">
                {msg("auth.previouslyStudied", locale)}
              </span>
              <div className="form-choice-row" role="radiogroup">
                <label className="form-choice">
                  <input
                    type="radio"
                    name="previouslyStudied"
                    value="yes"
                    checked={previouslyStudied === "yes"}
                    onChange={() => setPreviouslyStudied("yes")}
                    required
                  />
                  {msg("auth.previouslyStudiedYes", locale)}
                </label>
                <label className="form-choice">
                  <input
                    type="radio"
                    name="previouslyStudied"
                    value="no"
                    checked={previouslyStudied === "no"}
                    onChange={() => setPreviouslyStudied("no")}
                  />
                  {msg("auth.previouslyStudiedNo", locale)}
                </label>
              </div>
              {fieldErrorMessage(fieldErrors.previouslyStudied, locale) ? (
                <p className="form-error" role="alert">
                  {fieldErrorMessage(fieldErrors.previouslyStudied, locale)}
                </p>
              ) : null}
            </div>
            {previouslyStudied === "yes" ? (
              <>
                <div className="form-field">
                  <label htmlFor="signup-previous-course">
                    {msg("auth.previousCourse", locale)}
                  </label>
                  <input
                    id="signup-previous-course"
                    name="previousCourse"
                    type="text"
                    required
                    aria-invalid={fieldErrors.previousCourse ? true : undefined}
                  />
                  {fieldErrorMessage(fieldErrors.previousCourse, locale) ? (
                    <p className="form-error" role="alert">
                      {fieldErrorMessage(fieldErrors.previousCourse, locale)}
                    </p>
                  ) : null}
                </div>
                <div className="form-field">
                  <label htmlFor="signup-certificate">
                    {msg("auth.certificateNumberOptional", locale)}
                  </label>
                  <input
                    id="signup-certificate"
                    name="declaredCertificateNumber"
                    type="text"
                    autoComplete="off"
                    aria-invalid={
                      fieldErrors.declaredCertificateNumber ? true : undefined
                    }
                  />
                  {fieldErrorMessage(fieldErrors.declaredCertificateNumber, locale) ? (
                    <p className="form-error" role="alert">
                      {fieldErrorMessage(
                        fieldErrors.declaredCertificateNumber,
                        locale,
                      )}
                    </p>
                  ) : null}
                </div>
              </>
            ) : null}
          </fieldset>

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
        {feedbackKey ? (
          <div className="notice-box" role="status">
            {msg(feedbackKey, locale)}
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
