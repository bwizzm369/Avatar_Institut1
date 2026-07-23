/**
 * Official Avatar Institut logo — geometry preserved from legacy reference.
 * Circles, center point, and baseline proportions are unchanged.
 * Text size only is increased slightly for readability.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="48"
      height="60"
      viewBox="0 0 44 56"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="22" cy="20" r="16" fill="none" stroke="#1F4D3A" strokeWidth="1" />
      <circle cx="22" cy="20" r="2.8" fill="#1F4D3A" />
      <line
        x1="4"
        y1="42"
        x2="40"
        y2="42"
        stroke="#1F4D3A"
        strokeWidth="0.3"
        opacity="0.5"
      />
      <text
        x="22"
        y="49"
        textAnchor="middle"
        fontFamily="Cormorant Garamond, serif"
        fontSize="6"
        fontWeight="600"
        letterSpacing="1.2"
        fill="#0F0F0F"
      >
        AVATAR INSTITUT
      </text>
    </svg>
  );
}
