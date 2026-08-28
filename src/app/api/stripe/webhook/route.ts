import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe/client";
import {
  dispatchStripeWebhookEvent,
  verifyStripeWebhookEvent,
} from "@/lib/stripe/webhook";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured, getSupabaseSecretKey } from "@/lib/supabase/env";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  const stripe = getStripeClient();
  const verified = verifyStripeWebhookEvent({
    stripe,
    rawBody,
    signature,
  });

  if (!verified.ok) {
    const status =
      verified.error === "missing_secret"
        ? 503
        : verified.error === "missing_signature"
          ? 400
          : 400;
    return NextResponse.json(
      { ok: false, error: verified.error },
      { status },
    );
  }

  const event = verified.event;
  const needsDatabase =
    event.type === "checkout.session.completed" ||
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted" ||
    event.type === "invoice.paid" ||
    event.type === "invoice.payment_failed";

  if (!needsDatabase) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (!isSupabaseConfigured() || !getSupabaseSecretKey()) {
    return NextResponse.json(
      { ok: false, error: "supabase_secret_not_configured" },
      { status: 503 },
    );
  }

  try {
    const supabase = createServiceRoleSupabaseClient();
    const result = await dispatchStripeWebhookEvent({
      event,
      supabase,
      retrieveSubscription: async (subscriptionId) =>
        stripe.subscriptions.retrieve(subscriptionId),
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      action: result.action,
      granted: result.grantedCourseIds?.length ?? 0,
      profileId: result.profileId ?? null,
      ignored: result.ignored === true,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "webhook_processing_failed" },
      { status: 500 },
    );
  }
}
