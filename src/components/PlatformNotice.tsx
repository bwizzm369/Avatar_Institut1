"use client";

import { useLocale } from "@/components/LocaleProvider";
import { msg } from "@/lib/i18n";

export function PlatformNotice() {
  const { locale } = useLocale();
  return (
    <div className="platform-notice" role="status">
      {msg("notice.platformPhase", locale)}
    </div>
  );
}
