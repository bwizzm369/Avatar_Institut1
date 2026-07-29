import { describe, expect, it } from "vitest";
import type { LibraryResource } from "@/types/library";
import {
  filterLibraryResources,
  getLibraryActionLabel,
  getLibraryFilterForType,
  getLibraryLayout,
  getPublishedLibraryResources,
  isHttpsUrl,
  sanitizeExternalUrl,
} from "@/lib/library";

const baseResource: LibraryResource = {
  id: "res-1",
  type: "youtube_video",
  title_en: "Consciousness lecture",
  title_ar: "محاضرة الوعي",
  description_en: "Public lecture on consciousness studies.",
  description_ar: "محاضرة عامة حول دراسات الوعي.",
  author: "Avatar Institut",
  language: "EN/AR",
  category_en: "Videos",
  category_ar: "الفيديوهات",
  thumbnail_url: "https://example.com/thumb.jpg",
  destination_url: "https://www.youtube.com/watch?v=demo123",
  is_featured: true,
  is_published: true,
};

describe("library resources", () => {
  it("returns only published resources", () => {
    const resources = getPublishedLibraryResources([
      baseResource,
      { ...baseResource, id: "res-2", is_published: false },
    ]);

    expect(resources).toHaveLength(1);
    expect(resources[0].id).toBe("res-1");
  });

  it("rejects non-https URLs", () => {
    const resources = getPublishedLibraryResources([
      { ...baseResource, destination_url: "http://example.com/resource" },
    ]);

    expect(isHttpsUrl("http://example.com/resource")).toBe(false);
    expect(resources).toHaveLength(0);
  });

  it("rejects javascript urls", () => {
    expect(sanitizeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(
      getPublishedLibraryResources([
        { ...baseResource, destination_url: "javascript:alert(1)" },
      ]),
    ).toHaveLength(0);
  });

  it("returns bilingual action labels", () => {
    expect(getLibraryActionLabel("youtube_video", "en")).toBe("Watch on YouTube");
    expect(getLibraryActionLabel("amazon_book", "ar")).toBe("عرض على أمازون");
    expect(getLibraryActionLabel("podcast", "ar")).toBe("استمع الآن");
  });

  it("filters by type groups", () => {
    const resources: LibraryResource[] = [
      baseResource,
      {
        ...baseResource,
        id: "res-2",
        type: "amazon_book",
        title_en: "Recommended reading",
        title_ar: "قراءة موصى بها",
        category_en: "Books",
        category_ar: "الكتب",
        destination_url: "https://www.amazon.com/demo-book",
      },
      {
        ...baseResource,
        id: "res-3",
        type: "podcast",
        title_en: "Metaphysics podcast",
        title_ar: "بودكاست الميتافيزيقا",
        category_en: "Podcasts",
        category_ar: "البودكاست",
        destination_url: "https://example.com/podcast",
      },
    ];

    expect(getLibraryFilterForType("youtube_playlist")).toBe("videos");
    expect(filterLibraryResources(resources, "books", "")).toHaveLength(1);
    expect(filterLibraryResources(resources, "podcasts", "")).toHaveLength(1);
    expect(filterLibraryResources(resources, "videos", "")).toHaveLength(1);
  });

  it("searches by title and author", () => {
    const resources: LibraryResource[] = [
      baseResource,
      {
        ...baseResource,
        id: "res-2",
        title_en: "Research digest",
        title_ar: "ملخص بحثي",
        author: "Dr. Amal",
        category_en: "Research",
        category_ar: "الأبحاث",
        destination_url: "https://example.com/research",
      },
    ];

    expect(filterLibraryResources(resources, "all", "amal")).toHaveLength(1);
    expect(filterLibraryResources(resources, "all", "research digest")).toHaveLength(1);
    expect(filterLibraryResources(resources, "all", "الأبحاث")).toHaveLength(1);
  });

  it("exposes rtl-safe layout without horizontal overflow", () => {
    expect(getLibraryLayout("ar")).toEqual({
      dir: "rtl",
      rootClassName: "library-page library-page-rtl",
    });
    expect(getLibraryLayout("en")).toEqual({
      dir: "ltr",
      rootClassName: "library-page",
    });
  });
});
