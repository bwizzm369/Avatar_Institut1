"use client";

import { useLocale } from "@/components/LocaleProvider";
import { SOCIAL_LINKS } from "@/config/social-links";
import { msg } from "@/lib/i18n";
import { SocialLinkCard } from "./SocialLinkCard";

export function ConnectSection() {
  const { locale } = useLocale();

  return (
    <section className="section connect-section" aria-labelledby="connect-title">
      <div className="container connect-shell">
        <div className="connect-header">
          <p className="eyebrow">{msg("connect.eyebrow", locale)}</p>
          <h2 id="connect-title" className="display display-lg">
            {msg("connect.title", locale)}
          </h2>
          <p className="lead connect-lead">{msg("connect.description", locale)}</p>
        </div>

        <div className="connect-grid">
          {SOCIAL_LINKS.map((link) => (
            <SocialLinkCard
              key={link.id}
              link={link}
              locale={locale}
              openLabel={msg("connect.open", locale)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
