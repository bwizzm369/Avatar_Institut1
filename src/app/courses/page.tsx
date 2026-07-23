"use client";

import { CourseCard } from "@/components/CourseCard";
import { useLocale } from "@/components/LocaleProvider";
import { getAllCourses } from "@/lib/courses";
import { msg } from "@/lib/i18n";

export default function CoursesPage() {
  const { locale } = useLocale();
  const courses = getAllCourses();

  return (
    <>
      <section className="page-hero">
        <div className="container stack-lg">
          <p className="eyebrow">{msg("courses.eyebrow", locale)}</p>
          <h1 className="display display-lg">{msg("courses.title", locale)}</h1>
          <p className="lead">{msg("courses.intro", locale)}</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="courses-grid">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
