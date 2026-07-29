"use client";

import Image from "next/image";
import { useLocale } from "@/components/LocaleProvider";
import { msg } from "@/lib/i18n";

/** Official lockup — geometry and proportions preserved; never redrawn or stretched. */
export const OFFICIAL_LOGO_SRC = "/brand/avatar-institut-official.jpeg";

type LogoProps = {
  className?: string;
  /** header: compact nav mark; panel: about-section lockup */
  variant?: "header" | "panel";
};

export function Logo({ className, variant = "header" }: LogoProps) {
  const { locale } = useLocale();
  const isPanel = variant === "panel";
  const imageClass = isPanel ? "official-logo-panel" : "official-logo-header";
  const wrapClass = isPanel
    ? "official-logo-wrap official-logo-wrap--panel"
    : "official-logo-wrap official-logo-wrap--header";

  return (
    <span className={[wrapClass, className].filter(Boolean).join(" ")}>
      <Image
        src={OFFICIAL_LOGO_SRC}
        alt={msg("brand.logoAlt", locale)}
        width={isPanel ? 220 : 110}
        height={isPanel ? 220 : 110}
        className={imageClass}
        style={{ height: "auto" }}
        sizes={
          isPanel
            ? "(max-width: 767px) 150px, 220px"
            : "(max-width: 767px) 80px, 110px"
        }
        priority={variant === "header"}
      />
    </span>
  );
}
