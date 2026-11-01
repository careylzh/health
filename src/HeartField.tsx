import { memo } from "react";

/** Decorative background: soft pastel hearts drifting upward (the "in the pink of health" motif). */

// Deterministic pseudo-random so the layout is stable across renders and reloads.
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

const HEARTS = Array.from({ length: 22 }, (_, i) => ({
  left: `${(rand(i + 1) * 100).toFixed(1)}%`,
  top: `${(rand(i + 101) * 100).toFixed(1)}%`,
  size: `${(14 + rand(i + 201) * 42).toFixed(0)}px`,
  opacity: (0.18 + rand(i + 301) * 0.32).toFixed(2),
  duration: `${(9 + rand(i + 401) * 12).toFixed(1)}s`,
  delay: `${(-rand(i + 501) * 15).toFixed(1)}s`,
  drift: `${((rand(i + 601) - 0.5) * 120).toFixed(0)}px`,
  hue: i % 3,
}));

function Heart({ tone }: { tone: number }) {
  return (
    <svg viewBox="0 0 32 29" aria-hidden="true">
      <path
        className={`heart-fill tone-${tone}`}
        d="M16 28.5S1.5 19.6 1.5 9.3C1.5 4.6 5.1 1.5 9 1.5c3 0 5.6 1.8 7 4.4 1.4-2.6 4-4.4 7-4.4 3.9 0 7.5 3.1 7.5 7.8C30.5 19.6 16 28.5 16 28.5z"
      />
    </svg>
  );
}

export const HeartField = memo(function HeartField() {
  return (
    <div className="heart-field" aria-hidden="true">
      {HEARTS.map((h, i) => (
        <span
          key={i}
          className="floating-heart"
          style={{
            "--left": h.left, "--top": h.top, "--size": h.size, "--opacity": h.opacity,
            "--duration": h.duration, "--delay": h.delay, "--drift": h.drift,
          } as React.CSSProperties}
        >
          <Heart tone={h.hue} />
        </span>
      ))}
    </div>
  );
});
