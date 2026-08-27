import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { normalizeWhitespace } from "@/lib/admin/import/normalize";

export type AdminStudentListItem = {
  id: string;
  source: "legacy" | "profile";
  /** Present for legacy rows — used by Activate account. */
  legacyStudentId: string | null;
  name: string;
  email: string | null;
  historicalCourses: string[];
  accountStatus: "ACTIVE" | "NOT ACTIVATED";
};

export type AdminStudentListResult = {
  students: AdminStudentListItem[];
  query: string;
};

/**
 * Lists Auth students + legacy registry for the admin Students page.
 * Phone and notes are never included.
 */
export async function listAdminStudents(
  searchQuery = "",
): Promise<AdminStudentListResult> {
  const query = normalizeWhitespace(searchQuery);
  if (!isSupabaseConfigured()) {
    return { students: [], query };
  }

  const supabase = await createServerSupabaseClient();

  const { data: legacyRows } = await supabase
    .from("legacy_students")
    .select("id, full_name, email, linked_profile_id")
    .order("full_name", { ascending: true });

  const { data: completionRows } = await supabase
    .from("legacy_course_completions")
    .select("legacy_student_id, course_title_original");

  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name")
    .eq("role", "student")
    .order("last_name", { ascending: true });

  const coursesByStudent = new Map<string, string[]>();
  for (const completion of completionRows ?? []) {
    const list = coursesByStudent.get(completion.legacy_student_id) ?? [];
    if (!list.includes(completion.course_title_original)) {
      list.push(completion.course_title_original);
    }
    coursesByStudent.set(completion.legacy_student_id, list);
  }

  const linkedProfileIds = new Set(
    (legacyRows ?? [])
      .map((row) => row.linked_profile_id)
      .filter((id): id is string => Boolean(id)),
  );

  const legacyEmails = new Set(
    (legacyRows ?? [])
      .map((row) => row.email?.toLowerCase() ?? null)
      .filter((email): email is string => Boolean(email)),
  );

  const profileEmailSet = new Set(
    (profileRows ?? []).map((p) => p.email.toLowerCase()),
  );

  const items: AdminStudentListItem[] = [];

  for (const row of legacyRows ?? []) {
    const active =
      Boolean(row.linked_profile_id) ||
      (row.email ? profileEmailSet.has(row.email.toLowerCase()) : false);

    items.push({
      id: `legacy:${row.id}`,
      source: "legacy",
      legacyStudentId: row.id,
      name: row.full_name,
      email: row.email,
      historicalCourses: coursesByStudent.get(row.id) ?? [],
      accountStatus: active ? "ACTIVE" : "NOT ACTIVATED",
    });
  }

  for (const profile of profileRows ?? []) {
    if (linkedProfileIds.has(profile.id)) continue;
    if (legacyEmails.has(profile.email.toLowerCase())) continue;

    const name =
      [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
      profile.email;

    items.push({
      id: `profile:${profile.id}`,
      source: "profile",
      legacyStudentId: null,
      name,
      email: profile.email,
      historicalCourses: [],
      accountStatus: "ACTIVE",
    });
  }

  const filtered = query
    ? items.filter((item) => {
        const hay = `${item.name} ${item.email ?? ""}`.toLowerCase();
        return hay.includes(query.toLowerCase());
      })
    : items;

  filtered.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );

  return { students: filtered, query };
}
