"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import {
  STUDENT_PASS_STRIPE_PLANS,
  type StudentPassStripePlan,
} from "@/lib/admin/student-pass/types";
import { isStripePublishableConfigured } from "@/lib/stripe/env";
import { msg } from "@/lib/i18n";

const PLAN_COPY: Record<
  StudentPassStripePlan,
  {
    nameKey: string;
    amountKey: string;
    intervalKey: string;
    chooseKey: string;
  }
> = {
  monthly: {
    nameKey: "dashboard.studentPassPlanNameMonthly",
    amountKey: "dashboard.studentPassPlanAmountMonthly",
    intervalKey: "dashboard.studentPassPlanIntervalMonthly",
    chooseKey: "dashboard.studentPassChooseMonthly",
  },
  semiannual: {
    nameKey: "dashboard.studentPassPlanNameSemiannual",
    amountKey: "dashboard.studentPassPlanAmountSemiannual",
    intervalKey: "dashboard.studentPassPlanIntervalSemiannual",
    chooseKey: "dashboard.studentPassChooseSemiannual",
  },
  annual: {
    nameKey: "dashboard.studentPassPlanNameAnnual",
    amountKey: "dashboard.studentPassPlanAmountAnnual",
    intervalKey: "dashboard.studentPassPlanIntervalAnnual",
    chooseKey: "dashboard.studentPassChooseAnnual",
  },
};

export function StudentPassSubscribeButton() {
  const { locale } = useLocale();
  const stripeConfigured = isStripePublishableConfigured();
  const [pendingPlan, setPendingPlan] = useState<StudentPassStripePlan | null>(
    null,
  );
  const [errorKey, setErrorKey] = useState<string | null>(null);

  async function handleSubscribe(plan: StudentPassStripePlan) {
    setErrorKey(null);
    if (!stripeConfigured) {
      setErrorKey("cart.checkoutConfigMissing");
      return;
    }

    setPendingPlan(plan);
    try {
      const response = await fetch("/api/stripe/student-pass/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ purpose: "student_pass", plan }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        url?: string;
        error?: string;
      };

      if (response.status === 401) {
        window.location.assign("/login?next=/dashboard/student-pass");
        return;
      }

      if (data.error === "already_active" || data.error === "already_subscribed") {
        setErrorKey("dashboard.studentPassAlreadyActive");
        return;
      }

      if (!response.ok || !data.ok || !data.url) {
        if (data.error === "stripe_not_configured") {
          setErrorKey("cart.checkoutConfigMissing");
        } else if (data.error === "unknown_plan") {
          setErrorKey("dashboard.studentPassCheckoutError");
        } else {
          setErrorKey("dashboard.studentPassCheckoutError");
        }
        return;
      }

      window.location.assign(data.url);
    } catch {
      setErrorKey("dashboard.studentPassCheckoutError");
    } finally {
      setPendingPlan(null);
    }
  }

  return (
    <div className="student-pass-subscribe">
      <p className="student-pass-plans-title">
        {msg("dashboard.studentPassPlansTitle", locale)}
      </p>
      <div className="student-pass-plans">
        {STUDENT_PASS_STRIPE_PLANS.map((plan) => {
          const copy = PLAN_COPY[plan];
          const pending = pendingPlan === plan;
          return (
            <article key={plan} className="student-pass-plan">
              <h3 className="student-pass-plan-name">
                {msg(copy.nameKey, locale)}
              </h3>
              <p className="student-pass-plan-amount" dir="ltr">
                {msg(copy.amountKey, locale)}
              </p>
              <p className="student-pass-plan-interval">
                {msg(copy.intervalKey, locale)}
              </p>
              <button
                type="button"
                className="btn btn-primary"
                disabled={pendingPlan !== null || !stripeConfigured}
                onClick={() => void handleSubscribe(plan)}
              >
                {pending
                  ? msg("dashboard.studentPassSubscribeLoading", locale)
                  : msg(copy.chooseKey, locale)}
              </button>
            </article>
          );
        })}
      </div>
      {!stripeConfigured ? (
        <p className="notice-box" role="status">
          {msg("cart.checkoutConfigMissing", locale)}
        </p>
      ) : null}
      {errorKey ? (
        <p className="notice-box" role="alert">
          {msg(errorKey, locale)}
        </p>
      ) : null}
    </div>
  );
}
