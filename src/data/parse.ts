import { parseCsv } from "./csv";
import { indexColumns } from "./columns";
import { extractSleepSegments, parseClock, spanHours, type Segment } from "./time";
import { datedTags, type TagKey } from "./keywords";

export interface Night {
  /** Local date of the log row, `YYYY-MM-DD` (the morning after the night). */
  iso: string;
  /** Main sleep block in hours; `null` = not logged (excluded from every average and chart). */
  mainHours: number | null;
  /** Extra sleep after the main wake time ("went back to sleep from 6.30-10am"). */
  extraHours: number;
  segments: Segment[];
  sleepTime: number | null;
  wakeTime: number | null;
  tags: TagKey[];
}

export const totalHours = (n: Night) => (n.mainHours ?? 0) + n.extraHours;
export const isLogged = (n: Night) => n.mainHours !== null;
export const isFragmented = (n: Night) => n.segments.length > 0;

const pad = (n: number) => String(n).padStart(2, "0");
export const isoDate = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
const ymd = (d: Date): [number, number, number] => [d.getFullYear(), d.getMonth() + 1, d.getDate()];

/** Latest start (minutes) for a segment to count as "went back to sleep" rather than a nap. */
const EXTRA_LATEST_START = 14 * 60;

interface RawRow { day: number; month: number; year?: number; cells: Record<string, string> }

function parseDateCell(s: string): { day: number; month: number; year?: number } | null {
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?$/);
  if (!m) return null;
  const day = +m[1], month = +m[2];
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const year = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : undefined;
  return { day, month, year };
}

/**
 * Parse one year-tab's CSV into nights. See docs/decisions/0002-data-source.md for every rule.
 */
export function parseSheet(csv: string, tabYear: number): Night[] {
  const rows = parseCsv(csv);
  if (!rows.length) return [];
  const col = indexColumns(rows[0]);
  const get = (r: string[], i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");

  const raw: RawRow[] = [];
  for (const r of rows.slice(1)) {
    const d = parseDateCell(get(r, col.date));
    if (!d) continue; // empty / undated rows carry no night
    raw.push({
      ...d,
      cells: {
        duration: get(r, col.duration),
        sleep: get(r, col.sleep),
        wake: get(r, col.wake),
        notes: [get(r, col.positive), get(r, col.negative), get(r, col.remarks)].filter(Boolean).join("\n"),
      },
    });
  }

  // Year inference: Nov/Dec rows at the TOP of a tab (before any Jan–Oct row) are last year's
  // carry-over. Once any Jan–Oct row is seen, later Nov/Dec rows are this year's — even in a tab
  // with no Jan/Feb rows at all.
  let seenEarly = false;
  const byIso = new Map<string, { duration: number | null; sleep: number | null; wake: number | null; notes: string[] }>();
  for (const r of raw) {
    if (r.month <= 10) seenEarly = true;
    const year = r.year ?? (!seenEarly && r.month >= 11 ? tabYear - 1 : tabYear);
    const iso = isoDate(year, r.month, r.day);
    const dur = parseFloat(r.cells.duration);
    const entry = {
      duration: Number.isFinite(dur) && dur > 0 ? dur : null,
      sleep: parseClock(r.cells.sleep),
      wake: parseClock(r.cells.wake),
    };
    const prev = byIso.get(iso);
    if (!prev) byIso.set(iso, { ...entry, notes: r.cells.notes ? [r.cells.notes] : [] });
    else {
      // Duplicate date: the row with sleep data wins for numbers; notes are concatenated.
      prev.duration ??= entry.duration;
      prev.sleep ??= entry.sleep;
      prev.wake ??= entry.wake;
      if (r.cells.notes) prev.notes.push(r.cells.notes);
    }
  }

  // Tags go to the days their time phrase names ("a dip the past 2 days" → this row and the one
  // before). A named day with no row of its own becomes a note-only day (sleep not logged).
  const tagsByIso = new Map<string, Set<TagKey>>();
  for (const [iso, e] of byIso) {
    const [y, m, d] = iso.split("-").map(Number);
    for (const [off, tags] of datedTags(e.notes.join("\n"), new Date(y, m - 1, d))) {
      const target = isoDate(...ymd(new Date(y, m - 1, d + off)));
      if (!tagsByIso.has(target)) tagsByIso.set(target, new Set());
      for (const t of tags) tagsByIso.get(target)!.add(t);
    }
  }

  const nights: Night[] = [];
  for (const iso of tagsByIso.keys()) {
    if (!byIso.has(iso)) byIso.set(iso, { duration: null, sleep: null, wake: null, notes: [] });
  }
  for (const [iso, e] of byIso) {
    let main = e.duration;
    if (main === null && e.sleep !== null && e.wake !== null && e.sleep !== e.wake) {
      main = spanHours(e.sleep, e.wake);
    }
    const notes = e.notes.join("\n");
    const segments =
      main !== null && e.wake !== null
        ? extractSleepSegments(notes).filter((s) => s.start >= e.wake! && s.start < EXTRA_LATEST_START)
        : [];
    const extra = segments.reduce((a, s) => a + (s.end - s.start) / 60, 0);
    nights.push({
      iso,
      mainHours: main,
      extraHours: extra,
      segments,
      sleepTime: e.sleep,
      wakeTime: e.wake,
      tags: [...(tagsByIso.get(iso) ?? [])],
    });
  }
  return nights.sort((a, b) => a.iso.localeCompare(b.iso));
}
