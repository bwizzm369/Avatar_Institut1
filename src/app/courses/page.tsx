import { CoursesCatalogueClient } from "@/components/CoursesCatalogueClient";
import { loadCoursePassOffersForCourses } from "@/lib/courses/load-pass-offers";
import { listPublicCourses } from "@/lib/courses/public-catalogue";

export default async function CoursesPage() {
  const courses = await listPublicCourses();
  const { offers } = await loadCoursePassOffersForCourses(courses);

  return <CoursesCatalogueClient courses={courses} offers={offers} />;
}
