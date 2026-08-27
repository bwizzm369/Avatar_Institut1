import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  formatCertificateNumber,
  isCertificateStatus,
  isValidCertificateNumber,
  issuedAtYear,
  normalizeCertificateNumberInput,
  parseCertificateNumber,
} from "@/lib/certificates/number";
import {
  CERTIFICATE_PUBLIC_VERIFY_FIELDS,
  courseTitleForLocale,
  publicVerifyHasPrivateFields,
  toPublicCertificateVerify,
  viewFromVerifyRpcRows,
} from "@/lib/certificates/verify";

const migrationPath = path.resolve(
  process.cwd(),
  "supabase/migrations/20260817120000_certificates.sql",
);

describe("certificate number format", () => {
  it("formats AVT-YYYY-XXXXXX starting at 000001", () => {
    expect(formatCertificateNumber(2026, 1)).toBe("AVT-2026-000001");
    expect(formatCertificateNumber(2026, 2)).toBe("AVT-2026-000002");
    expect(formatCertificateNumber(2026, 50)).toBe("AVT-2026-000050");
  });

  it("validates official numbers and rejects old / malformed values", () => {
    expect(isValidCertificateNumber("AVT-2026-000001")).toBe(true);
    expect(isValidCertificateNumber("AVT-2026-000050")).toBe(true);
    expect(isValidCertificateNumber("Conto2024-01-0050")).toBe(false);
    expect(isValidCertificateNumber("AVT-26-000001")).toBe(false);
    expect(isValidCertificateNumber("avt-2026-000001")).toBe(false);
    expect(isValidCertificateNumber("")).toBe(false);
  });

  it("parses year and sequence from a valid number", () => {
    expect(parseCertificateNumber("AVT-2026-000001")).toEqual({
      year: 2026,
      sequence: 1,
    });
    expect(parseCertificateNumber("Conto2024-01-0050")).toBeNull();
  });

  it("takes YYYY from issued_at, not from a clock", () => {
    expect(issuedAtYear("2026-03-15")).toBe(2026);
    expect(issuedAtYear("2025-12-31T23:00:00.000Z")).toBe(2025);
  });
});

describe("certificate status", () => {
  it("accepts only issued and revoked", () => {
    expect(isCertificateStatus("issued")).toBe(true);
    expect(isCertificateStatus("revoked")).toBe(true);
    expect(isCertificateStatus("pending")).toBe(false);
    expect(isCertificateStatus("deleted")).toBe(false);
  });
});

describe("public verification payload", () => {
  it("keeps only snapshot fields from a verify_certificate row", () => {
    const publicRow = toPublicCertificateVerify({
      certificate_number: "AVT-2026-000001",
      status: "issued",
      holder_display_name: "Fatima El Amrani",
      course_title_en: "",
      course_title_ar: "دورة الكونتو",
      issued_at: "2026-01-10",
      email: "secret@example.com",
      phone: "+212600000000",
      notes: "admin private",
      profile_id: "should-not-leak",
      revoked_reason: "should-not-leak",
    });

    expect(publicRow).toEqual({
      certificateNumber: "AVT-2026-000001",
      status: "issued",
      holderDisplayName: "Fatima El Amrani",
      courseTitleEn: "",
      courseTitleAr: "دورة الكونتو",
      issuedAt: "2026-01-10",
    });
    expect(Object.keys(publicRow!).sort()).toEqual(
      [...CERTIFICATE_PUBLIC_VERIFY_FIELDS].sort(),
    );
    expect(publicVerifyHasPrivateFields(publicRow as unknown as Record<string, unknown>)).toBe(
      false,
    );
  });

  it("includes revoked status without revoked_reason", () => {
    const publicRow = toPublicCertificateVerify({
      certificate_number: "AVT-2026-000002",
      status: "revoked",
      holder_display_name: "Holder",
      course_title_en: "Course",
      course_title_ar: "دورة",
      issued_at: "2026-02-01",
      revoked_reason: "internal note",
    });
    expect(publicRow?.status).toBe("revoked");
    expect(publicRow).not.toHaveProperty("revokedReason");
    expect(publicRow).not.toHaveProperty("revoked_reason");
  });
});

describe("public verify view states", () => {
  const issuedRow = {
    certificate_number: "AVT-2026-000001",
    status: "issued",
    holder_display_name: "Fatima El Amrani",
    course_title_en: "Kontou Course",
    course_title_ar: "دورة الكونتو",
    issued_at: "2026-01-10",
  };

  it("normalizes URL input then accepts a valid official number", () => {
    expect(normalizeCertificateNumberInput(" avt-2026-000001 ")).toBe(
      "AVT-2026-000001",
    );
    expect(
      isValidCertificateNumber(
        normalizeCertificateNumberInput("AVT-2026-000001"),
      ),
    ).toBe(true);
  });

  it("treats an invalid number as not found without inventing a certificate", () => {
    const normalized = normalizeCertificateNumberInput("not-a-certificate");
    expect(isValidCertificateNumber(normalized)).toBe(false);
  });

  it("maps an issued RPC row to the valid public view", () => {
    const view = viewFromVerifyRpcRows([issuedRow]);
    expect(view.kind).toBe("issued");
    expect(view.certificate?.certificateNumber).toBe("AVT-2026-000001");
    expect(publicVerifyHasPrivateFields(view.certificate as unknown as Record<string, unknown>)).toBe(
      false,
    );
  });

  it("maps a revoked RPC row without revoked_reason", () => {
    const view = viewFromVerifyRpcRows([
      { ...issuedRow, status: "revoked", revoked_reason: "secret" },
    ]);
    expect(view.kind).toBe("revoked");
    expect(view.certificate).not.toHaveProperty("revokedReason");
    expect(view.certificate).not.toHaveProperty("email");
  });

  it("maps empty RPC results to not found", () => {
    expect(viewFromVerifyRpcRows([])).toEqual({
      kind: "not_found",
      certificate: null,
    });
    expect(viewFromVerifyRpcRows(null)).toEqual({
      kind: "not_found",
      certificate: null,
    });
  });

  it("selects course titles by locale with EN←AR fallback", () => {
    const arabicOnly = {
      certificateNumber: "AVT-2026-000001",
      status: "issued" as const,
      holderDisplayName: "Fatima El Amrani",
      courseTitleEn: "",
      courseTitleAr: "دورة الكونتو",
      issuedAt: "2026-01-10",
    };
    expect(courseTitleForLocale(arabicOnly, "ar")).toBe("دورة الكونتو");
    expect(courseTitleForLocale(arabicOnly, "en")).toBe("دورة الكونتو");
    expect(
      courseTitleForLocale(
        { ...arabicOnly, courseTitleEn: "Kontou Course" },
        "en",
      ),
    ).toBe("Kontou Course");
  });
});

describe("verify page source invariants", () => {
  it("looks up certificates via RPC only and sets noindex", () => {
    const lookup = readFileSync(
      path.resolve(process.cwd(), "src/lib/certificates/lookup.ts"),
      "utf8",
    );
    expect(lookup).toMatch(/rpc\("verify_certificate"/);
    expect(lookup).not.toMatch(/from\("certificates"\)/);
    expect(lookup).not.toMatch(/from\("profiles"\)/);
    expect(lookup).not.toMatch(/from\("legacy_students"\)/);
    expect(lookup).not.toMatch(/from\("enrollments"\)/);

    const page = readFileSync(
      path.resolve(
        process.cwd(),
        "src/app/verify/[certificateNumber]/page.tsx",
      ),
      "utf8",
    );
    expect(page).toMatch(/index:\s*false/);
    expect(page).toMatch(/follow:\s*false/);
    expect(page).toMatch(/lookupPublicCertificate/);
    expect(page).not.toMatch(/revoked_reason/);
  });
});

describe("certificates migration invariants", () => {
  const sql = readFileSync(migrationPath, "utf8");

  it("creates certificates and year counters without MAX()+1", () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.certificates/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.certificate_year_counters/);
    expect(sql).toMatch(/next_certificate_number/);
    expect(sql).toMatch(/ON CONFLICT \(year\)/);
    expect(sql).not.toMatch(/SELECT\s+MAX\s*\(/i);
    expect(sql).toMatch(/AVT-YYYY-XXXXXX/);
  });

  it("enforces holder, status, and partial unique anti-duplication", () => {
    expect(sql).toMatch(/certificates_holder_chk/);
    expect(sql).toMatch(/profile_id IS NOT NULL OR legacy_student_id IS NOT NULL/);
    expect(sql).toMatch(/status IN \('issued', 'revoked'\)/);
    expect(sql).toMatch(/certificates_legacy_completion_id_uidx/);
    expect(sql).toMatch(/certificates_profile_course_uidx/);
    expect(sql).toMatch(/certificates_legacy_student_course_uidx/);
    expect(sql).toMatch(/old_certificate_number TEXT/);
    expect(sql).not.toMatch(/UNIQUE \(old_certificate_number\)/);
  });

  it("enables RLS with student SELECT-own, admin write, and no DELETE policy", () => {
    expect(sql).toMatch(/ENABLE ROW LEVEL SECURITY/);
    expect(sql).toMatch(/certificates_select_own/);
    expect(sql).toMatch(/certificate_is_own/);
    expect(sql).toMatch(/linked_profile_id = auth\.uid\(\)/);
    expect(sql).toMatch(/certificates_insert_admin/);
    expect(sql).toMatch(/certificates_update_admin/);
    expect(sql).toMatch(/is_admin\(\)/);
    expect(sql).not.toMatch(
      /CREATE POLICY\s+"[^"]*"\s+ON\s+public\.certificates\s+FOR\s+DELETE/i,
    );
  });

  it("grants anon only verify_certificate and never table SELECT", () => {
    expect(sql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.verify_certificate\(TEXT\) TO anon/,
    );
    expect(sql).toMatch(/REVOKE ALL ON TABLE public\.certificates FROM anon/);
    expect(sql).toMatch(/SECURITY DEFINER/);
    expect(sql).toMatch(/SET search_path = public/);
    const fnStart = sql.indexOf(
      "CREATE OR REPLACE FUNCTION public.verify_certificate(p_number TEXT)",
    );
    const fnEnd = sql.indexOf("$$;", fnStart);
    const verifyFn = sql.slice(fnStart, fnEnd);
    expect(verifyFn).toMatch(/RETURNS TABLE \(/);
    expect(verifyFn).toMatch(/holder_display_name/);
    expect(verifyFn).not.toMatch(/revoked_reason/);
    expect(verifyFn).not.toMatch(/profile_id/);
    expect(verifyFn).not.toMatch(/legacy_student_id/);
    expect(verifyFn).not.toMatch(/\bemail\b/);
    expect(verifyFn).not.toMatch(/\bphone\b/);
    expect(verifyFn).not.toMatch(/\bnotes\b/);
  });
});
