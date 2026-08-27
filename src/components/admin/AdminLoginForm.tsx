"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { verifyAdminSessionAction } from "@/lib/admin/actions";
import { resolveSafeAdminRedirect } from "@/lib/admin/auth-policy";
import { OFFICIAL_LOGO_SRC } from "@/components/Logo";
import { validateLogin } from "@/lib/auth/validation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = resolveSafeAdminRedirect(searchParams.get("next") ?? "/admin");
  const configured = isSupabaseConfigured();

  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
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
      setEmailError(parsed.errors.email ? "Email is required." : null);
      setPasswordError(parsed.errors.password ? "Password is required." : null);
      setFeedback("Please enter a valid email and password.");
      return;
    }

    if (!configured) {
      setFeedback("Supabase is not configured.");
      return;
    }

    setPending(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.values.email,
        password: parsed.values.password,
      });

      if (error) {
        setFeedback("Invalid email or password.");
        return;
      }

      const result = await verifyAdminSessionAction(next);
      if (!result.ok) {
        await supabase.auth.signOut();
        setFeedback(result.error ?? "Access denied.");
        return;
      }

      router.push(result.redirectTo ?? "/admin");
      router.refresh();
    } catch {
      setFeedback("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
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
          <h1>Admin</h1>
        </div>

        {!configured ? (
          <div className="admin-alert" role="status">
            Supabase is not configured. Set environment variables before signing
            in.
          </div>
        ) : null}

        <form className="admin-form" method="post" onSubmit={handleSubmit} noValidate>
          <input type="hidden" name="next" value={next} />
          <div className="admin-field">
            <label htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              name="email"
              type="email"
              autoComplete="username"
              required
              aria-invalid={emailError ? true : undefined}
            />
            {emailError ? (
              <p className="admin-field-error" role="alert">
                {emailError}
              </p>
            ) : null}
          </div>
          <div className="admin-field">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              aria-invalid={passwordError ? true : undefined}
            />
            {passwordError ? (
              <p className="admin-field-error" role="alert">
                {passwordError}
              </p>
            ) : null}
          </div>
          <button
            type="submit"
            className="admin-btn-primary"
            disabled={pending || !configured}
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {feedback ? (
          <div className="admin-alert admin-alert-error" role="alert">
            {feedback}
          </div>
        ) : null}
      </div>
    </div>
  );
}
