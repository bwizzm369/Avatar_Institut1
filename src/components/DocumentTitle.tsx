"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { formatDocumentTitle } from "@/lib/titles";

/**
 * Updates document.title after mount based on route + locale.
 * Server metadata provides the English default via the root title template.
 * No MutationObserver — avoids fighting Next.js metadata updates.
 */
export function DocumentTitle() {
  const pathname = usePathname();
  const { locale } = useLocale();

  useEffect(() => {
    document.title = formatDocumentTitle(pathname, locale);
  }, [pathname, locale]);

  return null;
}
