type VanMarkProps = {
  className?: string;
  title?: string;
};

/** Linijski simbol kombija (izviren znak GradimoCamper). */
export function VanMark({ className, title }: VanMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {/* karoserija: zadek, streha, vetrobransko steklo, nos */}
      <path d="M6.2 23.5H4.6A1.6 1.6 0 0 1 3 21.9V9.6A2.6 2.6 0 0 1 5.6 7h13.7a2 2 0 0 1 1.5.7l4.7 5.6 2.6.9a2 2 0 0 1 1.4 1.9v5.8a1.6 1.6 0 0 1-1.6 1.6h-1.1" />
      {/* spodnji rob med kolesoma */}
      <path d="M12.2 23.5h8.6" />
      {/* okno kabine */}
      <path d="M18.6 10.2v3.8h4.4" />
      {/* bivalno okno */}
      <path d="M7.4 11.5h6.4" />
      {/* kolesi */}
      <circle cx="9.2" cy="23.5" r="2.9" />
      <circle cx="23.8" cy="23.5" r="2.9" />
    </svg>
  );
}
