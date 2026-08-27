import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CLIENT_ENROLLMENT_MUTATIONS_ALLOWED,
  ENROLLMENT_CLIENT_OPERATIONS,
  assertServerEnrollmentGrant,
  canCreateEnrollment,
} from "@/lib/enrollments/policy";

describe("enrollment creation is not allowed from the browser", () => {
  it("forbids browser enrollment creation in application policy", () => {
    expect(CLIENT_ENROLLMENT_MUTATIONS_ALLOWED).toBe(false);
    expect(canCreateEnrollment("browser")).toBe(false);
    expect(canCreateEnrollment("service_role")).toBe(true);
    expect(() => assertServerEnrollmentGrant("browser")).toThrow(
      /ENROLLMENT_CREATE_FORBIDDEN/,
    );
  });

  it("exposes only read operations for client-facing enrollment usage", () => {
    expect([...ENROLLMENT_CLIENT_OPERATIONS]).toEqual([
      "getDashboardStudentState",
    ]);
  });

  it("dashboard student state hides is_demo courses without filtering unpublished real enrollments", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src/lib/enrollments/queries.ts"),
      "utf8",
    );
    expect(source).toMatch(/isVisibleToEnrolledStudent/);
    expect(source).not.toMatch(/\.eq\("is_published"/);
  });

  it("RLS migration has no INSERT policy on enrollments", () => {
    const migrationPath = path.resolve(
      process.cwd(),
      "supabase/migrations/20260723120000_supabase_light_schema.sql",
    );
    const sql = readFileSync(migrationPath, "utf8");
    expect(sql).toMatch(/ENABLE ROW LEVEL SECURITY/);
    expect(sql).toMatch(/enrollments_select_own/);
    expect(sql).not.toMatch(
      /CREATE POLICY\s+"[^"]*"\s+ON\s+public\.enrollments\s+FOR\s+INSERT/i,
    );
    expect(sql).toMatch(/Intentionally no INSERT/);
  });
});
