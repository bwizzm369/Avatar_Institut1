import resourcesData from "../../content/library/resources.json";
import type { Locale } from "@/types";
import type { LibraryFilter, LibraryResource, LibraryResourceType } from "@/types/library";

const RESOURCE_TYPES: LibraryResourceType[] = [
  "youtube_playlist",
  "youtube_video",
  "amazon_book",
  "article",
  "podcast",
  "free_pdf",
];

const FILTER_BY_TYPE: Record<LibraryResourceType, Exclude<LibraryFilter, "all">> = {
  youtube_playlist: "videos",
  youtube_video: "videos",
  amazon_book: "books",
  article: "research",
  podcast: "podcasts",
  free_pdf: "free",
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isResourceType(value: unknown): value is LibraryResourceType {
  return typeof value === "string" && RESOURCE_TYPES.includes(value as LibraryResourceType);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function sanitizeExternalUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || !isHttpsUrl(trimmed)) return null;
  return trimmed;
}

function sanitizeThumbnailUrl(value: string): string {
  return sanitizeExternalUrl(value) ?? "";
}

export function parseLibraryResource(value: unknown): LibraryResource | null {
  if (!isObject(value)) return null;
  if (!isResourceType(value.type)) return null;

  const resource: LibraryResource = {
    id: isNonEmptyString(value.id) ? value.id.trim() : "",
    type: value.type,
    title_en: isNonEmptyString(value.title_en) ? value.title_en.trim() : "",
    title_ar: isNonEmptyString(value.title_ar) ? value.title_ar.trim() : "",
    description_en: isNonEmptyString(value.description_en) ? value.description_en.trim() : "",
    description_ar: isNonEmptyString(value.description_ar) ? value.description_ar.trim() : "",
    author: isNonEmptyString(value.author) ? value.author.trim() : "",
    language: isNonEmptyString(value.language) ? value.language.trim() : "",
    category_en: isNonEmptyString(value.category_en) ? value.category_en.trim() : "",
    category_ar: isNonEmptyString(value.category_ar) ? value.category_ar.trim() : "",
    thumbnail_url: typeof value.thumbnail_url === "string" ? value.thumbnail_url.trim() : "",
    destination_url: typeof value.destination_url === "string" ? value.destination_url.trim() : "",
    is_featured: isBoolean(value.is_featured) ? value.is_featured : false,
    is_published: isBoolean(value.is_published) ? value.is_published : false,
  };

  if (
    !resource.id ||
    !resource.title_en ||
    !resource.title_ar ||
    !resource.description_en ||
    !resource.description_ar ||
    !resource.author ||
    !resource.language ||
    !resource.category_en ||
    !resource.category_ar
  ) {
    return null;
  }

  return {
    ...resource,
    thumbnail_url: sanitizeThumbnailUrl(resource.thumbnail_url),
  };
}

export function getPublishedLibraryResources(input: unknown = resourcesData): LibraryResource[] {
  if (!Array.isArray(input)) return [];

  return input
    .map(parseLibraryResource)
    .filter((resource): resource is LibraryResource => {
      return resource !== null && resource.is_published && sanitizeExternalUrl(resource.destination_url) !== null;
    })
    .map((resource) => ({
      ...resource,
      destination_url: sanitizeExternalUrl(resource.destination_url) ?? "",
    }));
}

export function getLibraryFilterForType(type: LibraryResourceType): Exclude<LibraryFilter, "all"> {
  return FILTER_BY_TYPE[type];
}

export function getLibraryTitle(resource: LibraryResource, locale: Locale): string {
  return locale === "ar" ? resource.title_ar : resource.title_en;
}

export function getLibraryDescription(resource: LibraryResource, locale: Locale): string {
  return locale === "ar" ? resource.description_ar : resource.description_en;
}

export function getLibraryCategory(resource: LibraryResource, locale: Locale): string {
  return locale === "ar" ? resource.category_ar : resource.category_en;
}

export function getLibraryTypeLabel(type: LibraryResourceType, locale: Locale): string {
  const labels: Record<LibraryResourceType, { en: string; ar: string }> = {
    youtube_playlist: { en: "Playlist", ar: "قائمة تشغيل" },
    youtube_video: { en: "Video", ar: "فيديو" },
    amazon_book: { en: "Book", ar: "كتاب" },
    article: { en: "Research", ar: "بحث" },
    podcast: { en: "Podcast", ar: "بودكاست" },
    free_pdf: { en: "Free PDF", ar: "PDF مجاني" },
  };
  return labels[type][locale];
}

export function getLibraryActionLabel(type: LibraryResourceType, locale: Locale): string {
  const labels: Record<LibraryResourceType, { en: string; ar: string }> = {
    youtube_playlist: { en: "Watch on YouTube", ar: "شاهد على يوتيوب" },
    youtube_video: { en: "Watch on YouTube", ar: "شاهد على يوتيوب" },
    amazon_book: { en: "View on Amazon", ar: "عرض على أمازون" },
    article: { en: "Read the research", ar: "اقرأ البحث" },
    podcast: { en: "Listen now", ar: "استمع الآن" },
    free_pdf: { en: "Open resource", ar: "افتح المورد" },
  };
  return labels[type][locale];
}

export function filterLibraryResources(
  resources: LibraryResource[],
  filter: LibraryFilter,
  query: string,
): LibraryResource[] {
  const normalizedQuery = query.trim().toLowerCase();

  return resources.filter((resource) => {
    if (filter !== "all" && getLibraryFilterForType(resource.type) !== filter) {
      return false;
    }

    if (!normalizedQuery) return true;

    const haystack = [
      resource.title_en,
      resource.title_ar,
      resource.author,
      resource.category_en,
      resource.category_ar,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function getLibraryLayout(locale: Locale): {
  dir: "ltr" | "rtl";
  rootClassName: string;
} {
  return {
    dir: locale === "ar" ? "rtl" : "ltr",
    rootClassName: locale === "ar" ? "library-page library-page-rtl" : "library-page",
  };
}
