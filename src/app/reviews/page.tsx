import type { Metadata } from "next";
import { ReviewsGallery } from "@/components/ReviewsGallery";
import { ReviewsPageCopy } from "@/components/ReviewsPageCopy";
import { ReviewSubmitSection } from "@/components/ReviewSubmitSection";
import { listPublishedReviews } from "@/lib/reviews/public";
import { getStudentReviewPageState } from "@/lib/reviews/student-submit";
import { englishAbsoluteTitle } from "@/lib/titles";

export const metadata: Metadata = {
  title: { absolute: englishAbsoluteTitle("reviews") },
  description:
    "Published student testimonials from Avatar Institut, in English and Arabic.",
};

export default async function ReviewsPage() {
  const reviews = await listPublishedReviews();
  const studentState = await getStudentReviewPageState();

  return (
    <div className="reviews-page">
      <ReviewsPageCopy />
      <ReviewSubmitSection state={studentState} />
      <section className="section reviews-section">
        <div className="container">
          <ReviewsGallery reviews={reviews} />
        </div>
      </section>
    </div>
  );
}
