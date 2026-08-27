import { notFound } from "next/navigation";
import { CourseDetailClient } from "@/components/CourseDetailClient";
import { resolveCourseSlugParam } from "@/lib/courses/course-slug";
import { loadCoursePassOffersForCourses } from "@/lib/courses/load-pass-offers";
import { getPublicCourseBySlug } from "@/lib/courses/public-catalogue";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getPublicCourseBySlug(resolveCourseSlugParam(slug));
  if (!course) notFound();

  const { offers } = await loadCoursePassOffersForCourses([course]);

  return (
    <CourseDetailClient course={course} offer={offers[course.slug]} />
  );
}
