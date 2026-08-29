import type { Metadata } from "next";
import HomePage from "./HomePage";
import { listPublishedReviews } from "@/lib/reviews/public";
import { englishAbsoluteTitle } from "@/lib/titles";

export const metadata: Metadata = {
  title: { absolute: englishAbsoluteTitle("home") },
  description:
    "Avatar Institut für Metaphysik — international academy for metaphysics, consciousness, and human development in English and Arabic.",
};

export default async function Page() {
  const reviews = await listPublishedReviews();
  return <HomePage reviews={reviews} />;
}
