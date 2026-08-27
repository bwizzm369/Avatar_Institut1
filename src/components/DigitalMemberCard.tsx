"use client";

import { Logo } from "@/components/Logo";
import { useLocale } from "@/components/LocaleProvider";
import { formatMembershipDate } from "@/lib/student-pass/membership";
import type { StudentMembershipCard } from "@/lib/student-pass/membership";
import { msg } from "@/lib/i18n";

export function DigitalMemberCard({ card }: { card: StudentMembershipCard }) {
  const { locale } = useLocale();
  const statusKey =
    card.cardStatus === "ACTIVE"
      ? "dashboard.memberCardActive"
      : "dashboard.memberCardInactive";

  return (
    <article
      className="member-card"
      data-status={card.cardStatus.toLowerCase()}
      aria-label={`${msg("dashboard.studentPassTitle", locale)} · ${msg("dashboard.studentPassMembership", locale)}`}
    >
      <header className="member-card-header">
        <Logo variant="panel" className="member-card-logo" />
        <div className="member-card-titles">
          <p className="member-card-eyebrow">Avatar Institut</p>
          <h2 className="member-card-name">
            {msg("dashboard.studentPassTitle", locale)}
          </h2>
          <p className="member-card-membership">
            {msg("dashboard.studentPassMembershipBilingual", locale)}
          </p>
        </div>
        <p
          className={
            card.cardStatus === "ACTIVE"
              ? "member-card-stamp member-card-stamp-active"
              : "member-card-stamp member-card-stamp-inactive"
          }
        >
          {msg(statusKey, locale)}
        </p>
      </header>

      <dl className="member-card-fields">
        <div>
          <dt>{msg("dashboard.memberCardName", locale)}</dt>
          <dd>{card.fullName}</dd>
        </div>
        <div>
          <dt>{msg("dashboard.memberCardId", locale)}</dt>
          <dd className="member-card-id" dir="ltr">
            {card.memberId}
          </dd>
        </div>
        <div>
          <dt>{msg("dashboard.memberCardStatus", locale)}</dt>
          <dd>{msg(statusKey, locale)}</dd>
        </div>
        <div>
          <dt>{msg("dashboard.memberCardJoined", locale)}</dt>
          <dd>{formatMembershipDate(card.joinedAt, locale)}</dd>
        </div>
      </dl>
    </article>
  );
}
