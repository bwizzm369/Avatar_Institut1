"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLocale } from "@/components/LocaleProvider";
import { OFFICIAL_LOGO_SRC } from "@/components/Logo";
import {
  resendAdminEmailVerificationAction,
  submitAdminEmailVerificationAction,
} from "@/lib/admin/email-verification/actions";
import {
  adminEmailVerificationCopy,
  formatAdminVerificationWait,
} from "@/lib/admin/email-verification/copy";
import type { AdminVerificationFailureReason } from "@/lib/admin/email-verification/policy";
import { getDirection } from "@/lib/i18n";

function messageForReason(
  reason: AdminVerificationFailureReason | undefined,
  locale: "en" | "ar",
): string {
  const copy = adminEmailVerificationCopy(locale);
  switch (reason) {
    case "expired":
      return copy.expired;
    case "locked":
      return copy.locked;
    case "reused":
      return copy.reused;
    case "cooldown":
      return copy.cooldown;
    case "email_unavailable":
      return copy.emailUnavailable;
    case "not_admin":
      return copy.denied;
    case "unauthenticated":
    case "invalid":
    default:
      return copy.invalid;
  }
}

export function AdminEmailVerificationForm({
  next,
  emailUnavailable,
  initialRetryAfterSeconds,
}: {
  next: string;
  emailUnavailable?: boolean;
  initialRetryAfterSeconds?: number;
}) {
  const router = useRouter();
  const { locale } = useLocale();
  const dir = getDirection(locale);
  const copy = useMemo(() => adminEmailVerificationCopy(locale), [locale]);

  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(
    emailUnavailable ? copy.emailUnavailable : null,
  );
  const [tone, setTone] = useState<"error" | "success">(
    emailUnavailable ? "error" : "success",
  );
  const [retryAfter, setRetryAfter] = useState(initialRetryAfterSeconds ?? 60);

  useEffect(() => {
    if (retryAfter <= 0) {
      return;
    }
    const timer = window.setTimeout(() => {
      setRetryAfter((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [retryAfter]);

  useEffect(() => {
    if (emailUnavailable) {
      setFeedback(adminEmailVerificationCopy(locale).emailUnavailable);
      setTone("error");
    }
  }, [emailUnavailable, locale]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setPending(true);
    try {
      const formData = new FormData(event.currentTarget);
      formData.set("locale", locale);
      const result = await submitAdminEmailVerificationAction(formData);
      if (!result.ok) {
        setTone("error");
        setFeedback(messageForReason(result.reason, locale));
        return;
      }
      router.push(result.redirectTo ?? "/admin");
      router.refresh();
    } catch {
      setTone("error");
      setFeedback(copy.network);
    } finally {
      setPending(false);
    }
  }

  async function handleResend() {
    setFeedback(null);
    setResending(true);
    try {
      const formData = new FormData();
      formData.set("locale", locale);
      const result = await resendAdminEmailVerificationAction(formData);
      if (!result.ok) {
        setTone("error");
        setFeedback(messageForReason(result.reason, locale));
        if (result.retryAfterSeconds != null) {
          setRetryAfter(result.retryAfterSeconds);
        }
        return;
      }
      setTone("success");
      setFeedback(copy.sent);
      setRetryAfter(result.retryAfterSeconds ?? 60);
    } catch {
      setTone("error");
      setFeedback(copy.network);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="admin-login-page" dir={dir}>
      <div className="admin-login-card">
        <div className="admin-login-langs">
          <LanguageSwitcher />
        </div>
        <div className="admin-login-header">
          <Image
            src={OFFICIAL_LOGO_SRC}
            alt="Avatar Institut"
            width={96}
            height={96}
            className="admin-login-logo"
            style={{ height: "auto" }}
            priority
          />
          <h1>{copy.title}</h1>
          <p>{copy.lead}</p>
        </div>

        <form className="admin-form" method="post" onSubmit={handleSubmit} noValidate>
          <input type="hidden" name="next" value={next} />
          <input type="hidden" name="locale" value={locale} />
          <div className="admin-field">
            <label htmlFor="admin-verification-code">{copy.codeLabel}</label>
            <input
              id="admin-verification-code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              pattern="[0-9]{6}"
              required
            />
          </div>
          <button type="submit" className="admin-btn-primary" disabled={pending}>
            {pending ? copy.submitting : copy.submit}
          </button>
        </form>

        <div className="admin-verify-resend">
          <button
            type="button"
            className="admin-btn-ghost"
            disabled={resending || retryAfter > 0}
            onClick={() => void handleResend()}
          >
            {resending ? copy.resending : copy.resend}
          </button>
          {retryAfter > 0 ? (
            <p className="admin-field-hint">{formatAdminVerificationWait(locale, retryAfter)}</p>
          ) : null}
        </div>

        {feedback ? (
          <div
            className={
              tone === "error"
                ? "admin-alert admin-alert-error"
                : "admin-alert admin-alert-success"
            }
            role={tone === "error" ? "alert" : "status"}
          >
            {feedback}
          </div>
        ) : null}
      </div>
    </div>
  );
}
