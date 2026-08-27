import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { normalizeWhitespace } from "@/lib/admin/import/normalize";
import {
  hasActiveStudentPass,
  STUDENT_PASS_PRICE_EUR,
  STUDENT_PASS_PRICE_LABEL,
  type StudentPassStatus,
} from "@/lib/admin/student-pass/types";
import { studentMemberId } from "@/lib/student-pass/membership";

export type AdminStudentPassListItem = {
  profileId: string;
  email: string;
  name: string;
  subscriptionId: string | null;
  status: StudentPassStatus | "none";
  startedAt: string | null;
  expiresAt: string | null;
  source: string | null;
  isEntitled: boolean;
};

export type AdminStudentPassListResult = {
  priceEur: number;
  priceLabel: string;
  activeMembers: number;
  inactiveMembers: number;
  members: AdminStudentPassListItem[];
  query: string;
};

type ProfileLite = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
};

type SubscriptionLite = {
  id: string;
  profile_id: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  source: string | null;
};

function displayName(profile: ProfileLite): string {
  const name = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || profile.email;
}

function asStatus(value: string): StudentPassStatus | "none" {
  if (
    value === "active" ||
    value === "inactive" ||
    value === "cancelled" ||
    value === "expired"
  ) {
    return value;
  }
  return "none";
}

/**
 * Lists student profiles with Student Pass subscription state for admin.
 */
export async function listAdminStudentPassMembers(
  searchQuery = "",
  now: Date = new Date(),
): Promise<AdminStudentPassListResult> {
  const query = normalizeWhitespace(searchQuery);
  const empty: AdminStudentPassListResult = {
    priceEur: STUDENT_PASS_PRICE_EUR,
    priceLabel: STUDENT_PASS_PRICE_LABEL,
    activeMembers: 0,
    inactiveMembers: 0,
    members: [],
    query,
  };

  if (!isSupabaseConfigured()) {
    return empty;
  }

  const supabase = await createServerSupabaseClient();

  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name")
    .eq("role", "student")
    .order("email", { ascending: true });

  const { data: subscriptionRows } = await supabase
    .from("student_pass_subscriptions")
    .select("id, profile_id, status, started_at, expires_at, source");

  const byProfile = new Map<string, SubscriptionLite>();
  for (const row of (subscriptionRows ?? []) as SubscriptionLite[]) {
    byProfile.set(row.profile_id, row);
  }

  const members: AdminStudentPassListItem[] = (
    (profileRows ?? []) as ProfileLite[]
  ).map((profile) => {
    const sub = byProfile.get(profile.id) ?? null;
    const status = sub ? asStatus(sub.status) : "none";
    const isEntitled = hasActiveStudentPass(
      sub
        ? { status: sub.status, expires_at: sub.expires_at }
        : null,
      now,
    );

    return {
      profileId: profile.id,
      email: profile.email,
      name: displayName(profile),
      subscriptionId: sub?.id ?? null,
      status,
      startedAt: sub?.started_at ?? null,
      expiresAt: sub?.expires_at ?? null,
      source: sub?.source ?? null,
      isEntitled,
    };
  });

  const filtered = query
    ? members.filter((item) => {
        const hay =
          `${item.name} ${item.email} ${studentMemberId(item.profileId)} ${item.status} ${item.source ?? ""}`.toLowerCase();
        return hay.includes(query.toLowerCase());
      })
    : members;

  filtered.sort((a, b) =>
    a.email.localeCompare(b.email, undefined, { sensitivity: "base" }),
  );

  const activeMembers = members.filter((m) => m.isEntitled).length;
  const inactiveMembers = members.length - activeMembers;

  return {
    priceEur: STUDENT_PASS_PRICE_EUR,
    priceLabel: STUDENT_PASS_PRICE_LABEL,
    activeMembers,
    inactiveMembers,
    members: filtered,
    query,
  };
}
