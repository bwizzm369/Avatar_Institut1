import { NextResponse } from "next/server";
import { hasActiveStudentPassForProfile } from "@/lib/admin/student-pass/access";
import { getStripeClient } from "@/lib/stripe/client";
import {
  getStripeStudentPassPriceId,
  isStripeStudentPassCheckoutConfigured,
} from "@/lib/stripe/env";
import {
  assertStudentPassStripePrice,
  buildStudentPassCheckoutSessionParams,
  isLiveStripeStudentPassStatus,
  parseStudentPassCheckoutRequest,
  STUDENT_PASS_STRIPE_PURPOSE,
} from "@/lib/stripe/student-pass-checkout";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { getSupabaseSecretKey, isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: "supabase_not_configured" },
      { status: 503 },
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let body: unknown = {};
  try {
    const text = await request.text();
    if (text.trim()) {
      body = JSON.parse(text) as unknown;
    }
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_body" },
      { status: 400 },
    );
  }

  const parsed = parseStudentPassCheckoutRequest(user?.id ?? null, body);
  if (!parsed.ok) {
    const status =
      parsed.error === "unauthenticated"
        ? 401
        : parsed.error === "unknown_plan"
          ? 400
          : 400;
    return NextResponse.json({ ok: false, error: parsed.error }, { status });
  }

  if (!getSupabaseSecretKey()) {
    return NextResponse.json(
      { ok: false, error: "supabase_not_configured" },
      { status: 503 },
    );
  }

  if (!isStripeStudentPassCheckoutConfigured()) {
    return NextResponse.json(
      { ok: false, error: "stripe_not_configured" },
      { status: 503 },
    );
  }

  const profileId = user!.id;
  const email = user!.email ?? null;

  const entitled = await hasActiveStudentPassForProfile(profileId);
  if (entitled) {
    return NextResponse.json(
      { ok: false, error: "already_active" },
      { status: 409 },
    );
  }

  const priceId = getStripeStudentPassPriceId(parsed.plan);
  if (!priceId) {
    return NextResponse.json(
      { ok: false, error: "stripe_not_configured" },
      { status: 503 },
    );
  }

  try {
    const stripe = getStripeClient();
    const price = await stripe.prices.retrieve(priceId);
    const priceCheck = assertStudentPassStripePrice(price, parsed.plan);
    if (!priceCheck.ok) {
      return NextResponse.json(
        { ok: false, error: "invalid_price" },
        { status: 503 },
      );
    }

    const admin = createServiceRoleSupabaseClient();
    const { data: existing, error: loadError } = await admin
      .from("student_pass_subscriptions")
      .select("stripe_customer_id, stripe_subscription_id, status, source")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (loadError) {
      return NextResponse.json(
        { ok: false, error: "checkout_session_failed" },
        { status: 502 },
      );
    }

    if (existing?.stripe_subscription_id) {
      const current = await stripe.subscriptions.retrieve(
        existing.stripe_subscription_id,
      );
      if (isLiveStripeStudentPassStatus(current.status)) {
        return NextResponse.json(
          { ok: false, error: "already_subscribed" },
          { status: 409 },
        );
      }
    }

    let customerId = existing?.stripe_customer_id?.trim() || null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: email || undefined,
        metadata: {
          purpose: STUDENT_PASS_STRIPE_PURPOSE,
          profile_id: profileId,
        },
      });
      customerId = customer.id;

      if (existing) {
        const { error } = await admin
          .from("student_pass_subscriptions")
          .update({ stripe_customer_id: customerId })
          .eq("profile_id", profileId);
        if (error) {
          return NextResponse.json(
            { ok: false, error: "checkout_session_failed" },
            { status: 502 },
          );
        }
      } else {
        const { error } = await admin.from("student_pass_subscriptions").insert({
          profile_id: profileId,
          status: "inactive",
          stripe_customer_id: customerId,
        });
        if (error) {
          return NextResponse.json(
            { ok: false, error: "checkout_session_failed" },
            { status: 502 },
          );
        }
      }
    }

    const live = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 20,
    });
    const hasLive = live.data.some(
      (subscription) =>
        isLiveStripeStudentPassStatus(subscription.status) &&
        (subscription.metadata?.purpose === STUDENT_PASS_STRIPE_PURPOSE ||
          subscription.metadata?.profile_id === profileId),
    );
    if (hasLive) {
      return NextResponse.json(
        { ok: false, error: "already_subscribed" },
        { status: 409 },
      );
    }

    const session = await stripe.checkout.sessions.create(
      buildStudentPassCheckoutSessionParams({
        profileId,
        priceId,
        customerId,
        plan: parsed.plan,
      }),
    );

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
