// The Flock mark — a simple sheep outline. Reads at any size; one accent color.
// Placeholder, easy to swap for a hand-drawn version later.

export function SheepMark({
  className,
  title = "Flock",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* woolly body */}
      <path d="M20 38c-6 0-9-4-9-8 0-3 2-5 4-6-1-4 2-8 6-8 2-4 7-5 11-3 3-2 8-1 10 2 5 0 8 4 7 8 2 1 3 3 3 6 0 4-3 8-9 8" />
      {/* head */}
      <path d="M46 34c3 0 6 2 6 6 0 4-3 6-7 6-2 0-4-1-5-3" />
      <circle cx="50" cy="39" r="1.2" fill="currentColor" stroke="none" />
      {/* ear */}
      <path d="M52 33c2-1 4 0 4 2" />
      {/* legs */}
      <path d="M22 46v6M30 47v6M40 47v6M47 45v6" />
    </svg>
  );
}
