"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { msg } from "@/lib/i18n";

export default function SignupPage() {
  const { locale } = useLocale();
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(msg("auth.previewSubmit", locale));
  }

  return (
    <section className="section">
      <div className="auth-card">
        <h1 className="display display-md">{msg("auth.signupTitle", locale)}</h1>
        <div className="notice-box">{msg("auth.notice", locale)}</div>
        <form className="form-stack" onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="signup-first">{msg("auth.firstName", locale)}</label>
            <input
              id="signup-first"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="signup-last">{msg("auth.lastName", locale)}</label>
            <input
              id="signup-last"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="signup-email">{msg("auth.email", locale)}</label>
            <input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="signup-password">{msg("auth.password", locale)}</label>
            <input
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block">
            {msg("auth.submitSignup", locale)}
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
