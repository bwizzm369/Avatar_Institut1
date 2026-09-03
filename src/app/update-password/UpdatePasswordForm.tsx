"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { PasswordInput } from "@/components/PasswordInput";
import { updatePasswordAction } from "@/lib/auth/actions";
import { validatePasswordReset } from "@/lib/auth/validation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { msg } from "@/lib/i18n";

function passwordErrorMessage(
  code: string | undefined,
  locale: "en" | "ar",
): string | null {
  if (!code) return null;
  if (code === "required") return msg("auth.error.required", locale);
  if (code === "tooShort") return msg("auth.error.passwordShort", locale);
  if (code === "mismatch") return msg("auth.error.passwordMismatch", locale);
  return msg("auth.validationFailed", locale);
}

export function UpdatePasswordForm({
  hasRecoverySession,
}: {
  hasRecoverySession: boolean;
}) {
  const { locale } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const configured = isSupabaseConfigured();
  const invalidLink = searchParams.get("error") === "invalid";

  const [sessionReady, setSessionReady] = useState(hasRecoverySession);
  const [recoveryOk, setRecoveryOk] = useState(hasRecoverySession);
  const [pending, setPending] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function checkSession() {
      if (!configured || invalidLink) {
        setSessionReady(true);
        setRecoveryOk(false);
        return;
      }
      try {
        const supabase = createBrowserSupabaseClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!cancelled) {
          setRecoveryOk(Boolean(user) && hasRecoverySession);
        }
      } catch {
        if (!cancelled) {
          setRecoveryOk(false);
        }
      } finally {
        if (!cancelled) {
          setSessionReady(true);
        }
      }
    }
    void checkSession();
    return () => {
      cancelled = true;
    };
  }, [configured, invalidLink, hasRecoverySession]);

  const blocked = !configured || invalidLink || (sessionReady && !recoveryOk);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError(null);
    setConfirmError(null);
    setFeedback(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const parsed = validatePasswordReset({
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    });

    if (!parsed.ok) {
      setPasswordError(passwordErrorMessage(parsed.errors.password, locale));
      setConfirmError(
        passwordErrorMessage(parsed.errors.confirmPassword, locale),
      );
      setFeedback(msg("auth.validationFailed", locale));
      return;
    }

    if (blocked) {
      setFeedback(msg("auth.resetInvalid", locale));
      return;
    }

    setPending(true);
    try {
      const result = await updatePasswordAction(formData);
      if (!result.ok) {
        setFeedback(
          msg(result.errorKey ?? "auth.resetUpdateFailed", locale),
        );
        return;
      }
      router.push(result.redirectTo ?? "/login?reset=ok");
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
        <h1 className="display display-md">
          {msg("auth.updatePasswordTitle", locale)}
        </h1>
        <div className="notice-box" role="status">
          {!configured
            ? msg("auth.configMissing", locale)
            : blocked
              ? msg("auth.resetInvalid", locale)
              : msg("auth.updatePasswordNotice", locale)}
        </div>
        {blocked ? (
          <p className="auth-switch">
            <Link href="/forgot-password">
              {msg("auth.sendResetLink", locale)}
            </Link>
          </p>
        ) : (
          <form
            className="form-stack"
            method="post"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="form-field">
              <label htmlFor="new-password">
                {msg("auth.newPassword", locale)}
              </label>
              <PasswordInput
                id="new-password"
                name="password"
                autoComplete="new-password"
                required
                minLength={8}
                aria-invalid={passwordError ? true : undefined}
              />
              {passwordError ? (
                <p className="form-error" role="alert">
                  {passwordError}
                </p>
              ) : null}
            </div>
            <div className="form-field">
              <label htmlFor="confirm-password">
                {msg("auth.confirmNewPassword", locale)}
              </label>
              <PasswordInput
                id="confirm-password"
                name="confirmPassword"
                autoComplete="new-password"
                required
                minLength={8}
                aria-invalid={confirmError ? true : undefined}
              />
              {confirmError ? (
                <p className="form-error" role="alert">
                  {confirmError}
                </p>
              ) : null}
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={pending || !sessionReady}
            >
              {pending
                ? msg("auth.submitting", locale)
                : msg("auth.submitNewPassword", locale)}
            </button>
          </form>
        )}
        {feedback ? (
          <div className="notice-box" role="alert">
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
