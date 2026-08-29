"use client";

import { useLocale } from "@/components/LocaleProvider";
import { msg } from "@/lib/i18n";

export function ConsultationPageCopy() {
  const { locale } = useLocale();

  return (
    <section className="library-hero consultation-hero">
      <div className="library-hero-motif" aria-hidden="true" />
      <div className="container library-hero-inner">
        <p className="eyebrow">{msg("consultation.eyebrow", locale)}</p>
        <h1 className="display display-lg library-title">
          {msg("consultation.title", locale)}
        </h1>
        <div className="section-rule" aria-hidden="true" />
        <p className="lead library-lead">{msg("consultation.lead", locale)}</p>
      </div>
    </section>
  );
}
