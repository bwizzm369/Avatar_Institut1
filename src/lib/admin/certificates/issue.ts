import type { SupabaseClient } from "@supabase/supabase-js";
import { issuedAtYear } from "@/lib/certificates/number";
import { normalizeWhitespace } from "@/lib/admin/import/normalize";
import { isAdminRole } from "@/lib/admin/guards";
import type { CertificateDuplicateLookup } from "@/lib/admin/certificates/types";
import {
  asLocale,
  courseTitlesFromRegistry,
  duplicateLookupsForCompletion,
  duplicateLookupsForEnrollment,
  findBlockingCertificate,
  parseHolderKey,
  parseIssuedAtDate,
  parseIssueLanguage,
  parseItemKey,
  publicHolderDisplayNameFromLegacy,
  publicHolderDisplayNameFromProfile,
} from "@/lib/admin/certificates/query";
import type { Database } from "@/types/database";
import type { Locale } from "@/types";

export type CertificateIssueContext = "student" | "admin";

export type IssueCertificateInput = {
  holderKey: string;
  itemKey: string;
  issuedAt: string;
  language: string | null;
  oldCertificateNumber: string | null;
};

export type PreparedCertificateIssuance = {
  issuedAt: string;
  year: number;
  courseId: string | null;
  profileId: string | null;
  legacyStudentId: string | null;
  enrollmentId: string | null;
  legacyCompletionId: string | null;
  oldCertificateNumber: string | null;
  language: Locale | null;
  holderDisplayName: string;
  courseTitleAr: string;
  courseTitleEn: string;
};

export type IssueCertificateSuccess = {
  ok: true;
  alreadyExisted: false;
  certificateNumber: string;
  holderDisplayName: string;
  courseTitleEn: string;
  courseTitleAr: string;
  issuedAt: string;
  status: "issued";
};

export type IssueCertificateFailure = {
  ok: false;
  error: string;
  alreadyExists?: boolean;
  certificateNumber?: string;
};

export type IssueCertificateResult =
  | IssueCertificateSuccess
  | IssueCertificateFailure;

export type CertificateDuplicateRow = {
  certificateNumber: string;
  legacyCompletionId: string | null;
  profileId: string | null;
  legacyStudentId: string | null;
  courseId: string | null;
};

export type IssueRpcRow = {
  certificate_number: string;
  already_existed: boolean;
  status: string;
  holder_display_name: string;
  course_title_en: string;
  course_title_ar: string;
  issued_at: string;
};

export type CertificateIssueStore = {
  loadEnrollment: (id: string) => Promise<{
    id: string;
    user_id: string;
    course_id: string;
    status: string;
  } | null>;
  loadCompletion: (id: string) => Promise<{
    id: string;
    legacy_student_id: string;
    course_id: string | null;
    course_title_original: string;
    old_certificate_number: string | null;
    certificate_language: string | null;
  } | null>;
  loadProfile: (id: string) => Promise<{
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    locale: string;
    role: string;
  } | null>;
  loadLegacyStudent: (id: string) => Promise<{
    id: string;
    full_name: string;
    linked_profile_id: string | null;
  } | null>;
  loadCourse: (
    id: string,
  ) => Promise<{ id: string; title_en: string; title_ar: string } | null>;
  listLinkedLegacyIds: (profileId: string) => Promise<string[]>;
  findDuplicates: (
    lookups: CertificateDuplicateLookup[],
  ) => Promise<CertificateDuplicateRow[]>;
  issueAtomic: (
    payload: PreparedCertificateIssuance,
  ) => Promise<{
    data: IssueRpcRow | null;
    error: { code?: string; message?: string } | null;
  }>;
};

export function canIssueCertificate(context: CertificateIssueContext): boolean {
  return context === "admin";
}

export function assertCanIssueCertificate(
  context: CertificateIssueContext,
): IssueCertificateFailure | null {
  if (!canIssueCertificate(context)) {
    return { ok: false, error: "Access denied." };
  }
  return null;
}

export function mapIssueCertificateError(error: {
  code?: string;
  message?: string;
}): IssueCertificateFailure {
  const code = error.code ?? "";
  const message = (error.message ?? "").toLowerCase();

  if (code === "42501" || message.includes("not authorized")) {
    return { ok: false, error: "Access denied." };
  }
  if (
    code === "23505" ||
    message.includes("already exists") ||
    message.includes("duplicate")
  ) {
    const numbered = /AVT-\d{4}-\d{6}/.exec(error.message ?? "");
    return {
      ok: false,
      error: "Certificate already exists",
      alreadyExists: true,
      certificateNumber: numbered?.[0],
    };
  }
  if (
    message.includes("does not exist") ||
    message.includes("schema cache") ||
    code === "PGRST202"
  ) {
    return {
      ok: false,
      error: "Certificate issuance is not available on the database yet.",
    };
  }
  if (message.includes("invalid issue date")) {
    return { ok: false, error: "Invalid issue date." };
  }
  if (message.includes("holder display name is required")) {
    return {
      ok: false,
      error: "A public holder name is required before issuing a certificate.",
    };
  }
  if (
    message.includes("holder is required") ||
    message.includes("profile not found") ||
    message.includes("legacy student not found")
  ) {
    return { ok: false, error: "Student not found." };
  }
  if (
    message.includes("enrollment not found") ||
    message.includes("completion not found") ||
    message.includes("does not match the student") ||
    message.includes("does not match the course") ||
    message.includes("not linked to this profile")
  ) {
    return {
      ok: false,
      error: "Course or completion does not belong to this student.",
    };
  }
  if (message.includes("course not found")) {
    return { ok: false, error: "Course not found." };
  }
  return { ok: false, error: "Could not issue the certificate." };
}

function belongsToHolder(options: {
  holderKind: "modern" | "legacy";
  holderId: string;
  profileId: string | null;
  linkedProfileId: string | null;
  legacyStudentId: string | null;
  linkedLegacyIds: string[];
}): boolean {
  if (options.holderKind === "modern") {
    return (
      options.profileId === options.holderId ||
      options.linkedProfileId === options.holderId
    );
  }
  return (
    options.legacyStudentId === options.holderId ||
    options.linkedLegacyIds.includes(options.holderId)
  );
}

export async function prepareCertificateIssuance(
  store: CertificateIssueStore,
  input: IssueCertificateInput,
): Promise<
  { ok: true; prepared: PreparedCertificateIssuance } | IssueCertificateFailure
> {
  const holder = parseHolderKey(input.holderKey);
  const item = parseItemKey(input.itemKey);
  if (!holder) {
    return { ok: false, error: "Student not found." };
  }
  if (!item) {
    return { ok: false, error: "Course or completion not found." };
  }

  const issuedAt = parseIssuedAtDate(input.issuedAt);
  if (!issuedAt) {
    return { ok: false, error: "Invalid issue date." };
  }

  const language = parseIssueLanguage(input.language);
  if (language === undefined) {
    return { ok: false, error: "Invalid certificate language." };
  }

  const oldCertificateNumber = (() => {
    const value = normalizeWhitespace(input.oldCertificateNumber ?? "");
    return value || null;
  })();

  if (item.source === "enrollment") {
    const enrollment = await store.loadEnrollment(item.id);
    if (!enrollment) {
      return { ok: false, error: "Course or completion not found." };
    }
    const profile = await store.loadProfile(enrollment.user_id);
    if (!profile || isAdminRole(profile.role)) {
      return { ok: false, error: "Student not found." };
    }
    const linkedLegacyIds = await store.listLinkedLegacyIds(profile.id);
    if (
      !belongsToHolder({
        holderKind: holder.kind,
        holderId: holder.id,
        profileId: profile.id,
        linkedProfileId: profile.id,
        legacyStudentId: linkedLegacyIds[0] ?? null,
        linkedLegacyIds,
      })
    ) {
      return {
        ok: false,
        error: "Course or completion does not belong to this student.",
      };
    }
    const course = await store.loadCourse(enrollment.course_id);
    if (!course) {
      return { ok: false, error: "Course not found." };
    }
    const titles = courseTitlesFromRegistry(course.id, [course], null);
    const legacyStudentId =
      holder.kind === "legacy"
        ? holder.id
        : linkedLegacyIds.length === 1
          ? linkedLegacyIds[0]
          : null;
    const lookups = duplicateLookupsForEnrollment({
      profileId: profile.id,
      courseId: course.id,
      linkedLegacyStudentIds: linkedLegacyIds,
    });
    const duplicates = await store.findDuplicates(lookups);
    const blocking = findBlockingCertificate(duplicates, lookups);
    if (blocking) {
      return {
        ok: false,
        error: "Certificate already exists",
        alreadyExists: true,
        certificateNumber: blocking.certificateNumber,
      };
    }
    const holderDisplayName = publicHolderDisplayNameFromProfile(profile);
    if (!holderDisplayName) {
      return {
        ok: false,
        error: "A public holder name is required before issuing a certificate.",
      };
    }
    return {
      ok: true,
      prepared: {
        issuedAt,
        year: issuedAtYear(issuedAt),
        courseId: course.id,
        profileId: profile.id,
        legacyStudentId,
        enrollmentId: enrollment.id,
        legacyCompletionId: null,
        oldCertificateNumber,
        language: language ?? asLocale(profile.locale),
        holderDisplayName,
        courseTitleAr: titles.courseTitleAr,
        courseTitleEn: titles.courseTitleEn,
      },
    };
  }

  const completion = await store.loadCompletion(item.id);
  if (!completion) {
    return { ok: false, error: "Course or completion not found." };
  }
  const legacy = await store.loadLegacyStudent(completion.legacy_student_id);
  if (!legacy) {
    return { ok: false, error: "Student not found." };
  }
  const linkedLegacyIds = legacy.linked_profile_id
    ? await store.listLinkedLegacyIds(legacy.linked_profile_id)
    : [legacy.id];
  if (
    !belongsToHolder({
      holderKind: holder.kind,
      holderId: holder.id,
      profileId: legacy.linked_profile_id,
      linkedProfileId: legacy.linked_profile_id,
      legacyStudentId: legacy.id,
      linkedLegacyIds,
    })
  ) {
    return {
      ok: false,
      error: "Course or completion does not belong to this student.",
    };
  }

  const course = completion.course_id
    ? await store.loadCourse(completion.course_id)
    : null;
  if (completion.course_id && !course) {
    return { ok: false, error: "Course not found." };
  }
  const titles = courseTitlesFromRegistry(
    completion.course_id,
    course ? [course] : [],
    completion.course_title_original,
  );
  if (!titles.courseTitleAr.trim() && !titles.courseTitleEn.trim()) {
    return { ok: false, error: "Course not found." };
  }

  const lookups = duplicateLookupsForCompletion({
    legacyCompletionId: completion.id,
    legacyStudentId: legacy.id,
    courseId: completion.course_id,
    linkedProfileId: legacy.linked_profile_id,
  });
  const duplicates = await store.findDuplicates(lookups);
  const blocking = findBlockingCertificate(duplicates, lookups);
  if (blocking) {
    return {
      ok: false,
      error: "Certificate already exists",
      alreadyExists: true,
      certificateNumber: blocking.certificateNumber,
    };
  }

  const holderDisplayName = publicHolderDisplayNameFromLegacy(legacy.full_name);
  if (!holderDisplayName) {
    return {
      ok: false,
      error: "A public holder name is required before issuing a certificate.",
    };
  }

  return {
    ok: true,
    prepared: {
      issuedAt,
      year: issuedAtYear(issuedAt),
      courseId: completion.course_id,
      profileId: legacy.linked_profile_id,
      legacyStudentId: legacy.id,
      enrollmentId: null,
      legacyCompletionId: completion.id,
      oldCertificateNumber:
        oldCertificateNumber ?? completion.old_certificate_number,
      language: language ?? asLocale(completion.certificate_language),
      holderDisplayName,
      courseTitleAr: titles.courseTitleAr,
      courseTitleEn: titles.courseTitleEn,
    },
  };
}

export async function issueCertificate(options: {
  store: CertificateIssueStore;
  context: CertificateIssueContext;
  input: IssueCertificateInput;
}): Promise<IssueCertificateResult> {
  const denied = assertCanIssueCertificate(options.context);
  if (denied) return denied;

  const prepared = await prepareCertificateIssuance(
    options.store,
    options.input,
  );
  if (!prepared.ok) return prepared;

  return issuePreparedCertificate(options.store, prepared.prepared);
}

/**
 * Calls the existing issue_certificate RPC through the shared store.
 * Admin UI reaches this only after assertCanIssueCertificate("admin").
 * Modern auto-issue reaches this only after 100% enrollment eligibility,
 * using a service-role store — never a student JWT.
 */
export async function issuePreparedCertificate(
  store: Pick<CertificateIssueStore, "issueAtomic">,
  prepared: PreparedCertificateIssuance,
): Promise<IssueCertificateResult> {
  const { data, error } = await store.issueAtomic(prepared);
  if (error) {
    return mapIssueCertificateError(error);
  }
  if (!data?.certificate_number) {
    return { ok: false, error: "Could not issue the certificate." };
  }
  if (data.already_existed) {
    return {
      ok: false,
      error: "Certificate already exists",
      alreadyExists: true,
      certificateNumber: data.certificate_number,
    };
  }

  return {
    ok: true,
    alreadyExisted: false,
    certificateNumber: data.certificate_number,
    holderDisplayName: data.holder_display_name,
    courseTitleEn: data.course_title_en,
    courseTitleAr: data.course_title_ar,
    issuedAt: data.issued_at,
    status: "issued",
  };
}

type AdminClient = SupabaseClient<Database>;

function firstRpcRow(data: unknown): IssueRpcRow | null {
  if (Array.isArray(data)) {
    return (data[0] as IssueRpcRow | undefined) ?? null;
  }
  if (data && typeof data === "object") {
    return data as IssueRpcRow;
  }
  return null;
}

export function createCertificateIssueStore(
  client: AdminClient,
): CertificateIssueStore {
  return {
    async loadEnrollment(id) {
      const { data } = await client
        .from("enrollments")
        .select("id, user_id, course_id, status")
        .eq("id", id)
        .maybeSingle();
      return data;
    },
    async loadCompletion(id) {
      const { data } = await client
        .from("legacy_course_completions")
        .select(
          "id, legacy_student_id, course_id, course_title_original, old_certificate_number, certificate_language",
        )
        .eq("id", id)
        .maybeSingle();
      return data;
    },
    async loadProfile(id) {
      const { data } = await client
        .from("profiles")
        .select("id, email, first_name, last_name, locale, role")
        .eq("id", id)
        .maybeSingle();
      return data;
    },
    async loadLegacyStudent(id) {
      const { data } = await client
        .from("legacy_students")
        .select("id, full_name, linked_profile_id")
        .eq("id", id)
        .maybeSingle();
      return data;
    },
    async loadCourse(id) {
      const { data } = await client
        .from("courses")
        .select("id, title_en, title_ar")
        .eq("id", id)
        .maybeSingle();
      return data;
    },
    async listLinkedLegacyIds(profileId) {
      const { data } = await client
        .from("legacy_students")
        .select("id")
        .eq("linked_profile_id", profileId);
      return (data ?? []).map((row) => row.id);
    },
    async findDuplicates(lookups) {
      const rows: CertificateDuplicateRow[] = [];
      const seen = new Set<string>();

      const push = (
        row: {
          certificate_number: string;
          legacy_completion_id: string | null;
          profile_id: string | null;
          legacy_student_id: string | null;
          course_id: string | null;
        } | null,
      ) => {
        if (!row || seen.has(row.certificate_number)) return;
        seen.add(row.certificate_number);
        rows.push({
          certificateNumber: row.certificate_number,
          legacyCompletionId: row.legacy_completion_id,
          profileId: row.profile_id,
          legacyStudentId: row.legacy_student_id,
          courseId: row.course_id,
        });
      };

      for (const lookup of lookups) {
        if (lookup.kind === "legacy_completion") {
          const { data } = await client
            .from("certificates")
            .select(
              "certificate_number, legacy_completion_id, profile_id, legacy_student_id, course_id",
            )
            .eq("legacy_completion_id", lookup.legacyCompletionId)
            .maybeSingle();
          push(data);
        } else if (lookup.kind === "profile_course") {
          const { data } = await client
            .from("certificates")
            .select(
              "certificate_number, legacy_completion_id, profile_id, legacy_student_id, course_id",
            )
            .eq("profile_id", lookup.profileId)
            .eq("course_id", lookup.courseId)
            .maybeSingle();
          push(data);
        } else {
          const { data } = await client
            .from("certificates")
            .select(
              "certificate_number, legacy_completion_id, profile_id, legacy_student_id, course_id",
            )
            .eq("legacy_student_id", lookup.legacyStudentId)
            .eq("course_id", lookup.courseId)
            .maybeSingle();
          push(data);
        }
      }
      return rows;
    },
    async issueAtomic(payload) {
      const { data, error } = await client.rpc("issue_certificate", {
        p_issued_at: payload.issuedAt,
        p_course_id: payload.courseId,
        p_profile_id: payload.profileId,
        p_legacy_student_id: payload.legacyStudentId,
        p_enrollment_id: payload.enrollmentId,
        p_legacy_completion_id: payload.legacyCompletionId,
        p_old_certificate_number: payload.oldCertificateNumber,
        p_language: payload.language,
      });
      return { data: firstRpcRow(data), error };
    },
  };
}
