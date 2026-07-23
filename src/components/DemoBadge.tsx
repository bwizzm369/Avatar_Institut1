"use client";

import { useLocale } from "@/components/LocaleProvider";
import { msg } from "@/lib/i18n";

export function DemoBadge() {
  const { locale } = useLocale();
  return <span className="demo-badge">{msg("courses.demoBadge", locale)}</span>;
}
