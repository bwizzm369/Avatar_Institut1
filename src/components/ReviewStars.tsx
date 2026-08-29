export function ReviewStars({
  rating,
  label,
}: {
  rating: number;
  label: string;
}) {
  const safe = Math.min(5, Math.max(0, Math.round(rating)));
  return (
    <p className="review-stars" aria-label={label}>
      {Array.from({ length: 5 }, (_, index) => {
        const filled = index < safe;
        return (
          <span
            key={index}
            className={filled ? "review-star is-filled" : "review-star is-empty"}
            aria-hidden="true"
          >
            {filled ? "★" : "☆"}
          </span>
        );
      })}
    </p>
  );
}
