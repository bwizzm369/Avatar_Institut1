import { normalizeWhitespace } from "@/lib/admin/import/normalize";

const SLUG_MAX = 80;

/**
 * Build a URL slug. Prefer English when present; otherwise use Arabic letters.
 * Never invents marketing titles — only normalizes the provided text.
 */
export function generateCourseSlug(input: {
  titleAr: string;
  titleEn?: string | null;
  explicitSlug?: string | null;
}): string {
  const explicit = normalizeWhitespace(input.explicitSlug ?? "");
  if (explicit) {
    return slugify(explicit);
  }

  const english = normalizeWhitespace(input.titleEn ?? "");
  if (english) {
    return slugify(english);
  }

  return slugify(normalizeWhitespace(input.titleAr));
}

export function isValidCourseSlug(slug: string): boolean {
  if (!slug || slug.length > SLUG_MAX) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug) || /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u.test(slug);
}

function slugify(value: string): string {
  const lower = value.toLowerCase();
  const replaced = lower
    .normalize("NFKC")
    .replace(/[_\s]+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!replaced) {
    return `course-${Date.now().toString(36)}`;
  }

  return replaced.slice(0, SLUG_MAX).replace(/-$/g, "") || `course-${Date.now().toString(36)}`;
}

export function ensureUniqueSlug(
  base: string,
  taken: Set<string>,
): string {
  const candidate = base || `course-${Date.now().toString(36)}`;
  if (!taken.has(candidate)) return candidate;
  let i = 2;
  while (taken.has(`${candidate}-${i}`)) {
    i += 1;
  }
  return `${candidate}-${i}`;
}
