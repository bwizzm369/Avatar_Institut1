import { NextResponse } from "next/server";
import {
  resolveAccessFromSessionCourses,
  type AccessStatusPayload,
} from "@/lib/enrollments/access-status";
import { parseCourseIdsFromMetadata } from "@/lib/enrollments/grant";
import { getStripeClient } from "@/lib/stripe/client";
import { isStripeCheckoutConfigured } from "@/lib/stripe/env";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const emptyStatus = {
  activated: false,
  courseSlug: null,
  courseSlugs: [],
} satisfies AccessStatusPayload;

/**
 * Read-only enrollment check for the post-payment success page.
 * Uses Stripe session metadata course_ids only to know what to look for.
 * Access is confirmed solely by an existing active enrollment in Supabase.
 * Never creates or updates enrollments. Never unlocks from session_id alone.
 */
export async function GET(
  request: Request,
): Promise<NextResponse<AccessStatusPayload | { error: string }>> {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(emptyStatus);
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(emptyStatus);
  }

  const sessionId = new URL(request.url).searchParams.get("session_id")?.trim();
  if (!sessionId || !isStripeCheckoutConfigured()) {
    return NextResponse.json(emptyStatus);
  }

  let expectedCourseIds: string[] = [];
  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const sessionUserId =
      session.metadata?.user_id?.trim() ||
      session.client_reference_id?.trim() ||
      null;

    // session_id must belong to the signed-in student; never unlock from URL alone.
    if (!sessionUserId || sessionUserId !== user.id) {
      return NextResponse.json(emptyStatus);
    }

    expectedCourseIds = parseCourseIdsFromMetadata(session.metadata);
  } catch {
    return NextResponse.json(emptyStatus);
  }

  if (expectedCourseIds.length === 0) {
    return NextResponse.json(emptyStatus);
  }

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .not("payment_confirmed_at", "is", null)
    .in("course_id", expectedCourseIds);

  if (!enrollments || enrollments.length === 0) {
    return NextResponse.json(emptyStatus);
  }

  const { data: courses } = await supabase
    .from("courses")
    .select("id, slug")
    .in(
      "id",
      enrollments.map((enrollment) => enrollment.course_id),
    );

  const status = resolveAccessFromSessionCourses({
    expectedCourseIds,
    enrollments,
    courses: courses ?? [],
  });

  return NextResponse.json(status);
}
