/** Time helpers. All clock values are minutes after midnight (0–1439). */

export function parseClock(s: string): number | null {
  const m = s.trim().match(/^(\d{1,2})[:.](\d{2})$/);
  if (!m) return null;
  const h = +m[1], min = +m[2];
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** Hours between two clock times, wrapping past midnight. */
export function spanHours(start: number, end: number): number {
  const d = (end - start + 1440) % 1440;
  return d / 60;
}

export interface Segment { start: number; end: number }

const NUM = String.raw`(\d{1,2})(?:[.:](\d{2}))?\s*(am|pm)?`;
const RANGE = new RegExp(
  NUM + String.raw`\s*(?:-|–|—|to)\s*` + NUM + String.raw`(?!\s*(?:hours?|hrs?|h\b|mins?|minutes?|\d))`,
  "gi",
);
const SLEEP_WORD = /\b(?:slept|sleep|sleeping|napped|nap)\b/i;

function toMinutes(h: number, m: number, ap: string | undefined): number | null {
  if (m > 59) return null;
  if (ap) {
    if (h < 1 || h > 12) return null;
    const a = ap.toLowerCase();
    if (a === "am") h = h === 12 ? 0 : h;
    else h = h === 12 ? 12 : h + 12;
  } else if (h > 23) return null;
  return h * 60 + m;
}

/**
 * Extract sleep time-ranges from free text, e.g.
 * "went back to sleep from 6.30-7.30, 8-10am" → [06:30–07:30, 08:00–10:00].
 * Only ranges inside a clause that mentions sleep are returned. Ranges followed by a
 * unit ("1-2 hours", "30-45mins") are ignored. A missing am/pm is inherited from the
 * range end, else read as a 24h/morning clock.
 */
export function extractSleepSegments(text: string): Segment[] {
  const out: Segment[] = [];
  // Clauses: split on newlines, " / " joins, ";" and sentence ends (". " but not "6.30").
  const clauses = text.split(/\n|\s\/\s|;|\.(?=\s|$)/);
  for (const clause of clauses) {
    const kw = clause.search(SLEEP_WORD);
    if (kw < 0) continue;
    const tail = clause.slice(kw);
    for (const m of tail.matchAll(RANGE)) {
      const [, h1, m1, ap1, h2, m2, ap2] = m;
      const endAp = ap2 ?? undefined;
      const startAp = ap1 ?? endAp;
      let start = toMinutes(+h1, +(m1 ?? 0), startAp);
      const end = toMinutes(+h2, +(m2 ?? 0), endAp);
      if (start === null || end === null) continue;
      // "11-1am" style: inherited suffix made the start later than the end → try the other half.
      if (!ap1 && endAp && start > end) start = (start + 720) % 1440;
      if (end <= start) continue;
      out.push({ start, end });
    }
  }
  return out;
}
