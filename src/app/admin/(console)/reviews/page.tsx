import type { Metadata } from "next";
import { ReviewsClient } from "@/components/admin/ReviewsClient";
import { listAdminReviews } from "@/lib/admin/reviews/list";

export const metadata: Metadata = {
  title: { absolute: "Reviews · Admin · Avatar Institut" },
};

export default async function AdminReviewsPage() {
  const { reviews } = await listAdminReviews();

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>Reviews</h1>
        <p>
          Write testimonials, and moderate student reviews before they appear
          on the public site. Only approved reviews are published.
        </p>
      </header>
      <ReviewsClient reviews={reviews} />
    </div>
  );
}
