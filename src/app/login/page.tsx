"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { msg } from "@/lib/i18n";

export default function LoginPage() {
  const { locale } = useLocale();
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(msg("auth.previewSubmit", locale));
  }

  return (
    <section className="section">
      <div className="auth-card">
        <h1 className="display display-md">{msg("auth.loginTitle", locale)}</h1>
        <div className="notice-box">{msg("auth.notice", locale)}</div>
        <form className="form-stack" onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="login-email">{msg("auth.email", locale)}</label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="login-password">{msg("auth.password", locale)}</label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block">
            {msg("auth.submitLogin", locale)}
          </button>
        </form>
        {feedback ? (
          <div className="notice-box" role="status">
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
