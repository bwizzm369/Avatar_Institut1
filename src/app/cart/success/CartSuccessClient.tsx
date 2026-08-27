"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useCart } from "@/components/CartProvider";
import { Logo } from "@/components/Logo";
import { useLocale } from "@/components/LocaleProvider";
import {
  clearPendingCheckoutSlugs,
  readPendingCheckoutSlugs,
} from "@/lib/cart";
import { dashboardCoursePath } from "@/lib/courses/course-slug";
import {
  ACCESS_POLL_INTERVAL_MS,
  deriveAccessUiState,
  shouldContinueAccessPolling,
  type AccessStatusPayload,
  type AccessUiState,
} from "@/lib/enrollments/access-status";
import { msg } from "@/lib/i18n";

/**
 * Premium post-payment experience.
 * Does NOT grant course access — only polls a read-only enrollment status API.
 * session_id selects which course_ids to verify; unlock requires Supabase enrollment.
 */
export default function CartSuccessClient() {
  const { locale } = useLocale();
  const { removePurchasedCourses } = useCart();
  const { user, ready: authReady } = useAuth();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const simulateDelayed = searchParams.get("simulate") === "delayed";
  const previewDelayed = searchParams.get("preview") === "delayed";

  const [uiState, setUiState] = useState<AccessUiState>(
    previewDelayed ? "delayed" : "waiting",
  );
  const [courseSlug, setCourseSlug] = useState<string | null>(null);
  const startedAtRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const removedPurchaseSignatureRef = useRef<string>("");
  const activatedRef = useRef(false);

  const clearPoll = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const runCheck = useCallback(async () => {
    if (activatedRef.current) return;

    try {
      if (simulateDelayed) {
        const elapsed = Date.now() - startedAtRef.current;
        setUiState(
          deriveAccessUiState({ activated: false, elapsedMs: elapsed }),
        );
        setCourseSlug(null);
        return;
      }

      const query = sessionId
        ? `?session_id=${encodeURIComponent(sessionId)}`
        : "";
      const response = await fetch(`/api/enrollments/access-status${query}`, {
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

      if (activated) {
        activatedRef.current = true;
        clearPoll();
        if (authReady && user) {
          const purchasedSlugs = readPendingCheckoutSlugs(
            window.localStorage,
            user.id,
          );
          const signature = purchasedSlugs.slice().sort().join("|");
          if (signature && removedPurchaseSignatureRef.current !== signature) {
            removePurchasedCourses(purchasedSlugs);
            clearPendingCheckoutSlugs(window.localStorage, user.id);
            removedPurchaseSignatureRef.current = signature;
          }
        }
      }
    } catch {
      if (activatedRef.current) return;
      const elapsed = Date.now() - startedAtRef.current;
      setUiState(
        deriveAccessUiState({ activated: false, elapsedMs: elapsed }),
      );
    }
  }, [
    authReady,
    clearPoll,
    removePurchasedCourses,
    sessionId,
    simulateDelayed,
    user,
  ]);

  useEffect(() => {
    if (previewDelayed) {
      setUiState("delayed");
      return;
    }

    activatedRef.current = false;
    startedAtRef.current = Date.now();
    setUiState("waiting");
    setCourseSlug(null);
    void runCheck();

    timerRef.current = setInterval(() => {
      if (activatedRef.current) {
        clearPoll();
        return;
      }
      void runCheck();
    }, ACCESS_POLL_INTERVAL_MS);

    return () => clearPoll();
  }, [clearPoll, previewDelayed, runCheck]);

  const statusMessage =
    uiState === "activated"
      ? msg("cart.successActivated", locale)
      : uiState === "delayed"
        ? msg("cart.successDelayed", locale)
        : msg("cart.successWaiting", locale);

  const primaryHref =
    uiState === "activated" && courseSlug
      ? dashboardCoursePath(courseSlug)
      : "/dashboard/courses";

  const primaryLabel =
    uiState === "activated"
      ? msg("cart.successOpenCourse", locale)
      : msg("cart.successGoCourses", locale);

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

          {shouldContinueAccessPolling(uiState) ? (
            <div className="payment-success-progress" aria-hidden="true">
              <span />
            </div>
          ) : null}

          <Link
            href={primaryHref}
            className="btn btn-primary payment-success-cta"
          >
            {primaryLabel}
          </Link>

          <Link href="/cart" className="payment-success-secondary">
            {msg("cart.successBackToCart", locale)}
          </Link>
        </article>
      </div>
    </section>
  );
}
