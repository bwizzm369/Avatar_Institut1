/**
 * Normalize a dynamic-route slug before DB lookup.
 * Next.js may pass Unicode as-is or percent-encoded (`%D8%AF…`).
 * Stored slugs (including Arabic) are NFKC from admin slugify.
 */
export function resolveCourseSlugParam(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  let value = trimmed;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (!/%[0-9A-Fa-f]{2}/.test(value)) break;
    try {
      const decoded = decodeURIComponent(value);
      if (decoded === value) break;
      value = decoded;
    } catch {
      break;
    }
  }

  return value.normalize("NFKC");
}

export function courseSlugsEqual(left: string, right: string): boolean {
  return resolveCourseSlugParam(left) === resolveCourseSlugParam(right);
}

/** Encode a stored slug for `/courses/[slug]` and `/dashboard/courses/[slug]` hrefs. */
export function encodeCourseSlugParam(slug: string): string {
  return encodeURIComponent(resolveCourseSlugParam(slug));
}

export function publicCoursePath(slug: string): string {
  return `/courses/${encodeCourseSlugParam(slug)}`;
}

export function dashboardCoursePath(slug: string): string {
  return `/dashboard/courses/${encodeCourseSlugParam(slug)}`;
}

export function dashboardLessonPath(slug: string, lessonId: string): string {
  return `/dashboard/courses/${encodeCourseSlugParam(slug)}/lessons/${lessonId}`;
}
