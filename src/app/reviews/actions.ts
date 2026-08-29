"use server";

import { revalidatePath } from "next/cache";
import { submitStudentReview } from "@/lib/reviews/student-submit";

export async function submitStudentReviewAction(formData: FormData) {
  const result = await submitStudentReview(formData);
  if (result.ok) {
    revalidatePath("/reviews");
    revalidatePath("/admin/reviews");
  }
  return result;
}
