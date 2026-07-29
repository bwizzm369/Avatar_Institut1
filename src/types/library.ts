export type LibraryResourceType =
  | "youtube_playlist"
  | "youtube_video"
  | "amazon_book"
  | "article"
  | "podcast"
  | "free_pdf";

export interface LibraryResource {
  id: string;
  type: LibraryResourceType;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  author: string;
  language: string;
  category_en: string;
  category_ar: string;
  thumbnail_url: string;
  destination_url: string;
  is_featured: boolean;
  is_published: boolean;
}

export type LibraryFilter = "all" | "videos" | "books" | "research" | "podcasts" | "free";
