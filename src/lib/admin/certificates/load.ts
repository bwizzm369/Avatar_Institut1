import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { normalizeWhitespace } from "@/lib/admin/import/normalize";
import {
  CERTIFICATE_ISSUANCE_ENABLED,
  type AdminCertificateCourseItem,
  type AdminCertificateHolder,
  type AdminCertificateListItem,
  type AdminCertificateStats,
  type AdminIssuancePreview,
} from "@/lib/admin/certificates/types";
import {
  asLocale,
  buildIssuancePreview,
  courseTitlesFromRegistry,
  duplicateLookupsForCompletion,
  duplicateLookupsForEnrollment,
  enrollmentStatusLabel,
  filterCertificates,
  findBlockingCertificate,
  formatHolderKey,
  formatItemKey,
  mapCertificateRow,
  parseHolderKey,
  parseItemKey,
  profileDisplayName,
  searchIssuanceHolders,
  summarizeCertificates,
  normalizeHolderSearchQuery,
} from "@/lib/admin/certificates/query";

const CERTIFICATE_LIST_COLUMNS =
  "id, certificate_number, status, issued_at, course_id, profile_id, legacy_student_id, enrollment_id, legacy_completion_id, old_certificate_number, language, holder_display_name, course_title_ar, course_title_en";

export type AdminCertificatesPageData = {
  stats: AdminCertificateStats;
  certificates: AdminCertificateListItem[];
  certificateQuery: string;
  studentQuery: string;
  holders: AdminCertificateHolder[];
  selectedHolder: AdminCertificateHolder | null;
  items: AdminCertificateCourseItem[];
  selectedItemKey: string | null;
  preview: AdminIssuancePreview | null;
  issuanceEnabled: boolean;
  proposedIssuedAt: string;
};

function emptyPage(
  certificateQuery: string,
  studentQuery: string,
  proposedIssuedAt: string,
): AdminCertificatesPageData {
  return {
    stats: { total: 0, issued: 0, revoked: 0 },
    certificates: [],
    certificateQuery,
    studentQuery,
    holders: [],
    selectedHolder: null,
    items: [],
    selectedItemKey: null,
    preview: null,
    issuanceEnabled: CERTIFICATE_ISSUANCE_ENABLED,
    proposedIssuedAt,
  };
}

function todayUtcDate(now: Date): string {
  return now.toISOString().slice(0, 10);
}

type LegacyStudentLite = {
  id: string;
  full_name: string;
  email: string | null;
  linked_profile_id: string | null;
};

type ProfileLite = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  locale: string;
};

function holdersFromRows(
  legacyRows: LegacyStudentLite[],
  profileRows: ProfileLite[],
): AdminCertificateHolder[] {
  const linkedProfileIds = new Set(
    legacyRows
      .map((row) => row.linked_profile_id)
      .filter((id): id is string => Boolean(id)),
  );
  const legacyEmails = new Set(
    legacyRows
      .map((row) => row.email?.toLowerCase() ?? null)
      .filter((email): email is string => Boolean(email)),
  );

  const holders: AdminCertificateHolder[] = legacyRows.map((row) => ({
    key: formatHolderKey("legacy", row.id),
    kind: "legacy",
    name: row.full_name,
    email: row.email,
    profileId: row.linked_profile_id,
    legacyStudentId: row.id,
    linkedProfileId: row.linked_profile_id,
  }));

  for (const profile of profileRows) {
    if (linkedProfileIds.has(profile.id)) continue;
    if (legacyEmails.has(profile.email.toLowerCase())) continue;
    holders.push({
      key: formatHolderKey("modern", profile.id),
      kind: "modern",
      name: profileDisplayName(profile),
      email: profile.email,
      profileId: profile.id,
      legacyStudentId: null,
      linkedProfileId: null,
    });
  }

  holders.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
  return holders;
}

export async function loadAdminCertificatesPage(options: {
  certificateQuery?: string;
  studentQuery?: string;
  holderKey?: string;
  itemKey?: string;
  now?: Date;
}): Promise<AdminCertificatesPageData> {
  const certificateQuery = normalizeWhitespace(options.certificateQuery ?? "");
  const studentQuery = normalizeHolderSearchQuery(options.studentQuery ?? "");
  const proposedIssuedAt = todayUtcDate(options.now ?? new Date());

  if (!isSupabaseConfigured()) {
    return emptyPage(certificateQuery, studentQuery, proposedIssuedAt);
  }

  const supabase = await createServerSupabaseClient();
  const parsedHolder = parseHolderKey(options.holderKey);
  const parsedItem = parseItemKey(options.itemKey);

  const { data: certificateRows } = await supabase
    .from("certificates")
    .select(CERTIFICATE_LIST_COLUMNS)
    .order("issued_at", { ascending: false });

  const mappedCertificates = (certificateRows ?? [])
    .map(mapCertificateRow)
    .filter((row): row is AdminCertificateListItem => row !== null);
  const stats = summarizeCertificates(mappedCertificates);
  const certificates = filterCertificates(mappedCertificates, certificateQuery);

  const needsHolders = Boolean(studentQuery || parsedHolder);
  let allHolders: AdminCertificateHolder[] = [];
  let legacyRows: LegacyStudentLite[] = [];
  let profileRows: ProfileLite[] = [];

  if (needsHolders) {
    const [legacyResult, profileResult] = await Promise.all([
      supabase
        .from("legacy_students")
        .select("id, full_name, email, linked_profile_id")
        .order("full_name", { ascending: true })
        .limit(10000),
      supabase
        .from("profiles")
        .select("id, email, first_name, last_name, locale")
        .eq("role", "student")
        .order("last_name", { ascending: true })
        .limit(10000),
    ]);
    legacyRows = (legacyResult.data ?? []) as LegacyStudentLite[];
    profileRows = (profileResult.data ?? []) as ProfileLite[];
    allHolders = holdersFromRows(legacyRows, profileRows);
  }

  const searchedHolders = searchIssuanceHolders(allHolders, studentQuery);
  let selectedHolder: AdminCertificateHolder | null = null;
  if (parsedHolder) {
    selectedHolder =
      allHolders.find((holder) =>
        parsedHolder.kind === "legacy"
          ? holder.legacyStudentId === parsedHolder.id
          : holder.profileId === parsedHolder.id && holder.kind === "modern",
      ) ?? null;
  }

  const holders = selectedHolder
    ? [
        selectedHolder,
        ...searchedHolders.filter((row) => row.key !== selectedHolder.key),
      ]
    : searchedHolders;

  const items: AdminCertificateCourseItem[] = [];

  if (selectedHolder) {
    const linkedProfileId = selectedHolder.profileId;
    const linkedLegacyIds = selectedHolder.legacyStudentId
      ? [selectedHolder.legacyStudentId]
      : legacyRows
          .filter((row) => row.linked_profile_id === selectedHolder.profileId)
          .map((row) => row.id);

    const enrollmentPromise = linkedProfileId
      ? supabase
          .from("enrollments")
          .select("id, user_id, course_id, status")
          .eq("user_id", linkedProfileId)
      : Promise.resolve({ data: [] as Array<{
          id: string;
          user_id: string;
          course_id: string;
          status: string;
        }> });

    const completionPromise =
      linkedLegacyIds.length > 0
        ? supabase
            .from("legacy_course_completions")
            .select(
              "id, legacy_student_id, course_id, course_title_original, completed_at, old_certificate_number, certificate_language",
            )
            .in("legacy_student_id", linkedLegacyIds)
        : Promise.resolve({
            data: [] as Array<{
              id: string;
              legacy_student_id: string;
              course_id: string | null;
              course_title_original: string;
              completed_at: string;
              old_certificate_number: string | null;
              certificate_language: string | null;
            }>,
          });

    const [enrollmentResult, completionResult] = await Promise.all([
      enrollmentPromise,
      completionPromise,
    ]);

    const enrollments = enrollmentResult.data ?? [];
    const completions = completionResult.data ?? [];
    const courseIds = [
      ...enrollments.map((row) => row.course_id),
      ...completions
        .map((row) => row.course_id)
        .filter((id): id is string => Boolean(id)),
    ];
    const uniqueCourseIds = [...new Set(courseIds)];

    const { data: courseRows } =
      uniqueCourseIds.length > 0
        ? await supabase
            .from("courses")
            .select("id, title_en, title_ar")
            .in("id", uniqueCourseIds)
        : { data: [] as Array<{ id: string; title_en: string; title_ar: string }> };

    const courses = courseRows ?? [];

    for (const enrollment of enrollments) {
      const titles = courseTitlesFromRegistry(
        enrollment.course_id,
        courses,
        null,
      );
      const blocking = findBlockingCertificate(
        mappedCertificates,
        duplicateLookupsForEnrollment({
          profileId: enrollment.user_id,
          courseId: enrollment.course_id,
          linkedLegacyStudentIds: linkedLegacyIds,
        }),
      );
      items.push({
        key: formatItemKey("enrollment", enrollment.id),
        source: "enrollment",
        courseId: enrollment.course_id,
        courseTitleEn: titles.courseTitleEn,
        courseTitleAr: titles.courseTitleAr,
        statusLabel: enrollmentStatusLabel(enrollment.status),
        oldCertificateNumber: null,
        language: asLocale(
          profileRows.find((row) => row.id === enrollment.user_id)?.locale ??
            null,
        ),
        existingCertificateNumber: blocking?.certificateNumber ?? null,
      });
    }

    for (const completion of completions) {
      const titles = courseTitlesFromRegistry(
        completion.course_id,
        courses,
        completion.course_title_original,
      );
      const blocking = findBlockingCertificate(
        mappedCertificates,
        duplicateLookupsForCompletion({
          legacyCompletionId: completion.id,
          legacyStudentId: completion.legacy_student_id,
          courseId: completion.course_id,
          linkedProfileId: selectedHolder.linkedProfileId,
        }),
      );
      items.push({
        key: formatItemKey("completion", completion.id),
        source: "completion",
        courseId: completion.course_id,
        courseTitleEn: titles.courseTitleEn,
        courseTitleAr: titles.courseTitleAr,
        statusLabel: `Historical completion ${completion.completed_at}`,
        oldCertificateNumber: completion.old_certificate_number,
        language: asLocale(completion.certificate_language),
        existingCertificateNumber: blocking?.certificateNumber ?? null,
      });
    }
  }

  const selectedItem =
    parsedItem && selectedHolder
      ? (items.find((item) => item.key === formatItemKey(parsedItem.source, parsedItem.id)) ??
        null)
      : null;

  const preview =
    selectedHolder && selectedItem
      ? buildIssuancePreview({
          holder: selectedHolder,
          item: selectedItem,
          proposedIssuedAt,
        })
      : null;

  return {
    stats,
    certificates,
    certificateQuery,
    studentQuery,
    holders,
    selectedHolder,
    items,
    selectedItemKey: selectedItem?.key ?? null,
    preview,
    issuanceEnabled: CERTIFICATE_ISSUANCE_ENABLED,
    proposedIssuedAt,
  };
}
