/**
 * Rounded medical cross — the site's symbol (decision 0005). Original SVG: SF Symbols may not be
 * used outside apps for Apple platforms, so this is drawn in their spirit, not copied.
 * Fills with `currentColor` unless a className sets `fill`.
 */
export const CROSS_PATH = "M12 3h8v9h9v8h-9v9h-8v-9H3v-8h9z";

export function Cross({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      <path d={CROSS_PATH} fill="currentColor" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}
