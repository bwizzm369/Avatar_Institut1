import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isActiveEnrollmentRow } from "@/lib/learning/progress";

describe("student reader authorization invariants", () => {
  it("never treats a bare URL slug as enrollment proof", () => {
    // Access helpers require enrollment or Pass+included — never the URL alone.
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
    expect(source).toMatch(/hasActiveStudentPassForProfile/);
    expect(source).toMatch(/student_pass_included/);
  });

  it("discount migration extends is_actively_enrolled for Pass-included courses", () => {
    const migrationPath = path.resolve(
      process.cwd(),
      "supabase/migrations/20260810180000_student_pass_discount_percent.sql",
    );
    const sql = readFileSync(migrationPath, "utf8");
    expect(sql).toMatch(/student_pass_discount_percent/);
    expect(sql).toMatch(/has_active_student_pass\(auth\.uid\(\)\)/);
    expect(sql).toMatch(/student_pass_included = true/);
  });

  it("marks lessons complete then auto-issues only via the service-role certificate store", () => {
    const actions = readFileSync(
      path.resolve(process.cwd(), "src/lib/learning/actions.ts"),
      "utf8",
    );
    expect(actions).toMatch(/markLessonCompleteAction/);
    expect(actions).toMatch(/loadModernCourseAutoIssueSnapshot/);
    expect(actions).toMatch(/maybeIssueModernCourseCertificate/);
    expect(actions).toMatch(/createServiceRoleSupabaseClient/);
    expect(actions).not.toMatch(/\.rpc\("issue_certificate"/);
    expect(actions).not.toMatch(/status:\s*"completed"/);
  });

  it("direct reader access treats demo courses as not found", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src/lib/learning/queries.ts"),
      "utf8",
    );
    expect(source).toMatch(/isVisibleToEnrolledStudent/);
    expect(source).toMatch(/resolveCourseSlugParam/);
    expect(source).toMatch(/kind:\s*"not_found"/);
    expect(source).not.toMatch(/\.eq\("is_published"/);
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
    expect(readFileSync(coursePage, "utf8")).toMatch(/resolveCourseSlugParam/);
    expect(readFileSync(coursePage, "utf8")).toMatch(/getStudentCourseBySlug/);
    expect(readFileSync(lessonPage, "utf8")).toMatch(/resolveCourseSlugParam/);
    expect(readFileSync(lessonPage, "utf8")).toMatch(/getStudentLesson/);
    expect(readFileSync(coursePage, "utf8")).toMatch(/LearningAccessDenied/);
    expect(readFileSync(lessonPage, "utf8")).toMatch(/LearningAccessDenied/);
  });
});
