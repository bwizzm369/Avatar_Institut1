import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CERTIFICATE_REVOKE_ENABLED } from "@/lib/admin/certificates/types";
import {
  canSubmitIssuance,
  formatHolderKey,
  publicHolderDisplayNameFromLegacy,
  publicHolderDisplayNameFromProfile,
} from "@/lib/admin/certificates/query";
import {
  canIssueCertificate,
  issueCertificate,
  mapIssueCertificateError,
  prepareCertificateIssuance,
  type CertificateIssueStore,
  type IssueCertificateInput,
  type PreparedCertificateIssuance,
} from "@/lib/admin/certificates/issue";

const LEGACY_ID = "11111111-1111-4111-8111-111111111111";
const PROFILE_ID = "22222222-2222-4222-8222-222222222222";
const COURSE_ID = "33333333-3333-4333-8333-333333333333";
const COMPLETION_ID = "44444444-4444-4444-8444-444444444444";
const ENROLLMENT_ID = "88888888-8888-4888-8888-888888888888";
const OTHER_PROFILE = "99999999-9999-4999-8999-999999999999";

const migrationPath = path.resolve(
  process.cwd(),
  "supabase/migrations/20260818160000_issue_certificate.sql",
);

function baseInput(
  overrides: Partial<IssueCertificateInput> = {},
): IssueCertificateInput {
  return {
    holderKey: formatHolderKey("legacy", LEGACY_ID),
    itemKey: `completion:${COMPLETION_ID}`,
    issuedAt: "2024-06-15",
    language: "ar",
    oldCertificateNumber: "Conto2024-01-0050",
    ...overrides,
  };
}

function createStore(
  overrides: Partial<CertificateIssueStore> = {},
): CertificateIssueStore {
  const issued: PreparedCertificateIssuance[] = [];
  return {
    loadEnrollment: async () => ({
      id: ENROLLMENT_ID,
      user_id: PROFILE_ID,
      course_id: COURSE_ID,
      status: "completed",
    }),
    loadCompletion: async () => ({
      id: COMPLETION_ID,
      legacy_student_id: LEGACY_ID,
      course_id: COURSE_ID,
      course_title_original: "دورة الشكر",
      old_certificate_number: "Conto2024-01-0050",
      certificate_language: "ar",
    }),
    loadProfile: async () => ({
      id: PROFILE_ID,
      email: "omar@example.com",
      first_name: "Omar",
      last_name: "Haddad",
      locale: "en",
      role: "student",
    }),
    loadLegacyStudent: async () => ({
      id: LEGACY_ID,
      full_name: "Lina Nasser",
      linked_profile_id: null,
    }),
    loadCourse: async () => ({
      id: COURSE_ID,
      title_en: "Gratitude Course",
      title_ar: "دورة الشكر",
    }),
    listLinkedLegacyIds: async () => [],
    findDuplicates: async () => [],
    issueAtomic: async (payload) => {
      issued.push(payload);
      return {
        data: {
          certificate_number: `AVT-${payload.year}-000002`,
          already_existed: false,
          status: "issued",
          holder_display_name: payload.holderDisplayName,
          course_title_en: payload.courseTitleEn,
          course_title_ar: payload.courseTitleAr,
          issued_at: payload.issuedAt,
        },
        error: null,
      };
    },
    ...overrides,
  };
}

describe("admin required for issuance", () => {
  it("allows admins and refuses students", () => {
    expect(canIssueCertificate("admin")).toBe(true);
    expect(canIssueCertificate("student")).toBe(false);
  });

  it("never lets a student reach the atomic RPC", async () => {
    let called = false;
    const result = await issueCertificate({
      store: createStore({
        issueAtomic: async () => {
          called = true;
          return { data: null, error: null };
        },
      }),
      context: "student",
      input: baseInput(),
    });
    expect(called).toBe(false);
    expect(result).toEqual({ ok: false, error: "Access denied." });
  });
});

describe("prepareCertificateIssuance", () => {
  it("rebuilds legacy snapshots on the server and uses issued_at year", async () => {
    const prepared = await prepareCertificateIssuance(
      createStore(),
      baseInput({ issuedAt: "2024-06-15" }),
    );
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    expect(prepared.prepared.year).toBe(2024);
    expect(prepared.prepared.legacyStudentId).toBe(LEGACY_ID);
    expect(prepared.prepared.legacyCompletionId).toBe(COMPLETION_ID);
    expect(prepared.prepared.profileId).toBeNull();
    expect(prepared.prepared.holderDisplayName).toBe("Lina Nasser");
    expect(prepared.prepared.courseTitleAr).toBe("دورة الشكر");
    expect(prepared.prepared.courseTitleEn).toBe("Gratitude Course");
    expect(prepared.prepared.oldCertificateNumber).toBe("Conto2024-01-0050");
    expect(prepared.prepared.language).toBe("ar");
  });

  it("rebuilds modern enrollment snapshots from the profile and course registry", async () => {
    const prepared = await prepareCertificateIssuance(
      createStore(),
      baseInput({
        holderKey: formatHolderKey("modern", PROFILE_ID),
        itemKey: `enrollment:${ENROLLMENT_ID}`,
        issuedAt: "2026-03-01",
        language: "en",
        oldCertificateNumber: null,
      }),
    );
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    expect(prepared.prepared.year).toBe(2026);
    expect(prepared.prepared.profileId).toBe(PROFILE_ID);
    expect(prepared.prepared.enrollmentId).toBe(ENROLLMENT_ID);
    expect(prepared.prepared.legacyCompletionId).toBeNull();
    expect(prepared.prepared.holderDisplayName).toBe("Omar Haddad");
    expect(prepared.prepared.courseTitleEn).toBe("Gratitude Course");
    expect(JSON.stringify(prepared.prepared)).not.toMatch(/@/);
  });

  it("refuses a modern profile that has email but no public name", async () => {
    const result = await prepareCertificateIssuance(
      createStore({
        loadProfile: async () => ({
          id: PROFILE_ID,
          email: "omar@example.com",
          first_name: "",
          last_name: "  ",
          locale: "en",
          role: "student",
        }),
      }),
      baseInput({
        holderKey: formatHolderKey("modern", PROFILE_ID),
        itemKey: `enrollment:${ENROLLMENT_ID}`,
        language: "en",
        oldCertificateNumber: null,
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe(
      "A public holder name is required before issuing a certificate.",
    );
    expect(JSON.stringify(result)).not.toMatch(/omar@example.com/);
    expect(publicHolderDisplayNameFromProfile({
      first_name: "",
      last_name: "",
    })).toBe("");
  });

  it("refuses a legacy student without full_name instead of using private fields", async () => {
    const result = await prepareCertificateIssuance(
      createStore({
        loadLegacyStudent: async () => ({
          id: LEGACY_ID,
          full_name: "   ",
          linked_profile_id: null,
        }),
      }),
      baseInput(),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe(
      "A public holder name is required before issuing a certificate.",
    );
    expect(publicHolderDisplayNameFromLegacy("Lina Nasser")).toBe("Lina Nasser");
    expect(publicHolderDisplayNameFromLegacy("")).toBe("");
  });

  it("sets both identities for a linked legacy completion", async () => {
    const prepared = await prepareCertificateIssuance(
      createStore({
        loadLegacyStudent: async () => ({
          id: LEGACY_ID,
          full_name: "Lina Nasser",
          linked_profile_id: PROFILE_ID,
        }),
        listLinkedLegacyIds: async () => [LEGACY_ID],
      }),
      baseInput({
        holderKey: formatHolderKey("legacy", LEGACY_ID),
      }),
    );
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    expect(prepared.prepared.legacyStudentId).toBe(LEGACY_ID);
    expect(prepared.prepared.profileId).toBe(PROFILE_ID);
  });

  it("rejects a client-supplied official number by never reading one", async () => {
    const prepared = await prepareCertificateIssuance(
      createStore(),
      {
        ...baseInput(),
        certificateNumber: "AVT-2026-000001",
      } as IssueCertificateInput & { certificateNumber: string },
    );
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    expect(JSON.stringify(prepared.prepared)).not.toMatch(/AVT-2026-000001/);
    expect(prepared.prepared).not.toHaveProperty("certificateNumber");
  });

  it("does not invent English titles when only an original Arabic title exists", async () => {
    const prepared = await prepareCertificateIssuance(
      createStore({
        loadCompletion: async () => ({
          id: COMPLETION_ID,
          legacy_student_id: LEGACY_ID,
          course_id: null,
          course_title_original: "دورة الشكر",
          old_certificate_number: null,
          certificate_language: "ar",
        }),
      }),
      baseInput({ oldCertificateNumber: null }),
    );
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    expect(prepared.prepared.courseTitleEn).toBe("");
    expect(prepared.prepared.courseTitleAr).toBe("دورة الشكر");
  });

  it("returns Certificate already exists without calling the RPC", async () => {
    let called = false;
    const result = await issueCertificate({
      store: createStore({
        findDuplicates: async () => [
          {
            certificateNumber: "AVT-2026-000002",
            legacyCompletionId: COMPLETION_ID,
            profileId: null,
            legacyStudentId: LEGACY_ID,
            courseId: COURSE_ID,
          },
        ],
        issueAtomic: async () => {
          called = true;
          return { data: null, error: null };
        },
      }),
      context: "admin",
      input: baseInput(),
    });
    expect(called).toBe(false);
    expect(result).toMatchObject({
      ok: false,
      error: "Certificate already exists",
      alreadyExists: true,
      certificateNumber: "AVT-2026-000002",
    });
  });

  it("does not treat AVT-2026-000001 without a course as a duplicate of a real course", async () => {
    const prepared = await prepareCertificateIssuance(
      createStore({
        findDuplicates: async () => [
          {
            certificateNumber: "AVT-2026-000001",
            legacyCompletionId: null,
            profileId: null,
            legacyStudentId: LEGACY_ID,
            courseId: null,
          },
        ],
      }),
      baseInput(),
    );
    expect(prepared.ok).toBe(true);
  });

  it("rejects a completion that belongs to another student", async () => {
    const result = await prepareCertificateIssuance(
      createStore({
        loadCompletion: async () => ({
          id: COMPLETION_ID,
          legacy_student_id: OTHER_PROFILE,
          course_id: COURSE_ID,
          course_title_original: "دورة الشكر",
          old_certificate_number: null,
          certificate_language: "ar",
        }),
        loadLegacyStudent: async () => ({
          id: OTHER_PROFILE,
          full_name: "Other",
          linked_profile_id: null,
        }),
      }),
      baseInput(),
    );
    expect(result).toEqual({
      ok: false,
      error: "Course or completion does not belong to this student.",
    });
  });

  it("rejects an invalid date", async () => {
    const result = await prepareCertificateIssuance(
      createStore(),
      baseInput({ issuedAt: "18/08/2026" }),
    );
    expect(result).toEqual({ ok: false, error: "Invalid issue date." });
  });
});

describe("issueCertificate", () => {
  it("issues a modern certificate through the atomic RPC only", async () => {
    const payloads: PreparedCertificateIssuance[] = [];
    const result = await issueCertificate({
      store: createStore({
        issueAtomic: async (payload) => {
          payloads.push(payload);
          expect(payload).not.toHaveProperty("certificateNumber");
          return {
            data: {
              certificate_number: "AVT-2026-000002",
              already_existed: false,
              status: "issued",
              holder_display_name: payload.holderDisplayName,
              course_title_en: payload.courseTitleEn,
              course_title_ar: payload.courseTitleAr,
              issued_at: payload.issuedAt,
            },
            error: null,
          };
        },
      }),
      context: "admin",
      input: baseInput({
        holderKey: formatHolderKey("modern", PROFILE_ID),
        itemKey: `enrollment:${ENROLLMENT_ID}`,
        issuedAt: "2026-08-18",
        language: "en",
        oldCertificateNumber: null,
      }),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.certificateNumber).toBe("AVT-2026-000002");
    expect(result.status).toBe("issued");
    expect(payloads[0]?.year).toBe(2026);
    expect(payloads[0]?.holderDisplayName).toBe("Omar Haddad");
  });

  it("issues a legacy certificate using the completion year", async () => {
    const result = await issueCertificate({
      store: createStore(),
      context: "admin",
      input: baseInput({ issuedAt: "2024-01-20" }),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.certificateNumber).toBe("AVT-2024-000002");
    expect(result.holderDisplayName).toBe("Lina Nasser");
    expect(result.issuedAt).toBe("2024-01-20");
  });

  it("maps a unique SQL error to Certificate already exists", () => {
    const mapped = mapIssueCertificateError({
      code: "23505",
      message:
        'duplicate key value violates unique constraint "certificates_legacy_completion_id_uidx"',
    });
    expect(mapped).toEqual({
      ok: false,
      error: "Certificate already exists",
      alreadyExists: true,
      certificateNumber: undefined,
    });
  });

  it("maps relation mismatches to a business error without SQL", () => {
    expect(
      mapIssueCertificateError({
        message: "enrollment does not match the student",
      }).error,
    ).toBe("Course or completion does not belong to this student.");
    expect(
      mapIssueCertificateError({
        message: "enrollment does not match the course",
      }).error,
    ).toBe("Course or completion does not belong to this student.");
    expect(
      mapIssueCertificateError({
        message: "completion does not match the student",
      }).error,
    ).toBe("Course or completion does not belong to this student.");
    expect(
      mapIssueCertificateError({
        message: "legacy student is not linked to this profile",
      }).error,
    ).toBe("Course or completion does not belong to this student.");
    expect(
      mapIssueCertificateError({
        message: "certificate holder display name is required",
      }).error,
    ).toBe("A public holder name is required before issuing a certificate.");
    expect(
      mapIssueCertificateError({ message: "course not found" }).error,
    ).toBe("Course not found.");
  });

  it("does not leak SQL or secrets in mapped errors", () => {
    const mapped = mapIssueCertificateError({
      code: "XX000",
      message: "SELECT * FROM certificates WHERE service_role_key = 'secret'",
    });
    expect(mapped.error).toBe("Could not issue the certificate.");
    expect(mapped.error).not.toMatch(/SELECT/);
    expect(mapped.error).not.toMatch(/secret/);
  });
});

describe("issuance button rules", () => {
  it("enables Issue certificate only with a valid selection and date", () => {
    expect(
      canSubmitIssuance({
        issuanceEnabled: true,
        alreadyExists: false,
        holderSelected: true,
        itemSelected: true,
        issuedAt: "2026-08-18",
        holderDisplayName: "Lina Nasser",
      }),
    ).toBe(true);
    expect(
      canSubmitIssuance({
        issuanceEnabled: true,
        alreadyExists: true,
        holderSelected: true,
        itemSelected: true,
        issuedAt: "2026-08-18",
        holderDisplayName: "Lina Nasser",
      }),
    ).toBe(false);
    expect(
      canSubmitIssuance({
        issuanceEnabled: false,
        alreadyExists: false,
        holderSelected: true,
        itemSelected: true,
        issuedAt: "2026-08-18",
        holderDisplayName: "Lina Nasser",
      }),
    ).toBe(false);
  });
});

describe("issue_certificate migration invariants", () => {
  const sql = readFileSync(migrationPath, "utf8");

  it("allocates the number from issued_at inside one function", () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.issue_certificate/);
    expect(sql).toMatch(/next_certificate_number\(v_year\)/);
    expect(sql).toMatch(/EXTRACT\(YEAR FROM p_issued_at\)/);
    expect(sql).not.toMatch(/SELECT\s+MAX\s*\(/i);
    expect(sql).not.toMatch(/p_certificate_number/);
  });

  it("refuses incoherent modern, legacy, and linked identities before allocating a number", () => {
    const nextAt = sql.indexOf("next_certificate_number(v_year)");
    expect(sql.indexOf("enrollment does not match the student")).toBeGreaterThan(
      -1,
    );
    expect(sql.indexOf("enrollment does not match the course")).toBeGreaterThan(
      -1,
    );
    expect(sql.indexOf("completion does not match the student")).toBeGreaterThan(
      -1,
    );
    expect(
      sql.indexOf("legacy student is not linked to this profile"),
    ).toBeGreaterThan(-1);
    expect(sql.indexOf("course not found")).toBeGreaterThan(-1);
    expect(sql.indexOf("enrollment does not match the student")).toBeLessThan(
      nextAt,
    );
    expect(sql.indexOf("completion does not match the student")).toBeLessThan(
      nextAt,
    );
    expect(
      sql.indexOf("legacy student is not linked to this profile"),
    ).toBeLessThan(nextAt);
    expect(sql).toMatch(/linked_profile_id/);
    expect(sql).toMatch(/FROM public\.enrollments/);
    expect(sql).toMatch(/FROM public\.legacy_course_completions/);
  });

  it("rebuilds holder and course snapshots from live rows, not client title/name params", () => {
    expect(sql).not.toMatch(/p_holder_display_name/);
    expect(sql).not.toMatch(/p_course_title_en/);
    expect(sql).not.toMatch(/p_course_title_ar/);
    expect(sql).toMatch(/p\.first_name/);
    expect(sql).toMatch(/p\.last_name/);
    expect(sql).toMatch(/ls\.full_name/);
    expect(sql).toMatch(/c\.title_en/);
    expect(sql).toMatch(/c\.title_ar/);
    expect(sql).toMatch(/lc\.course_title_original/);
    expect(sql).toMatch(/certificate holder display name is required/);
    expect(sql).not.toMatch(/email/i);
    expect(sql).not.toMatch(/v_email/);
    expect(sql).not.toMatch(/\bphone\b/);
    expect(sql).not.toMatch(/\bnotes\b/);
    expect(sql).not.toMatch(/revoked_reason/);
    expect(sql).not.toMatch(/SUPABASE_SECRET|service_role_key|eyJ/);
  });

  it("keeps duplicate checks and unique_violation rollback", () => {
    expect(sql).toMatch(/legacy_completion_id = p_legacy_completion_id/);
    expect(sql).toMatch(/c\.profile_id = p_profile_id/);
    expect(sql).toMatch(/c\.legacy_student_id = p_legacy_student_id/);
    expect(sql).toMatch(/WHEN unique_violation THEN/);
    expect(sql).toMatch(/already_existed := TRUE/);
  });

  it("is admin-only and does not revoke", () => {
    expect(sql).toMatch(/SECURITY DEFINER/);
    expect(sql).toMatch(/SET search_path = public/);
    expect(sql).toMatch(/is_admin\(\)/);
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.issue_certificate/);
    expect(sql).toMatch(/FROM anon/);
    expect(sql).not.toMatch(/status = 'revoked'/);
    expect(sql).not.toMatch(/Revoke certificate/);
    expect(CERTIFICATE_REVOKE_ENABLED).toBe(false);
  });
});

describe("issue source invariants", () => {
  it("calls issue_certificate rather than inserting or allocating from TypeScript", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src/lib/admin/certificates/issue.ts"),
      "utf8",
    );
    expect(source).toMatch(/rpc\("issue_certificate"/);
    expect(source).not.toMatch(/next_certificate_number/);
    expect(source).not.toMatch(/from\("certificates"\)\s*\n\s*\.insert/);
    expect(source).not.toMatch(/profileDisplayName/);
    expect(source).toMatch(/publicHolderDisplayNameFromProfile/);
    expect(source).toMatch(/publicHolderDisplayNameFromLegacy/);
    expect(source).not.toMatch(/p_course_title_en/);
    expect(source).not.toMatch(/p_course_title_ar/);
    expect(source).not.toMatch(/\bphone\b/);
    expect(source).not.toMatch(/\bnotes\b/);
    expect(source).not.toMatch(/revoked_reason/);
  });

  it("keeps the server action behind getAdminAccess", () => {
    const source = readFileSync(
      path.resolve(
        process.cwd(),
        "src/app/admin/(console)/certificates/actions.ts",
      ),
      "utf8",
    );
    expect(source).toMatch(/getAdminAccess/);
    expect(source).toMatch(/issueCertificate/);
    expect(source).not.toMatch(/createServiceRoleSupabaseClient/);
    expect(source).not.toMatch(/next_certificate_number/);
    expect(source).not.toMatch(/from\("certificates"\)/);
  });
});
