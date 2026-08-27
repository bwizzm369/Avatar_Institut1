"use client";

import Link from "next/link";
import { CartCheckoutButton } from "@/components/CartCheckoutButton";
import { DemoBadge } from "@/components/DemoBadge";
import { useCart } from "@/components/CartProvider";
import { useLocale } from "@/components/LocaleProvider";
import { formatPrice } from "@/lib/courses";
import { publicCoursePath } from "@/lib/courses/course-slug";
import { isDemoCourseSlug } from "@/lib/courses/demoDbIds";
import { displayLocalized, msg } from "@/lib/i18n";

export default function CartPage() {
  const { locale } = useLocale();
  const { items, removeCourse, totalCents, ready } = useCart();
  const currency = items[0]?.currency ?? "EUR";

  return (
    <>
      <section className="page-hero">
        <div className="container stack-lg">
          <h1 className="display display-lg">{msg("cart.title", locale)}</h1>
          <p className="lead">{msg("cart.demoNote", locale)}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {!ready ? (
            <div className="empty-state" aria-busy="true">
              <p className="muted">{msg("cart.loading", locale)}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="empty-state stack-lg">
              <p>{msg("cart.empty", locale)}</p>
              <div>
                <Link href="/courses" className="btn btn-primary">
                  {msg("cart.browse", locale)}
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="cart-list">
                {items.map((item) => (
                  <article key={item.courseId} className="cart-item">
                    <div className="stack-lg" style={{ gap: "0.5rem" }}>
                      {isDemoCourseSlug(item.slug) ? <DemoBadge /> : null}
                      <h2 className="display display-md" style={{ fontSize: "1.35rem" }}>
                        <Link href={publicCoursePath(item.slug)}>
                          {displayLocalized(item.title, locale)}
                        </Link>
                      </h2>
                      <p className="price" style={{ fontSize: "1.35rem" }}>
                        {formatPrice(item.priceCents, item.currency, locale)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => removeCourse(item.courseId)}
                    >
                      {msg("cart.remove", locale)}
                    </button>
                  </article>
                ))}
              </div>

              <div className="cart-summary">
                <div className="cart-total-row">
                  <span>{msg("cart.total", locale)}</span>
                  <strong className="price">
                    {formatPrice(totalCents, currency, locale)}
                  </strong>
                </div>
                <CartCheckoutButton />
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
