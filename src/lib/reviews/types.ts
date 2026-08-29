export type ReviewModerationStatus = "pending" | "approved" | "rejected";

export type ReviewRating = 1 | 2 | 3 | 4 | 5;

export type PublicReview = {
  id: string;
  author_name: string;
  author_title_en: string;
  author_title_ar: string;
  quote_en: string;
  quote_ar: string;
  sort_order: number;
  rating: number | null;
};

export type AdminReview = PublicReview & {
  is_published: boolean;
  created_at: string;
  updated_at: string;
  profile_id: string | null;
  rating: number | null;
  moderation_status: ReviewModerationStatus;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

export type ReviewFormInput = {
  authorName: string;
  authorTitleEn: string;
  authorTitleAr: string;
  quoteEn: string;
  quoteAr: string;
  isPublished: boolean;
  sortOrder: string;
};

export type ReviewFormValues = {
  authorName: string;
  authorTitleEn: string;
  authorTitleAr: string;
  quoteEn: string;
  quoteAr: string;
  isPublished: boolean;
  sortOrder: number;
};

export type StudentOwnReviewView = {
  moderation_status: ReviewModerationStatus;
  rating: ReviewRating | null;
};

export type StudentReviewPageState = {
  authenticated: boolean;
  displayName: string | null;
  existing: StudentOwnReviewView | null;
};

export type StudentReviewFormInput = {
  rating: string;
  quote: string;
  locale: string;
};
