"use client";

import { useState, type FormEvent } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { submitConsultationAction } from "@/app/consultation/actions";
import { readConsultationFormFields, validateConsultationRequest } from "@/lib/consultation/validation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { msg } from "@/lib/i18n";
import type { Locale } from "@/types";

function fieldErrorMessage(code: string | undefined, locale: Locale): string | null {
  if (!code) return null;
  if (code === "required") return msg("consultation.error.required", locale);
  if (code === "invalid") return msg("consultation.error.emailInvalid", locale);
  if (code === "tooShort") return msg("consultation.error.tooShort", locale);
  if (code === "tooLong") return msg("consultation.error.tooLong", locale);
  return msg("consultation.validationFailed", locale);
}

export function ConsultationFormClient() {
  const { locale } = useLocale();
  const configured = isSupabaseConfigured();
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [feedbackKey, setFeedbackKey] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedbackKey(null);
    setFieldErrors({});
    setSuccess(false);

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("locale", locale);

    const parsed = validateConsultationRequest(readConsultationFormFields(formData));
    if (parsed.spam) {
      setSuccess(true);
      form.reset();
      return;
    }

    if (!parsed.ok) {
      const nextErrors: Record<string, string> = {};
      for (const [key, code] of Object.entries(parsed.errors)) {
        if (code) nextErrors[key] = code;
      }
      setFieldErrors(nextErrors);
      setFeedbackKey("consultation.validationFailed");
      return;
    }

    if (!configured) {
      setFeedbackKey("consultation.configMissing");
      return;
    }

    setPending(true);
    try {
      const result = await submitConsultationAction(formData);
      if (!result.ok) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        setFeedbackKey(result.errorKey);
        return;
      }
      setSuccess(true);
      form.reset();
    } catch {
      setFeedbackKey("consultation.error");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="form-stack consultation-form" onSubmit={handleSubmit} noValidate>
      <input type="hidden" name="locale" value={locale} />
      <div className="visually-hidden" aria-hidden="true">
        <label htmlFor="consultation-company">Company website</label>
        <input
          id="consultation-company"
          name="companyWebsite"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="form-field">
        <label htmlFor="consultation-type">{msg("consultation.type", locale)}</label>
        <select
          id="consultation-type"
          name="requestType"
          required
          defaultValue=""
          aria-invalid={fieldErrors.requestType ? true : undefined}
        >
          <option value="" disabled>
            {msg("consultation.typePlaceholder", locale)}
          </option>
          <option value="consultation">
            {msg("consultation.type.consultation", locale)}
          </option>
          <option value="information">
            {msg("consultation.type.information", locale)}
          </option>
        </select>
        {fieldErrorMessage(fieldErrors.requestType, locale) ? (
          <p className="form-error" role="alert">
            {fieldErrorMessage(fieldErrors.requestType, locale)}
          </p>
        ) : null}
      </div>

      <div className="form-field">
        <label htmlFor="consultation-name">{msg("consultation.fullName", locale)}</label>
        <input
          id="consultation-name"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          aria-invalid={fieldErrors.fullName ? true : undefined}
        />
        {fieldErrorMessage(fieldErrors.fullName, locale) ? (
          <p className="form-error" role="alert">
            {fieldErrorMessage(fieldErrors.fullName, locale)}
          </p>
        ) : null}
      </div>

      <div className="form-field">
        <label htmlFor="consultation-email">{msg("consultation.email", locale)}</label>
        <input
          id="consultation-email"
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
        <label htmlFor="consultation-phone">{msg("consultation.phone", locale)}</label>
        <input
          id="consultation-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          aria-invalid={fieldErrors.phone ? true : undefined}
        />
        {fieldErrorMessage(fieldErrors.phone, locale) ? (
          <p className="form-error" role="alert">
            {fieldErrorMessage(fieldErrors.phone, locale)}
          </p>
        ) : null}
      </div>

      <div className="form-field">
        <label htmlFor="consultation-message">{msg("consultation.message", locale)}</label>
        <textarea
          id="consultation-message"
          name="message"
          rows={6}
          required
          aria-invalid={fieldErrors.message ? true : undefined}
        />
        {fieldErrorMessage(fieldErrors.message, locale) ? (
          <p className="form-error" role="alert">
            {fieldErrorMessage(fieldErrors.message, locale)}
          </p>
        ) : null}
      </div>

      <div className="form-field consultation-consent">
        <label htmlFor="consultation-consent">
          <input
            id="consultation-consent"
            name="consent"
            type="checkbox"
            value="on"
            required
            aria-invalid={fieldErrors.consent ? true : undefined}
          />
          <span>{msg("consultation.consent", locale)}</span>
        </label>
        {fieldErrorMessage(fieldErrors.consent, locale) ? (
          <p className="form-error" role="alert">
            {fieldErrorMessage(fieldErrors.consent, locale)}
          </p>
        ) : null}
      </div>

      {success ? (
        <div className="notice-box" role="status">
          {msg("consultation.success", locale)}
        </div>
      ) : null}
      {feedbackKey ? (
        <p className="form-error" role="alert">
          {msg(feedbackKey, locale)}
        </p>
      ) : null}

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending
          ? msg("consultation.submitting", locale)
          : msg("consultation.submit", locale)}
      </button>
    </form>
  );
}
