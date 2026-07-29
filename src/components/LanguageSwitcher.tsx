"use client";

import { useLocale } from "@/components/LocaleProvider";

export function LanguageSwitcher() {
  const { locale, setLocale, ready } = useLocale();

  return (
    <div className="lang-switcher" role="group" aria-label="Language">
      <button
        type="button"
        className={locale === "en" ? "lang-btn active" : "lang-btn"}
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        disabled={!ready}
      >
        EN
      </button>
      <button
        type="button"
        className={locale === "ar" ? "lang-btn active" : "lang-btn"}
        onClick={() => setLocale("ar")}
        aria-pressed={locale === "ar"}
        lang="ar"
        disabled={!ready}
      >
        ع
      </button>
    </div>
  );
}
