/**
 * "Since starting X" (decision 0009): the green-day timeline, a day counter for a tracked
 * treatment (TCM), and a before/since comparison that refuses to compare when the earlier
 * stretch has too few logged nights. Honest numbers: counts and averages only, no verdicts.
 */
import { isFragmented, totalHours, type Night } from "./parse";
import type { Flag } from "./flags";
import { addDays, isoOf, type LiRun } from "./meds";

export interface GreenEntry { from: string; to: string; note: string }

/** Green notes grouped: consecutive days with the same note become one entry, oldest first. */
export function greenTimeline(notes: Map<string, string>): GreenEntry[] {
  const out: GreenEntry[] = [];
  for (const iso of [...notes.keys()].sort()) {
    const note = notes.get(iso)!;
    const last = out[out.length - 1];
    if (last && last.note === note && addDays(last.to, 1) === iso) last.to = iso;
    else out.push({ from: iso, to: iso, note });
  }
  return out;
}

/** Treatments with a day counter. The start is the first green note that says it started. */
export const TRACKED = [{ key: "tcm", match: /\btcm\b/i }] as const;
export type TrackedKey = (typeof TRACKED)[number]["key"];
const STARTED = /\b(start|started|starting|began|begin)\b/i;

export function trackedStart(entries: GreenEntry[], match: RegExp): string | null {
  return entries.find((e) => STARTED.test(e.note) && match.test(e.note))?.from ?? null;
}

/** Day 1 = the start day. */
export function dayNumber(fromIso: string, today: Date): number {
  const [y, m, d] = fromIso.split("-").map(Number);
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((t.getTime() - new Date(y, m - 1, d).getTime()) / 86400000) + 1;
}

export interface PeriodStats {
  from: string;
  to: string;
  days: number;
  logged: number;
  avgHours: number | null;
  broken: number;
  /** Days marked severe or no-sleep in the sheet. */
  redDays: number;
  lowMood: number;
  goodMood: number;
}

export function periodStats(nights: Night[], byDay: Map<string, Flag[]>, from: string, to: string): PeriodStats {
  const inside = nights.filter((n) => n.iso >= from && n.iso <= to);
  const logged = inside.filter((n) => n.mainHours !== null);
  let days = 0, redDays = 0;
  for (let iso = from; iso <= to; iso = addDays(iso, 1)) {
    days++;
    if ((byDay.get(iso) ?? []).some((f) => f === "severe" || f === "nosleep")) redDays++;
  }
  return {
    from, to, days,
    logged: logged.length,
    avgHours: logged.length ? logged.reduce((a, n) => a + totalHours(n), 0) / logged.length : null,
    broken: logged.filter(isFragmented).length,
    redDays,
    lowMood: inside.filter((n) => n.tags.includes("lowMood")).length,
    goodMood: inside.filter((n) => n.tags.includes("goodMood")).length,
  };
}

export interface Comparison {
  since: PeriodStats;
  /** The same number of days just before the start. */
  before: PeriodStats;
  /** Both sides have at least `minLogged` logged nights. */
  enough: boolean;
  /** Lithium changes after the start: they muddy any before/since difference. */
  liChanges: LiRun[];
}

export const MIN_LOGGED = 10;

export function compareSince(
  nights: Night[], byDay: Map<string, Flag[]>, runs: LiRun[], start: string, today: Date, minLogged = MIN_LOGGED,
): Comparison {
  const end = isoOf(today);
  const since = periodStats(nights, byDay, start, end);
  const before = periodStats(nights, byDay, addDays(start, -since.days), addDays(start, -1));
  return {
    since,
    before,
    enough: since.logged >= minLogged && before.logged >= minLogged,
    liChanges: runs.filter((r) => r.from > start && r.from <= end),
  };
}
