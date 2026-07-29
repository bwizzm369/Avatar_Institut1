"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import { useLocale } from "@/components/LocaleProvider";
import {
  ACCESS_POLL_INTERVAL_MS,
  ACCESS_POLL_MAX_MS,
  deriveAccessUiState,
  type AccessStatusPayload,
  type AccessUiState,
} from "@/lib/enrollments/access-status";
import { msg } from "@/lib/i18n";

/**
 * Premium post-payment experience.
 * Does NOT grant course access — only polls a read-only enrollment status API.
 * session_id in the URL is never used to unlock content.
 */
export default function CartSuccessClient() {
  const { locale } = useLocale();
  const searchParams = useSearchParams();
  const simulateDelayed = searchParams.get("simulate") === "delayed";
  const previewDelayed = searchParams.get("preview") === "delayed";

  const [uiState, setUiState] = useState<AccessUiState>(
    previewDelayed ? "delayed" : "waiting",
  );
  const [courseSlug, setCourseSlug] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const startedAtRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPoll = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const runCheck = useCallback(async () => {
    setChecking(true);
    try {
      if (simulateDelayed) {
        const elapsed = Date.now() - startedAtRef.current;
        setUiState(
          deriveAccessUiState({ activated: false, elapsedMs: elapsed }),
        );
        setCourseSlug(null);
        return;
      }

      const response = await fetch("/api/enrollments/access-status", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });
      const data = (await response.json()) as AccessStatusPayload;
      const activated = Boolean(data.activated);
      const elapsed = Date.now() - startedAtRef.current;
      const next = deriveAccessUiState({ activated, elapsedMs: elapsed });
      setUiState(next);
      setCourseSlug(activated ? data.courseSlug : null);
      if (next === "activated" || next === "delayed") {
        clearPoll();
      }
    } catch {
      const elapsed = Date.now() - startedAtRef.current;
      setUiState(
        deriveAccessUiState({ activated: false, elapsedMs: elapsed }),
      );
    } finally {
      setChecking(false);
    }
  }, [clearPoll, simulateDelayed]);

  const startPolling = useCallback(() => {
    clearPoll();
    startedAtRef.current = Date.now();
    setUiState("waiting");
    setCourseSlug(null);
    void runCheck();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current;
      if (elapsed >= ACCESS_POLL_MAX_MS) {
        setUiState((current) =>
          current === "activated" ? current : "delayed",
        );
        clearPoll();
        return;
      }
      void runCheck();
    }, ACCESS_POLL_INTERVAL_MS);
  }, [clearPoll, runCheck]);

  useEffect(() => {
    if (previewDelayed) {
      setUiState("delayed");
      return;
    }
    startPolling();
    return () => clearPoll();
  }, [clearPoll, previewDelayed, startPolling]);

  const statusMessage =
    uiState === "activated"
      ? msg("cart.successActivated", locale)
      : uiState === "delayed"
        ? msg("cart.successDelayed", locale)
        : msg("cart.successWaiting", locale);

  const primaryHref =
    uiState === "activated" && courseSlug
      ? `/dashboard/courses/${courseSlug}`
      : "/dashboard/courses";

  return (
    <section className="payment-success">
      <div className="payment-success-motif" aria-hidden="true" />
      <div className="payment-success-shell">
        <article className="payment-success-card" aria-live="polite">
          <div className="payment-success-logo">
            <Logo variant="header" />
          </div>

          <span className="payment-success-badge">
            {msg("cart.successBadge", locale)}
          </span>

          <h1 className="display display-md payment-success-title">
            {msg("cart.successTitle", locale)}
          </h1>
          <p className="payment-success-subtitle">
            {msg("cart.successLead", locale)}
          </p>

          <div
            className="payment-success-status"
            data-state={uiState}
            role="status"
          >
            {uiState === "waiting" ? (
              <span className="payment-success-spinner" aria-hidden="true" />
            ) : null}
            {uiState === "activated" ? (
              <span className="payment-success-check" aria-hidden="true">
                ✓
              </span>
            ) : null}
            {uiState === "delayed" ? (
              <span className="payment-success-hourglass" aria-hidden="true">
                ◌
              </span>
            ) : null}
            <p>{statusMessage}</p>
          </div>

          {uiState === "waiting" ? (
            <div className="payment-success-progress" aria-hidden="true">
              <span />
            </div>
          ) : null}

          {uiState === "delayed" ? (
            <button
              type="button"
              className="btn btn-primary payment-success-cta"
              onClick={startPolling}
              disabled={checking}
            >
              {msg("cart.successCheckAgain", locale)}
            </button>
          ) : (
            <Link
              href={primaryHref}
              className="btn btn-primary payment-success-cta"
            >
              {uiState === "activated"
                ? msg("cart.successStartCourse", locale)
                : msg("cart.successGoCourses", locale)}
            </Link>
          )}

          <Link href="/cart" className="payment-success-secondary">
            {msg("cart.successBackToCart", locale)}
          </Link>
        </article>
      </div>
    </section>
  );
}
