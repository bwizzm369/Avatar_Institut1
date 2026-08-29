"use client";

import { useLocale } from "@/components/LocaleProvider";
import { msg } from "@/lib/i18n";

export function ReviewsPageCopy() {
  const { locale } = useLocale();

  return (
    <section className="library-hero reviews-hero">
      <div className="library-hero-motif" aria-hidden="true" />
      <div className="container library-hero-inner">
        <p className="eyebrow">{msg("reviews.eyebrow", locale)}</p>
        <h1 className="display display-lg library-title">
          {msg("reviews.title", locale)}
        </h1>
        <div className="section-rule" aria-hidden="true" />
        <p className="lead library-lead">{msg("reviews.lead", locale)}</p>
      </div>
    </section>
  );
}
