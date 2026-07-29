"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useCart } from "@/components/CartProvider";
import { useLocale } from "@/components/LocaleProvider";
import { isStripePublishableConfigured } from "@/lib/stripe/env";
import { msg } from "@/lib/i18n";

export function CartCheckoutButton() {
  const { locale } = useLocale();
  const router = useRouter();
  const { items } = useCart();
  const { user, ready: authReady, configured: authConfigured } = useAuth();
  const stripeConfigured = isStripePublishableConfigured();

  const [pending, setPending] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  async function handleCheckout() {
    setErrorKey(null);

    if (!authConfigured || !stripeConfigured) {
      setErrorKey("cart.checkoutConfigMissing");
      return;
    }

    if (!authReady) return;

    if (!user) {
      router.push("/login?next=/cart");
      return;
    }

    if (items.length === 0) {
      setErrorKey("cart.empty");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slugs: items.map((item) => item.slug),
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        url?: string;
        error?: string;
      };

      if (response.status === 401) {
        router.push("/login?next=/cart");
        return;
      }

      if (!response.ok || !data.ok || !data.url) {
        if (data.error === "client_price_rejected") {
          setErrorKey("cart.checkoutPriceRejected");
        } else if (data.error === "stripe_not_configured") {
          setErrorKey("cart.checkoutConfigMissing");
        } else {
          setErrorKey("cart.checkoutError");
        }
        return;
      }

      window.location.assign(data.url);
    } catch {
      setErrorKey("cart.checkoutError");
    } finally {
      setPending(false);
    }
  }

  const disabled =
    pending || !authReady || items.length === 0 || !stripeConfigured;

  return (
    <div className="stack-lg" style={{ gap: "0.75rem" }}>
      <button
        type="button"
        className="btn btn-primary btn-block"
        disabled={disabled}
        onClick={() => void handleCheckout()}
      >
        {pending
          ? msg("cart.checkoutLoading", locale)
          : !user && authReady
            ? msg("cart.checkoutLoginRequired", locale)
            : msg("cart.checkout", locale)}
      </button>
      {!stripeConfigured ? (
        <div className="notice-box" role="status">
          {msg("cart.checkoutConfigMissing", locale)}
        </div>
      ) : null}
      {errorKey ? (
        <div className="notice-box" role="alert">
          {msg(errorKey, locale)}
        </div>
      ) : (
        <div className="notice-box" role="status">
          {msg("cart.checkoutStripeNote", locale)}
        </div>
      )}
    </div>
  );
}
