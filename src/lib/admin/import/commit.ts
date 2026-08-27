import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ConfirmImportMode,
  ImportCommitResult,
  PreviewRow,
} from "@/lib/admin/import/types";
import type { Database } from "@/types/database";

type AdminClient = SupabaseClient<Database>;

function emptyResult(partial?: Partial<ImportCommitResult>): ImportCommitResult {
  return {
    ok: false,
    rowsProcessed: 0,
    studentsCreated: 0,
    existingStudentsMatched: 0,
    courseCompletionsCreated: 0,
    duplicatesSkipped: 0,
    warningsImported: 0,
    errorsSkipped: 0,
    imported: 0,
    existing: 0,
    invalid: 0,
    errorRows: [],
    ...partial,
  };
}

function withSummary(
  result: Omit<ImportCommitResult, "imported" | "existing" | "invalid"> &
    Partial<Pick<ImportCommitResult, "imported" | "existing" | "invalid">>,
): ImportCommitResult {
  return {
    ...result,
    imported: result.imported ?? result.studentsCreated,
    existing: result.existing ?? result.duplicatesSkipped,
    invalid: result.invalid ?? result.errorsSkipped,
  };
}

/**
 * Commits preview rows after admin confirmation.
 * INVALID / EXISTING / DUPLICATE rows are never inserted as new students.
 * READY rows may attach a new historical completion to an existing email.
 * WARNING rows only when mode === 'ready_and_warnings'.
 *
 * Never creates Supabase Auth users, Student Pass rows, or certificates.
 * Idempotent via email uniqueness + import_fingerprint when completions exist.
 */
export async function commitLegacyImport(options: {
  client: AdminClient;
  rows: PreviewRow[];
  mode: ConfirmImportMode;
}): Promise<ImportCommitResult> {
  const { client, rows, mode } = options;

  const errorRows = rows
    .filter((row) => row.status === "INVALID")
    .map((row) => ({
      rowNumber: row.rowNumber,
      studentName: row.studentName,
      courseTitle: row.courseTitle,
      messages: row.messages,
    }));

  const importable = rows.filter((row) => {
    if (row.status === "READY") return true;
    if (row.status === "WARNING" && mode === "ready_and_warnings") return true;
    return false;
  });

  let duplicatesSkipped = rows.filter(
    (r) => r.status === "EXISTING" || r.status === "DUPLICATE",
  ).length;
  const errorsSkipped = rows.filter((r) => r.status === "INVALID").length;

  let studentsCreated = 0;
  let existingStudentsMatched = 0;
  let courseCompletionsCreated = 0;
  let warningsImported = 0;

  const studentCache = new Map<string, string>();
  const matchedEmails = new Set<string>();
  const createdEmails = new Set<string>();

  try {
    for (const row of importable) {
      if (row.hasCompletion) {
        if (!row.importFingerprint || !row.completedAt) {
          continue;
        }

        const { data: existingCompletion } = await client
          .from("legacy_course_completions")
          .select("id")
          .eq("import_fingerprint", row.importFingerprint)
          .maybeSingle();

        if (existingCompletion) {
          duplicatesSkipped += 1;
          continue;
        }
      }

      let legacyStudentId: string;
      const email = row.studentEmail;

      if (email) {
        const cacheKey = `email:${email}`;
        const cached = studentCache.get(cacheKey);
        if (cached) {
          legacyStudentId = cached;
        } else {
          const { data: byEmail } = await client
            .from("legacy_students")
            .select("id")
            .eq("email", email)
            .maybeSingle();

          const { data: profile } = await client
            .from("profiles")
            .select("id")
            .eq("email", email)
            .eq("role", "student")
            .maybeSingle();

          if (byEmail) {
            legacyStudentId = byEmail.id;
            if (!matchedEmails.has(email) && !createdEmails.has(email)) {
              existingStudentsMatched += 1;
              matchedEmails.add(email);
            }
            studentCache.set(cacheKey, byEmail.id);
            if (!row.hasCompletion) {
              duplicatesSkipped += 1;
              continue;
            }
          } else {
            const { data: created, error: createError } = await client
              .from("legacy_students")
              .insert({
                full_name: row.studentName,
                email,
                phone: row.studentPhone,
                notes: row.notes,
                linked_profile_id: profile?.id ?? null,
              })
              .select("id")
              .single();

            if (createError?.code === "23505") {
              const { data: existingAfterConflict } = await client
                .from("legacy_students")
                .select("id")
                .eq("email", email)
                .maybeSingle();
              if (!existingAfterConflict) {
                return withSummary(
                  emptyResult({
                    error: "Failed to create legacy student record.",
                    errorRows,
                    duplicatesSkipped,
                    errorsSkipped,
                    studentsCreated,
                    existingStudentsMatched,
                    courseCompletionsCreated,
                    warningsImported,
                  }),
                );
              }
              legacyStudentId = existingAfterConflict.id;
              if (!matchedEmails.has(email) && !createdEmails.has(email)) {
                existingStudentsMatched += 1;
                matchedEmails.add(email);
              }
              studentCache.set(cacheKey, existingAfterConflict.id);
              if (!row.hasCompletion) {
                duplicatesSkipped += 1;
                continue;
              }
            } else if (createError || !created) {
              return withSummary(
                emptyResult({
                  error: "Failed to create legacy student record.",
                  errorRows,
                  duplicatesSkipped,
                  errorsSkipped,
                  studentsCreated,
                  existingStudentsMatched,
                  courseCompletionsCreated,
                  warningsImported,
                }),
              );
            } else {
              legacyStudentId = created.id;
              studentsCreated += 1;
              createdEmails.add(email);
              studentCache.set(cacheKey, created.id);
              if (profile && !matchedEmails.has(email)) {
                existingStudentsMatched += 1;
                matchedEmails.add(email);
              }
            }
          }
        }
      } else {
        const { data: created, error: createError } = await client
          .from("legacy_students")
          .insert({
            full_name: row.studentName,
            email: null,
            phone: row.studentPhone,
            notes: row.notes,
            linked_profile_id: null,
          })
          .select("id")
          .single();

        if (createError || !created) {
          return withSummary(
            emptyResult({
              error: "Failed to create legacy student record.",
              errorRows,
              duplicatesSkipped,
              errorsSkipped,
              studentsCreated,
              existingStudentsMatched,
              courseCompletionsCreated,
              warningsImported,
            }),
          );
        }

        legacyStudentId = created.id;
        studentsCreated += 1;
      }

      if (row.hasCompletion && row.importFingerprint && row.completedAt) {
        const { error: completionError } = await client
          .from("legacy_course_completions")
          .insert({
            legacy_student_id: legacyStudentId,
            course_id: row.matchedCourseId,
            course_title_original: row.courseTitle,
            completed_at: row.completedAt,
            old_certificate_number: row.oldCertificateNumber,
            certificate_language: row.certificateLanguage,
            import_fingerprint: row.importFingerprint,
          });

        if (completionError) {
          if (completionError.code === "23505") {
            duplicatesSkipped += 1;
            continue;
          }
          return withSummary(
            emptyResult({
              error: "Failed to create course completion record.",
              errorRows,
              studentsCreated,
              existingStudentsMatched,
              courseCompletionsCreated,
              duplicatesSkipped,
              errorsSkipped,
              warningsImported,
            }),
          );
        }

        courseCompletionsCreated += 1;
      }

      if (row.status === "WARNING") {
        warningsImported += 1;
      }
    }

    return withSummary({
      ok: true,
      rowsProcessed: rows.length,
      studentsCreated,
      existingStudentsMatched,
      courseCompletionsCreated,
      duplicatesSkipped,
      warningsImported,
      errorsSkipped,
      errorRows,
      imported: studentsCreated,
      existing: duplicatesSkipped,
      invalid: errorsSkipped,
    });
  } catch {
    return withSummary(
      emptyResult({
        error: "Import failed unexpectedly.",
        errorRows,
        studentsCreated,
        existingStudentsMatched,
        courseCompletionsCreated,
        duplicatesSkipped,
        errorsSkipped,
        warningsImported,
      }),
    );
  }
}

export function buildErrorCsv(
  errorRows: ImportCommitResult["errorRows"],
): string {
  const header = "row_number,student_name,course_title,messages";
  const lines = errorRows.map((row) => {
    const messages = row.messages.join("; ").replace(/"/g, '""');
    const name = row.studentName.replace(/"/g, '""');
    const course = row.courseTitle.replace(/"/g, '""');
    return `${row.rowNumber},"${name}","${course}","${messages}"`;
  });
  return `${header}\n${lines.join("\n")}\n`;
}
