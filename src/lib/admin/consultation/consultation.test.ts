import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CONSULTATION_STATUS_LABELS } from "@/lib/admin/consultation/mutations";

const sql = readFileSync(
  path.join(
    process.cwd(),
    "supabase/migrations/20260828120000_consultation_and_reviews.sql",
  ),
  "utf8",
);

describe("consultation and reviews schema", () => {
  it("keeps consultation PII admin-only and forces new status on insert", () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.consultation_requests/);
    expect(sql).toMatch(/prepare_consultation_request_insert/);
    expect(sql).toMatch(/NEW\.status := 'new'/);
    expect(sql).toMatch(/NEW\.admin_notes := ''/);
    expect(sql).toMatch(/consultation_requests_insert_public/);
    expect(sql).toMatch(/consultation_requests_select_admin/);
    expect(sql).toMatch(/USING \(public\.is_admin\(\)\)/);
    expect(sql).not.toMatch(/consultation_requests_select_own/);
    expect(sql).not.toMatch(/stripe|student_pass|certificate|webhook|checkout/i);
  });

  it("publishes reviews only when is_published is true", () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.reviews/);
    expect(sql).toMatch(/reviews_select_published/);
    expect(sql).toMatch(/USING \(is_published = true\)/);
    expect(sql).toMatch(/reviews_insert_admin/);
    expect(sql).toMatch(/reviews_update_admin/);
    expect(sql).toMatch(/GRANT INSERT ON public\.consultation_requests TO anon/);
    expect(sql).not.toMatch(/GRANT SELECT ON public\.consultation_requests TO anon/);
  });

  it("exposes admin status labels without inventing extra states", () => {
    expect(CONSULTATION_STATUS_LABELS).toEqual({
      new: "New",
      in_review: "In review",
      contacted: "Contacted",
      closed: "Closed",
    });
  });
});
