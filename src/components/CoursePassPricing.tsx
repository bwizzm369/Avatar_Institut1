"use client";

import { formatPrice } from "@/lib/courses";
import type { CoursePassOfferView } from "@/lib/courses/pass-offer";
import { msg, msgReplace } from "@/lib/i18n";
import type { Course, Locale } from "@/types";

export function CoursePassPricing({
  locale,
  currency,
  listPriceCents,
  offer,
  compact = false,
}: {
  locale: Locale;
  currency: Course["currency"];
  listPriceCents: number;
  offer: CoursePassOfferView | undefined;
  compact?: boolean;
}) {
  if (offer?.accessIncluded && offer.hasActiveStudentPass) {
    return (
      <div className={compact ? "pass-price pass-price-compact" : "pass-price"}>
        <p className="pass-included">
          {msg(
            compact
              ? "courses.passIncludedShort"
              : "courses.passIncludedMember",
            locale,
          )}
        </p>
      </div>
    );
  }

  if (offer?.showMemberPrice && offer.listPriceCents != null && offer.memberPriceCents != null) {
    return (
      <div className={compact ? "pass-price pass-price-compact" : "pass-price"}>
        <p className="price-list">
          <span className="price-label">{msg("courses.normalPrice", locale)}</span>{" "}
          <span className="price-strike">
            {formatPrice(offer.listPriceCents, currency, locale)}
          </span>
        </p>
        <p className="price price-member">
          <span className="price-label">
            {msg("courses.passPrice", locale)}
          </span>{" "}
          {formatPrice(offer.memberPriceCents, currency, locale)}
        </p>
        {!compact ? (
          <p className="pass-save">
            {msgReplace("courses.passSave", locale, {
              n: String(offer.discountPercentApplied),
            })}
          </p>
        ) : null}
      </div>
    );
  }

  const included = offer?.studentPassIncluded ?? false;
  const discountPercent = offer?.studentPassDiscountPercent ?? 0;

  return (
    <div className={compact ? "pass-price pass-price-compact" : "pass-price"}>
      <strong className="price">
        {formatPrice(listPriceCents, currency, locale)}
      </strong>
      {included ? (
        <p className="pass-benefit">{msg("courses.passIncludedShort", locale)}</p>
      ) : discountPercent > 0 ? (
        <p className="pass-benefit">
          {msgReplace("courses.passBenefitDiscount", locale, {
            n: String(discountPercent),
          })}
        </p>
      ) : null}
    </div>
  );
}
