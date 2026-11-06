import { isFragmented, isLogged, totalHours, type Night } from "./parse";
import { appetiteState, BODY, MOOD_DOWN, MOOD_UP, type TagKey } from "./keywords";

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

export interface AppetiteCounts {
  good: number;
  mixed: number;
  dipped: number;
  poor: number;
  mixedWith: "dip" | "poor" | "both" | null;
}

export function countAppetite(days: { tags: TagKey[] }[]): AppetiteCounts {
  const c: AppetiteCounts = { good: 0, mixed: 0, dipped: 0, poor: 0, mixedWith: null };
  let withDip = false, withPoor = false;
  for (const n of days) {
    const st = appetiteState(n.tags);
    if (!st) continue;
    c[st]++;
    if (st === "mixed") {
      if (n.tags.includes("dipAppetite")) withDip = true;
      if (n.tags.includes("poorAppetite")) withPoor = true;
    }
  }
  if (c.mixed) c.mixedWith = withDip && withPoor ? "both" : withDip ? "dip" : "poor";
  return c;
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
  /** Days per appetite state (one state per day). `mixedWith`: what the good days were mixed with. */
  appetite: AppetiteCounts;
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
    appetite: countAppetite(window),
    body,
  };
}

/** What the night-by-night chart plots: total sleep, broken vs unbroken nights, or back-to-sleep hours. */
export const CHART_VIEWS = ["total", "broken", "extra"] as const;
export type ChartView = (typeof CHART_VIEWS)[number];
export type BarKind = "total" | "broken" | "whole" | "extra";

/** The single bar drawn for a logged night in a view; `null` = nothing to draw (no back-to-sleep). */
export function barFor(n: Night, view: ChartView): { hours: number; kind: BarKind } | null {
  if (view === "total") return { hours: totalHours(n), kind: "total" };
  if (view === "broken") return { hours: totalHours(n), kind: isFragmented(n) ? "broken" : "whole" };
  return n.extraHours > 0 ? { hours: n.extraHours, kind: "extra" } : null;
}

/** Y-axis top + tick step for a view: 12 h minimum for whole nights, 4 h minimum for back-to-sleep. */
export function chartScale(maxHours: number, view: ChartView): { maxY: number; step: number } {
  if (view === "extra") {
    const maxY = Math.max(4, Math.ceil(maxHours / 2) * 2);
    return { maxY, step: maxY <= 4 ? 1 : 2 };
  }
  return { maxY: Math.max(12, Math.ceil(maxHours / 2) * 2), step: 4 };
}

/** Logged nights with at least one back-to-sleep segment. */
export const brokenCount = (nights: Night[]) => nights.filter(isFragmented).length;
