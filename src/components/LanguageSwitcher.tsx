"use client";

import { useLocale } from "@/components/LocaleProvider";
import { msg } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="lang-switcher" role="group" aria-label="Language">
      <button
        type="button"
        className={locale === "en" ? "lang-btn active" : "lang-btn"}
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
      <button
        type="button"
        className={locale === "ar" ? "lang-btn active" : "lang-btn"}
        onClick={() => setLocale("ar")}
        aria-pressed={locale === "ar"}
        lang="ar"
      >
        ع
      </button>
      <span className="visually-hidden">
        {locale === "en" ? msg("nav.home", "en") : msg("nav.home", "ar")}
      </span>
    </div>
  );
}
