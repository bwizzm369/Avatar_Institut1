import { displayLocalized } from "@/lib/i18n";
import type { Locale } from "@/types";

/**
 * Same EN↔AR fallback as the public catalogue (`displayLocalized`):
 * requested locale first, then the other language. Never invents a translation.
 */
export function studentCourseTitle(
  course: { title_en: string; title_ar: string },
  locale: Locale,
): string {
  return displayLocalized({ en: course.title_en, ar: course.title_ar }, locale);
}

export function studentCourseSummary(
  course: { summary_en: string; summary_ar: string },
  locale: Locale,
): string {
  return displayLocalized(
    { en: course.summary_en, ar: course.summary_ar },
    locale,
  );
}

export function studentLocalizedText(
  en: string,
  ar: string,
  locale: Locale,
): string {
  return displayLocalized({ en, ar }, locale);
}
