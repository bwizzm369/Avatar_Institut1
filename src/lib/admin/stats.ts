import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type AdminStatCard = {
  id: "students" | "courses" | "studentPass";
  label: string;
  value: number | null;
  hint: string | null;
};

export type AdminDashboardStats = {
  cards: AdminStatCard[];
};

/**
 * Loads admin dashboard counts from real tables only.
 * Never invents demo numbers.
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const cards: AdminStatCard[] = [
    {
      id: "students",
      label: "Students",
      value: 0,
      hint: null,
    },
    {
      id: "courses",
      label: "Courses",
      value: 0,
      hint: null,
    },
    {
      id: "studentPass",
      label: "Active Student Pass",
      value: null,
      hint: "Not available",
    },
  ];

  if (!isSupabaseConfigured()) {
    return { cards };
  }

  try {
    const supabase = await createServerSupabaseClient();

    const { count: profileCount, error: profileError } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "student");

    const { count: legacyCount, error: legacyError } = await supabase
      .from("legacy_students")
      .select("id", { count: "exact", head: true })
      .is("linked_profile_id", null);

    if (!profileError && !legacyError) {
      cards[0] = {
        ...cards[0],
        value: (profileCount ?? 0) + (legacyCount ?? 0),
      };
    } else if (!profileError && typeof profileCount === "number") {
      cards[0] = { ...cards[0], value: profileCount };
    }

    const { count: courseCount, error: courseError } = await supabase
      .from("courses")
      .select("id", { count: "exact", head: true });

    if (!courseError && typeof courseCount === "number") {
      cards[1] = { ...cards[1], value: courseCount };
    }

    const nowIso = new Date().toISOString();
    const { count: passCount, error: passError } = await supabase
      .from("student_pass_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`);

    if (!passError && typeof passCount === "number") {
      cards[2] = {
        ...cards[2],
        value: passCount,
        hint: null,
      };
    } else if (passError) {
      cards[2] = {
        ...cards[2],
        value: null,
        hint: "Student Pass table unavailable",
      };
    }
  } catch {
    // Leave defaults (0 / explicit unavailable) — never invent figures.
  }

  return { cards };
}
