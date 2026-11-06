import { memo } from "react";
import { Cross } from "./Cross";

/** Decorative background: soft pastel medical crosses drifting upward (decision 0005). */

// Deterministic pseudo-random so the layout is stable across renders and reloads.
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

const CROSSES = Array.from({ length: 22 }, (_, i) => ({
  left: `${(rand(i + 1) * 100).toFixed(1)}%`,
  top: `${(rand(i + 101) * 100).toFixed(1)}%`,
  size: `${(14 + rand(i + 201) * 42).toFixed(0)}px`,
  opacity: (0.18 + rand(i + 301) * 0.32).toFixed(2),
  duration: `${(9 + rand(i + 401) * 12).toFixed(1)}s`,
  delay: `${(-rand(i + 501) * 15).toFixed(1)}s`,
  drift: `${((rand(i + 601) - 0.5) * 120).toFixed(0)}px`,
  hue: i % 3,
}));

export const CrossField = memo(function CrossField() {
  return (
    <div className="cross-field" aria-hidden="true">
      {CROSSES.map((h, i) => (
        <span
          key={i}
          className="floating-cross"
          style={{
            "--left": h.left, "--top": h.top, "--size": h.size, "--opacity": h.opacity,
            "--duration": h.duration, "--delay": h.delay, "--drift": h.drift,
          } as React.CSSProperties}
        >
          <Cross className={`tone-${h.hue}`} />
        </span>
      ))}
    </div>
  );
});
