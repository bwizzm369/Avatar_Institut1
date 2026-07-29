import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isActiveEnrollmentRow } from "@/lib/learning/progress";

describe("student reader authorization invariants", () => {
  it("never treats a bare URL slug as enrollment proof", () => {
    // Access helpers require an enrollment row; slug alone is insufficient.
    expect(isActiveEnrollmentRow(undefined)).toBe(false);
    expect(
      isActiveEnrollmentRow({
        status: "pending_payment",
        payment_confirmed_at: null,
      }),
    ).toBe(false);
  });

  it("phase 3A migration adds progress write RLS for enrolled owners only", () => {
    const migrationPath = path.resolve(
      process.cwd(),
      "supabase/migrations/20260727150000_phase3a_content_reader.sql",
    );
    const sql = readFileSync(migrationPath, "utf8");
    expect(sql).toMatch(/lesson_progress_insert_own/);
    expect(sql).toMatch(/lesson_progress_update_own/);
    expect(sql).toMatch(/is_actively_enrolled\(public\.lesson_course_id\(lesson_id\)\)/);
    expect(sql).not.toMatch(
      /CREATE POLICY\s+"[^"]*"\s+ON\s+public\.lesson_progress\s+FOR\s+DELETE/i,
    );
  });

  it("phase 3A migration keeps bunny_video_id as a reserved column", () => {
    const migrationPath = path.resolve(
      process.cwd(),
      "supabase/migrations/20260727150000_phase3a_content_reader.sql",
    );
    const sql = readFileSync(migrationPath, "utf8");
    expect(sql).toMatch(/bunny_video_id/);
    expect(sql).toMatch(/Never expose via public unauthenticated pages/);
  });

  it("reader queries omit raw bunny_video_id from client lesson summaries", () => {
    const queriesPath = path.resolve(
      process.cwd(),
      "src/lib/learning/queries.ts",
    );
    const source = readFileSync(queriesPath, "utf8");
    expect(source).toMatch(/hasBunnyVideo/);
    expect(source).toMatch(/raw id is never sent to the browser/);
    expect(source).toMatch(/requireActiveEnrollmentForCourse/);
  });

  it("lesson page and course page live under dashboard routes", () => {
    const coursePage = path.resolve(
      process.cwd(),
      "src/app/dashboard/courses/[courseSlug]/page.tsx",
    );
    const lessonPage = path.resolve(
      process.cwd(),
      "src/app/dashboard/courses/[courseSlug]/lessons/[lessonId]/page.tsx",
    );
    expect(readFileSync(coursePage, "utf8")).toMatch(/getStudentCourseBySlug/);
    expect(readFileSync(lessonPage, "utf8")).toMatch(/getStudentLesson/);
    expect(readFileSync(coursePage, "utf8")).toMatch(/LearningAccessDenied/);
    expect(readFileSync(lessonPage, "utf8")).toMatch(/LearningAccessDenied/);
  });
});
