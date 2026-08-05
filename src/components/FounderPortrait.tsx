"use client";

import Image from "next/image";
import { useLocale } from "@/components/LocaleProvider";
import { founderBiography } from "@/lib/founder/biography";

const FOUNDER_PHOTO_SRC = "/founder/mohamed-ramadan-al-husseini.jpg";

type FounderPortraitProps = {
  className?: string;
  size?: "teaser" | "hero";
};

export function FounderPortrait({
  className = "",
  size = "hero",
}: FounderPortraitProps) {
  const { locale } = useLocale();
  const alt =
    locale === "ar" ? founderBiography.name_ar : founderBiography.name_en;

  return (
    <div
      className={`founder-portrait founder-portrait--${size} ${className}`.trim()}
      data-founder-portrait="photo"
    >
      <Image
        src={FOUNDER_PHOTO_SRC}
        alt={alt}
        fill
        className="founder-portrait-photo"
        sizes="(max-width: 767px) 100vw, 420px"
        priority={size === "hero"}
      />
    </div>
  );
}
