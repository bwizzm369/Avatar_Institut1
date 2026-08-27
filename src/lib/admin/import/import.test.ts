import { describe, expect, it } from "vitest";
import { buildImportFingerprint } from "@/lib/admin/import/fingerprint";
import {
  isValidEmailFormat,
  normalizeEmail,
  parseImportDate,
} from "@/lib/admin/import/normalize";
import {
  buildImportTemplateCsv,
  buildImportTemplateWorkbook,
  parseImportBuffer,
} from "@/lib/admin/import/parse";
import {
  applyConfirmImportGuards,
  buildPreviewReport,
  matchCourseByTitle,
} from "@/lib/admin/import/preview";
import { commitLegacyImport } from "@/lib/admin/import/commit";
import {
  isProtectedAdminPath,
  resolveAdminSessionAccess,
} from "@/lib/admin/guards";
import type {
  CourseMatch,
  PreviewRow,
  RawImportRow,
} from "@/lib/admin/import/types";
import { readFileSync } from "node:fs";
import path from "node:path";

const courses: CourseMatch[] = [
  {
    id: "course-1",
    titleEn: "Foundations of Metaphysics",
    titleAr: "أسس الميتافيزيقا",
  },
];

function validCsv(rows: string[]): string {
  const header =
    "student_name,student_email,student_phone,course_title,completed_at,old_certificate_number,certificate_language,notes";
  return `${header}\n${rows.join("\n")}\n`;
}

function studentOnlyCsv(rows: string[]): string {
  const header = "full_name,email,phone,notes";
  return `${header}\n${rows.join("\n")}\n`;
}

describe("admin import normalize", () => {
  it("normalizes emails to lowercase", () => {
    expect(normalizeEmail("  Ada@Example.COM ")).toBe("ada@example.com");
  });

  it("rejects invalid emails", () => {
    expect(isValidEmailFormat("not-an-email")).toBe(false);
    expect(isValidEmailFormat("ok@example.com")).toBe(true);
  });

  it("parses valid dates and rejects invalid ones", () => {
    expect(parseImportDate("2024-06-15")).toBe("2024-06-15");
    expect(parseImportDate("15/06/2024")).toBe("2024-06-15");
    expect(parseImportDate("31/02/2024")).toBeNull();
    expect(parseImportDate("not-a-date")).toBeNull();
  });
});

describe("admin import parse", () => {
  it("parses a valid CSV", () => {
    const parsed = parseImportBuffer(
      Buffer.from(
        validCsv([
          '"Ada Lovelace","ada@example.com","","Foundations of Metaphysics","2024-01-10","CERT-1","en",""',
        ]),
        "utf8",
      ),
      "students.csv",
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.rows).toHaveLength(1);
      expect(parsed.rows[0].student_name).toContain("Ada");
    }
  });

  it("parses friendly aliases full_name/email/phone", () => {
    const parsed = parseImportBuffer(
      Buffer.from(
        studentOnlyCsv([
          '"Ada Lovelace","ADA@Example.COM","+49 111","note"',
        ]),
        "utf8",
      ),
      "students.csv",
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.rows[0].student_name).toContain("Ada");
      expect(parsed.rows[0].student_email).toBe("ADA@Example.COM");
      expect(parsed.rows[0].student_phone).toContain("111");
    }
  });

  it("parses a valid Excel template workbook", () => {
    const workbook = buildImportTemplateWorkbook();
    const parsed = parseImportBuffer(workbook, "template.xlsx");
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.rows.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("rejects an invalid file type", () => {
    const parsed = parseImportBuffer(Buffer.from("hello"), "notes.txt");
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.errors[0]).toMatch(/Invalid file type/i);
    }
  });

  it("rejects an empty file", () => {
    const parsed = parseImportBuffer(Buffer.from(""), "empty.csv");
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.errors[0]).toMatch(/empty/i);
    }
  });

  it("rejects missing required name column", () => {
    const parsed = parseImportBuffer(
      Buffer.from("email,notes\nada@example.com,hi\n"),
      "bad.csv",
    );
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.errors.join(" ")).toMatch(/Missing required columns/i);
    }
  });

  it("exposes a CSV template with friendly columns", () => {
    const csv = buildImportTemplateCsv();
    expect(csv).toContain("full_name");
    expect(csv).toContain("email");
    expect(csv).toContain("FICTIONAL");
  });
});

describe("admin import preview validation", () => {
  it("marks invalid email as INVALID", () => {
    const report = buildPreviewReport({
      fileName: "t.csv",
      courses,
      rows: [
        {
          student_name: "Ada",
          student_email: "bad-email",
          student_phone: "",
          course_title: "",
          completed_at: "",
          old_certificate_number: "",
          certificate_language: "",
          notes: "",
        },
      ],
    });
    expect(report.rows[0].status).toBe("INVALID");
    expect(report.rows[0].messages.join(" ")).toMatch(/Invalid email/i);
  });

  it("normalizes uppercase email in preview", () => {
    const report = buildPreviewReport({
      fileName: "t.csv",
      courses,
      rows: [
        {
          student_name: "Ada",
          student_email: "ADA@Example.COM",
          student_phone: "",
          course_title: "",
          completed_at: "",
          old_certificate_number: "",
          certificate_language: "",
          notes: "",
        },
      ],
    });
    expect(report.rows[0].status).toBe("READY");
    expect(report.rows[0].studentEmail).toBe("ada@example.com");
  });

  it("allows student-only rows without phone", () => {
    const report = buildPreviewReport({
      fileName: "t.csv",
      courses,
      rows: [
        {
          student_name: "Ada",
          student_email: "ada@example.com",
          student_phone: "",
          course_title: "",
          completed_at: "",
          old_certificate_number: "",
          certificate_language: "",
          notes: "ok",
        },
      ],
    });
    expect(report.rows[0].status).toBe("READY");
    expect(report.rows[0].studentPhone).toBeNull();
    expect(report.rows[0].hasCompletion).toBe(false);
  });

  it("marks existing email as EXISTING", () => {
    const report = buildPreviewReport({
      fileName: "t.csv",
      courses,
      existingEmails: new Set(["ada@example.com"]),
      rows: [
        {
          student_name: "Ada",
          student_email: "ADA@example.com",
          student_phone: "",
          course_title: "",
          completed_at: "",
          old_certificate_number: "",
          certificate_language: "",
          notes: "",
        },
      ],
    });
    expect(report.rows[0].status).toBe("EXISTING");
  });

  it("keeps existing email READY when a new historical completion is present", () => {
    const report = buildPreviewReport({
      fileName: "t.csv",
      courses,
      existingEmails: new Set(["sara.benali@example.com"]),
      rows: [
        {
          student_name: "Sara Benali",
          student_email: "sara.benali@example.com",
          student_phone: "",
          course_title: "Foundations of Metaphysics",
          completed_at: "2024-03-01",
          old_certificate_number: "",
          certificate_language: "en",
          notes: "",
        },
      ],
    });
    expect(report.rows[0].status).toBe("READY");
    expect(report.rows[0].hasCompletion).toBe(true);
    expect(report.rows[0].importFingerprint).toBeTruthy();
    expect(report.rows[0].matchedCourseId).toBe("course-1");
    expect(report.rows[0].messages.join(" ")).toMatch(/reused/i);
  });

  it("marks existing email + same completion fingerprint as DUPLICATE", () => {
    const fingerprint = buildImportFingerprint({
      studentName: "Sara Benali",
      studentEmail: "sara.benali@example.com",
      courseTitle: "Foundations of Metaphysics",
      completedAt: "2024-03-01",
      oldCertificateNumber: null,
    });
    const report = buildPreviewReport({
      fileName: "t.csv",
      courses,
      existingEmails: new Set(["sara.benali@example.com"]),
      existingFingerprints: new Set([fingerprint]),
      rows: [
        {
          student_name: "Sara Benali",
          student_email: "sara.benali@example.com",
          student_phone: "",
          course_title: "Foundations of Metaphysics",
          completed_at: "2024-03-01",
          old_certificate_number: "",
          certificate_language: "en",
          notes: "",
        },
      ],
    });
    expect(report.rows[0].status).toBe("DUPLICATE");
    expect(report.rows[0].importFingerprint).toBe(fingerprint);
  });

  it("allows a second historical course or date for an existing email", () => {
    const firstFingerprint = buildImportFingerprint({
      studentName: "Sara Benali",
      studentEmail: "sara.benali@example.com",
      courseTitle: "Foundations of Metaphysics",
      completedAt: "2024-03-01",
      oldCertificateNumber: null,
    });
    const report = buildPreviewReport({
      fileName: "t.csv",
      courses,
      existingEmails: new Set(["sara.benali@example.com"]),
      existingFingerprints: new Set([firstFingerprint]),
      rows: [
        {
          student_name: "Sara Benali",
          student_email: "sara.benali@example.com",
          student_phone: "",
          course_title: "Foundations of Metaphysics",
          completed_at: "2024-06-15",
          old_certificate_number: "",
          certificate_language: "en",
          notes: "",
        },
      ],
    });
    expect(report.rows[0].status).toBe("READY");
    expect(report.rows[0].importFingerprint).not.toBe(firstFingerprint);
  });

  it("detects duplicate emails in the same file as EXISTING", () => {
    const row: RawImportRow = {
      student_name: "Ada Lovelace",
      student_email: "ada@example.com",
      student_phone: "",
      course_title: "",
      completed_at: "",
      old_certificate_number: "",
      certificate_language: "",
      notes: "",
    };
    const report = buildPreviewReport({
      fileName: "t.csv",
      courses,
      rows: [row, { ...row, student_name: "Ada Copy" }],
    });
    expect(report.rows[0].status).toBe("READY");
    expect(report.rows[1].status).toBe("EXISTING");
  });

  it("detects duplicate existing completion fingerprints", () => {
    const row: RawImportRow = {
      student_name: "Ada Lovelace",
      student_email: "ada@example.com",
      student_phone: "",
      course_title: "Foundations of Metaphysics",
      completed_at: "2024-01-10",
      old_certificate_number: "CERT-1",
      certificate_language: "en",
      notes: "",
    };
    const fingerprint = buildImportFingerprint({
      studentName: "Ada Lovelace",
      studentEmail: "ada@example.com",
      courseTitle: "Foundations of Metaphysics",
      completedAt: "2024-01-10",
      oldCertificateNumber: "CERT-1",
    });
    const report = buildPreviewReport({
      fileName: "t.csv",
      courses,
      rows: [row],
      existingFingerprints: new Set([fingerprint]),
    });
    expect(report.rows[0].status).toBe("DUPLICATE");
  });

  it("marks invalid date as INVALID when completion provided", () => {
    const report = buildPreviewReport({
      fileName: "t.csv",
      courses,
      rows: [
        {
          student_name: "Ada",
          student_email: "ada@example.com",
          student_phone: "",
          course_title: "Foundations of Metaphysics",
          completed_at: "not-a-date",
          old_certificate_number: "",
          certificate_language: "",
          notes: "",
        },
      ],
    });
    expect(report.rows[0].status).toBe("INVALID");
  });

  it("marks missing name as INVALID", () => {
    const report = buildPreviewReport({
      fileName: "t.csv",
      courses,
      rows: [
        {
          student_name: "",
          student_email: "ada@example.com",
          student_phone: "",
          course_title: "",
          completed_at: "",
          old_certificate_number: "",
          certificate_language: "",
          notes: "",
        },
      ],
    });
    expect(report.rows[0].status).toBe("INVALID");
  });

  it("warns when course is not found and never invents a course id", () => {
    expect(matchCourseByTitle("Unknown Course XYZ", courses)).toBeNull();
    const report = buildPreviewReport({
      fileName: "t.csv",
      courses,
      rows: [
        {
          student_name: "Ada",
          student_email: "ada@example.com",
          student_phone: "",
          course_title: "Unknown Course XYZ",
          completed_at: "2024-01-10",
          old_certificate_number: "",
          certificate_language: "",
          notes: "",
        },
      ],
    });
    expect(report.rows[0].status).toBe("WARNING");
    expect(report.rows[0].matchedCourseId).toBeNull();
    expect(report.rows[0].messages.join(" ")).toMatch(/COURSE NOT FOUND/i);
  });

  it("allows students without email when other fields are valid", () => {
    const report = buildPreviewReport({
      fileName: "t.csv",
      courses,
      rows: [
        {
          student_name: "Historical Guest",
          student_email: "",
          student_phone: "",
          course_title: "",
          completed_at: "",
          old_certificate_number: "",
          certificate_language: "",
          notes: "",
        },
      ],
    });
    expect(report.rows[0].status).toBe("READY");
    expect(report.rows[0].studentEmail).toBeNull();
  });
});

describe("admin import access", () => {
  it("blocks unauthenticated access to import", () => {
    expect(isProtectedAdminPath("/admin/import")).toBe(true);
    const result = resolveAdminSessionAccess({
      pathname: "/admin/import",
      userId: null,
      supabaseConfigured: true,
    });
    expect(result.allowed).toBe(false);
    expect(result.redirectTo).toContain("/admin/login");
  });

  it("allows authenticated sessions through the middleware session gate", () => {
    const result = resolveAdminSessionAccess({
      pathname: "/admin/import",
      userId: "admin-user",
      supabaseConfigured: true,
    });
    expect(result.allowed).toBe(true);
  });

  it("refuses non-admin via import actions requireAdminClient pattern", () => {
    const actionsPath = path.resolve(
      process.cwd(),
      "src/app/admin/(console)/import/actions.ts",
    );
    const source = readFileSync(actionsPath, "utf8");
    expect(source).toMatch(/getAdminAccess/);
    expect(source).toMatch(/Access denied/);
  });
});

describe("admin import commit", () => {
  function readyRow(overrides: Partial<PreviewRow> = {}): PreviewRow {
    const fingerprint = buildImportFingerprint({
      studentName: "Ada Lovelace",
      studentEmail: "ada@example.com",
      courseTitle: "Foundations of Metaphysics",
      completedAt: "2024-01-10",
      oldCertificateNumber: "CERT-1",
    });
    return {
      rowNumber: 2,
      studentName: "Ada Lovelace",
      studentEmail: "ada@example.com",
      studentPhone: null,
      courseTitle: "Foundations of Metaphysics",
      completedAt: "2024-01-10",
      oldCertificateNumber: "CERT-1",
      certificateLanguage: "en",
      notes: null,
      matchedCourseId: "course-1",
      matchedCourseTitle: "Foundations of Metaphysics",
      status: "READY",
      messages: [],
      importFingerprint: fingerprint,
      hasCompletion: true,
      ...overrides,
    };
  }

  function studentOnlyRow(overrides: Partial<PreviewRow> = {}): PreviewRow {
    return {
      rowNumber: 2,
      studentName: "Ada Lovelace",
      studentEmail: "ada@example.com",
      studentPhone: null,
      courseTitle: "",
      completedAt: null,
      oldCertificateNumber: null,
      certificateLanguage: null,
      notes: null,
      matchedCourseId: null,
      matchedCourseTitle: null,
      status: "READY",
      messages: [],
      importFingerprint: null,
      hasCompletion: false,
      ...overrides,
    };
  }

  type SeededStudent = { id: string; email: string };

  type InsertedCompletion = {
    legacy_student_id: string;
    course_id: string | null;
    course_title_original: string;
    completed_at: string;
    old_certificate_number: string | null;
    certificate_language: "en" | "ar" | null;
    import_fingerprint: string;
  };

  function createMockClient(
    seedFingerprints: string[] = [],
    options: { existingStudents?: SeededStudent[] } = {},
  ) {
    const fingerprints = new Set(seedFingerprints);
    const studentsByEmail = new Map(
      (options.existingStudents ?? []).map((student) => [
        student.email,
        student.id,
      ]),
    );
    const createdStudentIds: string[] = [];
    const completions: InsertedCompletion[] = [];
    let studentSeq = 0;
    const tablesTouched = new Set<string>();

    const client = {
      from(table: string) {
        tablesTouched.add(table);
        if (table === "legacy_course_completions") {
          return {
            select() {
              return {
                eq(_column: string, value: string) {
                  return {
                    maybeSingle: async () => ({
                      data: fingerprints.has(value) ? { id: "existing" } : null,
                      error: null,
                    }),
                  };
                },
              };
            },
            insert: async (payload: InsertedCompletion) => {
              if (fingerprints.has(payload.import_fingerprint)) {
                return { error: { code: "23505" } };
              }
              fingerprints.add(payload.import_fingerprint);
              completions.push(payload);
              return { error: null };
            },
          };
        }

        if (table === "legacy_students") {
          return {
            select() {
              return {
                eq(_column: string, value: string) {
                  return {
                    maybeSingle: async () => ({
                      data: studentsByEmail.has(value)
                        ? { id: studentsByEmail.get(value) }
                        : null,
                      error: null,
                    }),
                  };
                },
              };
            },
            insert(payload: { email: string | null }) {
              return {
                select() {
                  return {
                    single: async () => {
                      if (payload.email && studentsByEmail.has(payload.email)) {
                        return {
                          data: null,
                          error: { code: "23505", message: "duplicate email" },
                        };
                      }
                      studentSeq += 1;
                      const id = `student-${studentSeq}`;
                      createdStudentIds.push(id);
                      if (payload.email) {
                        studentsByEmail.set(payload.email, id);
                      }
                      return { data: { id }, error: null };
                    },
                  };
                },
              };
            },
            update() {
              return {
                eq: async () => ({ error: null }),
              };
            },
          };
        }

        if (table === "profiles") {
          return {
            select() {
              return {
                eq() {
                  return {
                    eq() {
                      return {
                        maybeSingle: async () => ({ data: null, error: null }),
                      };
                    },
                  };
                },
              };
            },
          };
        }

        throw new Error(`Unexpected table ${table}`);
      },
    };

    return {
      client,
      getCompletionCount: () => completions.length,
      getStudentCount: () => createdStudentIds.length,
      getCreatedStudentIds: () => createdStudentIds,
      getCompletions: () => completions,
      fingerprints,
      tablesTouched,
    };
  }

  function saraReadyRow(overrides: Partial<PreviewRow> = {}): PreviewRow {
    const studentName = overrides.studentName ?? "Sara Benali";
    const studentEmail = overrides.studentEmail ?? "sara.benali@example.com";
    const courseTitle = overrides.courseTitle ?? "Foundations of Metaphysics";
    const completedAt = overrides.completedAt ?? "2024-03-01";
    const oldCertificateNumber = overrides.oldCertificateNumber ?? null;
    const fingerprint =
      overrides.importFingerprint ??
      buildImportFingerprint({
        studentName,
        studentEmail,
        courseTitle,
        completedAt,
        oldCertificateNumber,
      });
    return {
      rowNumber: 2,
      studentName,
      studentEmail,
      studentPhone: null,
      courseTitle,
      completedAt,
      oldCertificateNumber,
      certificateLanguage: "en",
      notes: null,
      matchedCourseId: "course-1",
      matchedCourseTitle: "Foundations of Metaphysics",
      status: "READY",
      messages: [],
      importFingerprint: fingerprint,
      hasCompletion: true,
      ...overrides,
    };
  }

  it("creates a new student and completion together", async () => {
    const mock = createMockClient();
    const result = await commitLegacyImport({
      client: mock.client as never,
      rows: [saraReadyRow()],
      mode: "ready_only",
    });
    expect(result.ok).toBe(true);
    expect(result.studentsCreated).toBe(1);
    expect(result.existingStudentsMatched).toBe(0);
    expect(result.courseCompletionsCreated).toBe(1);
    expect(mock.getStudentCount()).toBe(1);
    expect(mock.getCompletionCount()).toBe(1);
    expect(mock.getCompletions()[0]).toMatchObject({
      legacy_student_id: mock.getCreatedStudentIds()[0],
      course_id: "course-1",
      course_title_original: "Foundations of Metaphysics",
      completed_at: "2024-03-01",
      old_certificate_number: null,
      certificate_language: "en",
    });
    expect(mock.getCompletions()[0].import_fingerprint).toBeTruthy();
  });

  it("attaches a new completion to an existing legacy student without creating another student", async () => {
    const mock = createMockClient([], {
      existingStudents: [
        { id: "legacy-sara", email: "sara.benali@example.com" },
      ],
    });
    const result = await commitLegacyImport({
      client: mock.client as never,
      rows: [saraReadyRow()],
      mode: "ready_only",
    });
    expect(result.ok).toBe(true);
    expect(result.studentsCreated).toBe(0);
    expect(result.existingStudentsMatched).toBe(1);
    expect(result.courseCompletionsCreated).toBe(1);
    expect(mock.getStudentCount()).toBe(0);
    expect(mock.getCompletionCount()).toBe(1);
    expect(mock.getCompletions()[0].legacy_student_id).toBe("legacy-sara");
  });

  it("skips an existing student when the completion fingerprint already exists", async () => {
    const row = saraReadyRow();
    const mock = createMockClient([row.importFingerprint!], {
      existingStudents: [
        { id: "legacy-sara", email: "sara.benali@example.com" },
      ],
    });
    const result = await commitLegacyImport({
      client: mock.client as never,
      rows: [row],
      mode: "ready_only",
    });
    expect(result.ok).toBe(true);
    expect(result.studentsCreated).toBe(0);
    expect(result.courseCompletionsCreated).toBe(0);
    expect(result.duplicatesSkipped).toBeGreaterThanOrEqual(1);
    expect(mock.getStudentCount()).toBe(0);
    expect(mock.getCompletionCount()).toBe(0);
  });

  it("allows a second historical course or date for the same existing student", async () => {
    const first = saraReadyRow({ completedAt: "2024-03-01" });
    const second = saraReadyRow({
      rowNumber: 3,
      completedAt: "2024-06-15",
    });
    expect(second.importFingerprint).not.toBe(first.importFingerprint);

    const mock = createMockClient([first.importFingerprint!], {
      existingStudents: [
        { id: "legacy-sara", email: "sara.benali@example.com" },
      ],
    });
    const result = await commitLegacyImport({
      client: mock.client as never,
      rows: [second],
      mode: "ready_only",
    });
    expect(result.ok).toBe(true);
    expect(result.studentsCreated).toBe(0);
    expect(result.courseCompletionsCreated).toBe(1);
    expect(mock.getStudentCount()).toBe(0);
    expect(mock.getCompletionCount()).toBe(1);
    expect(mock.getCompletions()[0]).toMatchObject({
      legacy_student_id: "legacy-sara",
      completed_at: "2024-06-15",
      import_fingerprint: second.importFingerprint,
    });
  });

  it("never creates two legacy students for the same email", async () => {
    const first = saraReadyRow({ completedAt: "2024-03-01" });
    const second = saraReadyRow({
      rowNumber: 3,
      completedAt: "2024-06-15",
    });
    const mock = createMockClient();
    const result = await commitLegacyImport({
      client: mock.client as never,
      rows: [first, second],
      mode: "ready_only",
    });
    expect(result.ok).toBe(true);
    expect(result.studentsCreated).toBe(1);
    expect(result.courseCompletionsCreated).toBe(2);
    expect(mock.getStudentCount()).toBe(1);
    expect(mock.getCompletionCount()).toBe(2);
    expect(
      new Set(mock.getCompletions().map((row) => row.legacy_student_id)).size,
    ).toBe(1);
  });

  it("confirm guards keep a new completion READY on an existing email", () => {
    const row = saraReadyRow();
    const guarded = applyConfirmImportGuards([row], {
      existingEmails: new Set(["sara.benali@example.com"]),
      existingFingerprints: new Set(),
    });
    expect(guarded[0].status).toBe("READY");
    expect(guarded[0].hasCompletion).toBe(true);
    expect(guarded[0].messages.join(" ")).toMatch(/reused/i);
  });

  it("confirm guards still skip student-only existing emails", () => {
    const guarded = applyConfirmImportGuards(
      [studentOnlyRow({ studentEmail: "sara.benali@example.com" })],
      {
        existingEmails: new Set(["sara.benali@example.com"]),
        existingFingerprints: new Set(),
      },
    );
    expect(guarded[0].status).toBe("EXISTING");
  });

  it("second identical import creates no duplicate completion", async () => {
    const row = readyRow();
    const first = createMockClient();
    const firstResult = await commitLegacyImport({
      client: first.client as never,
      rows: [row],
      mode: "ready_only",
    });
    expect(firstResult.ok).toBe(true);
    expect(firstResult.courseCompletionsCreated).toBe(1);

    const second = createMockClient([...first.fingerprints]);
    const secondResult = await commitLegacyImport({
      client: second.client as never,
      rows: [row],
      mode: "ready_only",
    });
    expect(secondResult.ok).toBe(true);
    expect(secondResult.courseCompletionsCreated).toBe(0);
    expect(second.getCompletionCount()).toBe(0);
    expect(secondResult.duplicatesSkipped).toBeGreaterThanOrEqual(1);
  });

  it("never imports INVALID rows", async () => {
    const mock = createMockClient();
    const result = await commitLegacyImport({
      client: mock.client as never,
      rows: [
        studentOnlyRow({
          status: "INVALID",
          messages: ["Missing full_name / student_name."],
        }),
      ],
      mode: "ready_only",
    });
    expect(result.studentsCreated).toBe(0);
    expect(result.invalid).toBe(1);
    expect(mock.getStudentCount()).toBe(0);
  });

  it("skips EXISTING rows and reports existing summary", async () => {
    const mock = createMockClient();
    const result = await commitLegacyImport({
      client: mock.client as never,
      rows: [
        studentOnlyRow({ status: "EXISTING", messages: ["Existing student"] }),
        studentOnlyRow({
          studentEmail: "new@example.com",
          status: "READY",
        }),
      ],
      mode: "ready_only",
    });
    expect(result.ok).toBe(true);
    expect(result.imported).toBe(1);
    expect(result.existing).toBe(1);
    expect(result.invalid).toBe(0);
  });

  it("imports student-only rows without creating certificates or Student Pass", async () => {
    const mock = createMockClient();
    const result = await commitLegacyImport({
      client: mock.client as never,
      rows: [studentOnlyRow()],
      mode: "ready_only",
    });
    expect(result.ok).toBe(true);
    expect(result.imported).toBe(1);
    expect(result.courseCompletionsCreated).toBe(0);
    expect(mock.tablesTouched.has("legacy_students")).toBe(true);
    expect(mock.tablesTouched.has("student_pass_subscriptions")).toBe(false);
    expect(mock.tablesTouched.has("certificates")).toBe(false);
  });

  it("commit source never writes Student Pass or certificates", () => {
    const commitPath = path.resolve(
      process.cwd(),
      "src/lib/admin/import/commit.ts",
    );
    const source = readFileSync(commitPath, "utf8");
    expect(source).not.toMatch(/student_pass_subscriptions/);
    expect(source).not.toMatch(/from\("certificates"\)/);
    expect(source).not.toMatch(/auth\.admin\.createUser/);
  });
});
