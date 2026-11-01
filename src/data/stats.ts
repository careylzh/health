import { isFragmented, isLogged, totalHours, type Night } from "./parse";
import { BODY, MOOD_DOWN, MOOD_UP, type TagKey } from "./keywords";

export type Quality = "good" | "mixed" | "poor";

/** Per-night quality from tags + fragmentation. `null` when the notes say nothing. */
export function nightQuality(n: Night): Quality | null {
  const good = n.tags.includes("rested");
  const poor = n.tags.some((t) => t === "unrested" || t === "wokeOften" || t === "coldSweat" || t === "nausea");
  if (poor && !good) return "poor";
  if (good && !poor && !isFragmented(n)) return "good";
  if (good || poor || isFragmented(n)) return "mixed";
  return null;
}

export interface Summary {
  days: number;
  /** Every dated row in range (logged or note-only) — used for mood/appetite tallies. */
  window: Night[];
  /** Logged nights in range, oldest first. Unlogged/empty nights are excluded entirely. */
  nights: Night[];
  avgHours: number | null;
  minHours: number | null;
  maxHours: number | null;
  fragmented: number;
  avgExtraHours: number | null;
  quality: Record<Quality, number>;
  moodUp: number;
  moodDown: number;
  goodAppetite: number;
  poorAppetite: number;
  body: Partial<Record<TagKey, number>>;
}

const isoOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Inclusive window of the last `days` calendar days ending `today`. */
export function inRange(all: Night[], days: number, today: Date): Night[] {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1));
  const lo = isoOf(start), hi = isoOf(today);
  return all.filter((n) => n.iso >= lo && n.iso <= hi);
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function summarise(all: Night[], days: number, today: Date): Summary {
  const window = inRange(all, days, today);
  const nights = window.filter(isLogged);
  const totals = nights.map(totalHours);
  const frag = nights.filter(isFragmented);
  const has = (n: Night, ks: TagKey[]) => ks.some((k) => n.tags.includes(k));
  const quality: Record<Quality, number> = { good: 0, mixed: 0, poor: 0 };
  for (const n of nights) {
    const q = nightQuality(n);
    if (q) quality[q]++;
  }
  const body: Partial<Record<TagKey, number>> = {};
  for (const n of window) for (const k of BODY) if (n.tags.includes(k)) body[k] = (body[k] ?? 0) + 1;
  return {
    days,
    window,
    nights,
    avgHours: mean(totals),
    minHours: totals.length ? Math.min(...totals) : null,
    maxHours: totals.length ? Math.max(...totals) : null,
    fragmented: frag.length,
    avgExtraHours: mean(frag.map((n) => n.extraHours)),
    quality,
    // Mood/appetite count every dated row in range (notes can exist without sleep numbers).
    moodUp: window.filter((n) => has(n, MOOD_UP)).length,
    moodDown: window.filter((n) => has(n, MOOD_DOWN)).length,
    goodAppetite: window.filter((n) => n.tags.includes("goodAppetite")).length,
    poorAppetite: window.filter((n) => n.tags.includes("poorAppetite")).length,
    body,
  };
}
