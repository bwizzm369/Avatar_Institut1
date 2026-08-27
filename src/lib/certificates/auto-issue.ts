import type { SupabaseClient } from "@supabase/supabase-js";
import { isAdminRole } from "@/lib/admin/guards";
import {
  issuePreparedCertificate,
  type CertificateIssueStore,
  type IssueCertificateResult,
} from "@/lib/admin/certificates/issue";
import {
  asLocale,
  courseTitlesFromRegistry,
  duplicateLookupsForEnrollment,
  findBlockingCertificate,
  parseIssuedAtDate,
  publicHolderDisplayNameFromProfile,
} from "@/lib/admin/certificates/query";
import { issuedAtYear } from "@/lib/certificates/number";
import {
  computeCourseProgress,
  isActiveEnrollmentRow,
} from "@/lib/learning/progress";
import type { Database, EnrollmentRow } from "@/types/database";

export type AutoIssueSkipReason =
  | "no_enrollment"
  | "enrollment_not_owned"
  | "enrollment_course_mismatch"
  | "enrollment_not_active"
  | "no_lessons"
  | "not_complete"
  | "already_issued"
  | "missing_holder_name"
  | "admin_profile"
  | "legacy_only"
  | "demo_course"
  | "course_not_found";

export type ModernCourseAutoIssueSnapshot = {
  actorUserId: string;
  courseId: string;
  enrollment: {
    id: string;
    user_id: string;
    course_id: string;
    status: string;
    payment_confirmed_at: string | null;
  } | null;
  lessonIds: string[];
  completedLessonIds: string[];
  existingCertificateNumber: string | null;
  holderDisplayName: string;
  profileRole: string;
  profileLocale: string | null;
  isDemo: boolean;
  legacyOnly: boolean;
  courseFound: boolean;
};

export type AutoIssueResult =
  | { status: "skipped"; reason: AutoIssueSkipReason }
  | { status: "issued"; certificateNumber: string }
  | { status: "already_issued"; certificateNumber?: string }
  | { status: "failed"; error: string };

export type ModernCourseAutoIssueStore = Pick<
  CertificateIssueStore,
  "loadCourse" | "listLinkedLegacyIds" | "findDuplicates" | "issueAtomic"
>;

/**
 * Pure eligibility for a modern enrollment certificate.
 * Does not allocate numbers or call issue_certificate.
 */
export function evaluateModernCourseAutoIssueEligibility(
  snapshot: ModernCourseAutoIssueSnapshot,
): { eligible: true } | { eligible: false; reason: AutoIssueSkipReason } {
  if (!snapshot.courseFound) {
    return { eligible: false, reason: "course_not_found" };
  }
  if (snapshot.legacyOnly) {
    return { eligible: false, reason: "legacy_only" };
  }
  if (snapshot.isDemo) {
    return { eligible: false, reason: "demo_course" };
  }
  if (isAdminRole(snapshot.profileRole)) {
    return { eligible: false, reason: "admin_profile" };
  }
  if (!snapshot.holderDisplayName.trim()) {
    return { eligible: false, reason: "missing_holder_name" };
  }

  const enrollment = snapshot.enrollment;
  if (!enrollment) {
    return { eligible: false, reason: "no_enrollment" };
  }
  if (enrollment.user_id !== snapshot.actorUserId) {
    return { eligible: false, reason: "enrollment_not_owned" };
  }
  if (enrollment.course_id !== snapshot.courseId) {
    return { eligible: false, reason: "enrollment_course_mismatch" };
  }
  if (!isActiveEnrollmentRow(enrollment)) {
    return { eligible: false, reason: "enrollment_not_active" };
  }

  if (snapshot.lessonIds.length === 0) {
    return { eligible: false, reason: "no_lessons" };
  }

  const completedSet = new Set(snapshot.completedLessonIds);
  const completedCount = snapshot.lessonIds.filter((id) =>
    completedSet.has(id),
  ).length;
  const progress = computeCourseProgress(
    snapshot.lessonIds.length,
    completedCount,
  );
  if (
    progress.percent < 100 ||
    completedCount !== snapshot.lessonIds.length
  ) {
    return { eligible: false, reason: "not_complete" };
  }

  if (snapshot.existingCertificateNumber) {
    return { eligible: false, reason: "already_issued" };
  }

  return { eligible: true };
}

export async function loadModernCourseAutoIssueSnapshot(
  client: SupabaseClient<Database>,
  input: {
    actorUserId: string;
    courseId: string;
    enrollment: Pick<
      EnrollmentRow,
      "id" | "user_id" | "course_id" | "status" | "payment_confirmed_at"
    > | null;
  },
): Promise<ModernCourseAutoIssueSnapshot> {
  const { data: courseRow } = await client
    .from("courses")
    .select("id, is_demo, legacy_only")
    .eq("id", input.courseId)
    .maybeSingle();

  const { data: profile } = await client
    .from("profiles")
    .select("first_name, last_name, locale, role")
    .eq("id", input.actorUserId)
    .maybeSingle();

  const { data: moduleRows } = await client
    .from("course_modules")
    .select("id")
    .eq("course_id", input.courseId);

  const moduleIds = (moduleRows ?? []).map((row) => row.id);
  let lessonIds: string[] = [];
  if (moduleIds.length > 0) {
    const { data: lessonRows } = await client
      .from("lessons")
      .select("id")
      .in("module_id", moduleIds);
    lessonIds = (lessonRows ?? []).map((row) => row.id);
  }

  const completedLessonIds: string[] = [];
  if (lessonIds.length > 0) {
    const { data: progressRows } = await client
      .from("lesson_progress")
      .select("lesson_id, completed")
      .eq("user_id", input.actorUserId)
      .eq("completed", true)
      .in("lesson_id", lessonIds);
    for (const row of progressRows ?? []) {
      if (row.completed) completedLessonIds.push(row.lesson_id);
    }
  }

  let existingCertificateNumber: string | null = null;
  const { data: certificateRows } = await client
    .from("certificates")
    .select("certificate_number")
    .eq("course_id", input.courseId)
    .limit(1);
  const firstCert = certificateRows?.[0];
  if (firstCert?.certificate_number) {
    existingCertificateNumber = firstCert.certificate_number;
  }

  return {
    actorUserId: input.actorUserId,
    courseId: input.courseId,
    enrollment: input.enrollment,
    lessonIds,
    completedLessonIds,
    existingCertificateNumber,
    holderDisplayName: profile
      ? publicHolderDisplayNameFromProfile(profile)
      : "",
    profileRole: profile?.role ?? "student",
    profileLocale: asLocale(profile?.locale ?? null),
    isDemo: courseRow?.is_demo === true,
    legacyOnly: courseRow?.legacy_only === true,
    courseFound: Boolean(courseRow),
  };
}

/**
 * Issues the official modern certificate after 100% completion.
 * createIssueStore must return a service-role store; it is not called unless
 * the snapshot is eligible. Students never receive this store.
 */
export async function maybeIssueModernCourseCertificate(options: {
  snapshot: ModernCourseAutoIssueSnapshot;
  issuedAt: string;
  createIssueStore: () => ModernCourseAutoIssueStore;
}): Promise<AutoIssueResult> {
  const eligibility = evaluateModernCourseAutoIssueEligibility(
    options.snapshot,
  );
  if (!eligibility.eligible) {
    if (eligibility.reason === "already_issued") {
      return {
        status: "already_issued",
        certificateNumber:
          options.snapshot.existingCertificateNumber ?? undefined,
      };
    }
    return { status: "skipped", reason: eligibility.reason };
  }

  const issuedAt = parseIssuedAtDate(options.issuedAt);
  if (!issuedAt) {
    return { status: "failed", error: "Invalid issue date." };
  }

  const store = options.createIssueStore();
  const linkedLegacyStudentIds = await store.listLinkedLegacyIds(
    options.snapshot.actorUserId,
  );
  const lookups = duplicateLookupsForEnrollment({
    profileId: options.snapshot.actorUserId,
    courseId: options.snapshot.courseId,
    linkedLegacyStudentIds,
  });
  const duplicates = await store.findDuplicates(lookups);
  const blocking = findBlockingCertificate(duplicates, lookups);
  if (blocking) {
    return {
      status: "already_issued",
      certificateNumber: blocking.certificateNumber,
    };
  }

  const course = await store.loadCourse(options.snapshot.courseId);
  if (!course) {
    return { status: "skipped", reason: "course_not_found" };
  }
  const titles = courseTitlesFromRegistry(course.id, [course], null);
  const enrollment = options.snapshot.enrollment;
  if (!enrollment) {
    return { status: "skipped", reason: "no_enrollment" };
  }

  const issued = await issuePreparedCertificate(store, {
      issuedAt,
      year: issuedAtYear(issuedAt),
      courseId: options.snapshot.courseId,
      profileId: options.snapshot.actorUserId,
      legacyStudentId:
        linkedLegacyStudentIds.length === 1
          ? linkedLegacyStudentIds[0]
          : null,
      enrollmentId: enrollment.id,
      legacyCompletionId: null,
      oldCertificateNumber: null,
      language: asLocale(options.snapshot.profileLocale),
      holderDisplayName: options.snapshot.holderDisplayName,
      courseTitleAr: titles.courseTitleAr,
      courseTitleEn: titles.courseTitleEn,
    },
  );

  return mapPreparedIssueResult(issued);
}

function mapPreparedIssueResult(issued: IssueCertificateResult): AutoIssueResult {
  if (issued.ok) {
    return { status: "issued", certificateNumber: issued.certificateNumber };
  }
  if (issued.alreadyExists) {
    return {
      status: "already_issued",
      certificateNumber: issued.certificateNumber,
    };
  }
  return { status: "failed", error: issued.error };
}

export function utcIssuedAtDate(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}
