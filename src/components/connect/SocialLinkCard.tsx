"use client";

type SocialLink = {
  id: string;
  labelEn: string;
  labelAr: string;
  url: string;
};

type SocialLinkCardProps = {
  link: SocialLink;
  locale: "en" | "ar";
  openLabel: string;
};

function SocialIcon({ id }: { id: string }) {
  const commonProps = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
  } as const;

  switch (id) {
    case "whatsapp":
      return (
        <svg {...commonProps}>
          <path
            d="M12 3.5A8.5 8.5 0 0 0 4.61 16.2L3.5 20.5l4.43-1.07A8.5 8.5 0 1 0 12 3.5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M9.2 8.9c-.2-.46-.4-.47-.58-.48h-.5c-.18 0-.47.07-.72.34-.25.27-.96.94-.96 2.28 0 1.34.98 2.63 1.12 2.81.13.18 1.9 3.05 4.68 4.15 2.3.9 2.77.73 3.27.68.5-.05 1.62-.66 1.85-1.3.23-.64.23-1.18.16-1.3-.07-.11-.25-.18-.52-.31-.28-.14-1.63-.82-1.88-.91-.25-.1-.44-.14-.62.14-.18.27-.72.9-.88 1.09-.16.18-.32.2-.6.07-.28-.14-1.17-.43-2.23-1.38-.82-.73-1.37-1.63-1.53-1.9-.16-.27-.02-.42.12-.56.13-.13.28-.33.41-.5.14-.16.18-.27.28-.45.09-.18.04-.34-.03-.47-.07-.14-.63-1.55-.84-2.03Z"
            fill="currentColor"
          />
        </svg>
      );
    case "telegram":
      return (
        <svg {...commonProps}>
          <path
            d="M21 4.8 17.8 19a1.1 1.1 0 0 1-1.65.7l-4.08-3-2.1 2.03c-.23.23-.42.42-.87.42l.3-4.3 7.82-7.06c.34-.3-.07-.47-.53-.16l-9.67 6.1-4.17-1.3c-.9-.29-.92-.9.2-1.33L19.4 4.3c.76-.28 1.43.18 1.18 1.5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
            fill="currentColor"
          />
        </svg>
      );
    case "youtube":
      return (
        <svg {...commonProps}>
          <rect x="2.8" y="5.4" width="18.4" height="13.2" rx="3.2" stroke="currentColor" strokeWidth="1.6" />
          <path d="m10 9 5 3-5 3V9Z" fill="currentColor" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...commonProps}>
          <rect x="4" y="4" width="16" height="16" rx="4.2" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="17.1" cy="6.9" r="1" fill="currentColor" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...commonProps}>
          <path
            d="M14 4v8.1a3.1 3.1 0 1 1-2.2-2.97"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 4c.75 1.5 1.93 2.64 3.5 3.08"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "facebook":
      return (
        <svg {...commonProps}>
          <path
            d="M13.4 20v-6.4h2.25l.34-2.76H13.4V9.05c0-.8.22-1.34 1.37-1.34h1.47V5.25c-.25-.03-1.1-.1-2.09-.1-2.07 0-3.5 1.27-3.5 3.6v2.05H8.3v2.76h2.35V20h2.75Z"
            fill="currentColor"
          />
        </svg>
      );
    default:
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
  }
}

export function SocialLinkCard({
  link,
  locale,
  openLabel,
}: SocialLinkCardProps) {
  const label = locale === "ar" ? link.labelAr : link.labelEn;

  return (
    <article className="connect-card">
      <div className="connect-card-icon">
        <SocialIcon id={link.id} />
      </div>
      <h3 className="connect-card-title">{label}</h3>
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-ghost connect-card-action"
        aria-label={`${openLabel} ${label}`}
      >
        {openLabel}
      </a>
    </article>
  );
}
