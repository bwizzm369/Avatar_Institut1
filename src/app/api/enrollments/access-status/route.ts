import { NextResponse } from "next/server";
import type { AccessStatusPayload } from "@/lib/enrollments/access-status";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Read-only enrollment check for the post-payment success page.
 * Never creates or updates enrollments. Never trusts session_id / URL params.
 * Access is granted only by the Stripe webhook path elsewhere.
 */
export async function GET(): Promise<NextResponse<AccessStatusPayload | { error: string }>> {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { activated: false, courseSlug: null } satisfies AccessStatusPayload,
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { activated: false, courseSlug: null } satisfies AccessStatusPayload,
    );
  }

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .not("payment_confirmed_at", "is", null)
    .order("enrolled_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!enrollment) {
    return NextResponse.json(
      { activated: false, courseSlug: null } satisfies AccessStatusPayload,
    );
  }

  const courseId = (enrollment as { course_id: string }).course_id;
  const { data: course } = await supabase
    .from("courses")
    .select("slug")
    .eq("id", courseId)
    .maybeSingle();

  const slug = (course as { slug: string } | null)?.slug ?? null;

  return NextResponse.json({
    activated: true,
    courseSlug: slug,
  } satisfies AccessStatusPayload);
}
