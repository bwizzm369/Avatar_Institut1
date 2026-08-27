import { NextResponse } from "next/server";
import { hasActiveStudentPassForProfile } from "@/lib/admin/student-pass/access";
import {
  assertSingleCurrency,
  buildCheckoutSessionParams,
  parseCheckoutRequest,
  resolveCheckoutCoursesForUser,
} from "@/lib/stripe/checkout";
import { getStripeClient } from "@/lib/stripe/client";
import { isStripeCheckoutConfigured } from "@/lib/stripe/env";
import { loadCheckoutCourseSources } from "@/lib/stripe/load-checkout-courses";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: "supabase_not_configured" },
      { status: 503 },
    );
  }

  if (!isStripeCheckoutConfigured()) {
    return NextResponse.json(
      { ok: false, error: "stripe_not_configured" },
      { status: 503 },
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_body" },
      { status: 400 },
    );
  }

  const parsed = parseCheckoutRequest(user?.id ?? null, body);
  if (!parsed.ok) {
    const status =
      parsed.error === "unauthenticated"
        ? 401
        : parsed.error === "client_price_rejected"
          ? 400
          : 400;
    return NextResponse.json(
      { ok: false, error: parsed.error },
      { status },
    );
  }

  const sources = await loadCheckoutCourseSources(supabase, parsed.slugs);
  if (sources.length !== parsed.slugs.length) {
    return NextResponse.json(
      { ok: false, error: "unknown_slug" },
      { status: 400 },
    );
  }

  const hasActiveStudentPass = await hasActiveStudentPassForProfile(user!.id);
  const resolved = resolveCheckoutCoursesForUser({
    slugs: parsed.slugs,
    sources,
    hasActiveStudentPass,
  });

  if (!resolved.ok) {
    if (resolved.error === "included_with_pass") {
      return NextResponse.json(
        {
          ok: false,
          error: "included_with_pass",
          redirectSlug: resolved.redirectSlug,
          includedSlugs: resolved.includedSlugs,
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { ok: false, error: resolved.error },
      { status: 400 },
    );
  }

  if (!assertSingleCurrency(resolved.courses)) {
    return NextResponse.json(
      { ok: false, error: "mixed_currency" },
      { status: 400 },
    );
  }

  try {
    const stripe = getStripeClient();
    const sessionParams = buildCheckoutSessionParams({
      userId: user!.id,
      courses: resolved.courses,
      customerEmail: user!.email,
    });
    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      return NextResponse.json(
        { ok: false, error: "checkout_session_failed" },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, url: session.url });
  } catch {
    return NextResponse.json(
      { ok: false, error: "checkout_session_failed" },
      { status: 502 },
    );
  }
}
