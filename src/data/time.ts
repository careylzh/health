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

// One clock time: "6", "6.30", "06:30", "6am", "7点", "7点半", "7点15分". Suffix 1/2 = start/end.
const num = (i: number) =>
  String.raw`(?<h${i}>\d{1,2})(?:[.:](?<m${i}>\d{2})|\s*[点點](?:(?<zm${i}>\d{1,2})分?|(?<half${i}>半))?)?\s*(?<ap${i}>am|pm|a\.m\.|p\.m\.)?`;
const RANGE = new RegExp(
  num(1) + String.raw`\s*(?:-|–|—|~|to|till?|until|and|到|至)\s*` + num(2) +
    String.raw`(?!\s*(?:hours?|hrs?|h\b|mins?|minutes?|小时|分钟|\d))`,
  "gi",
);
const SLEEP_WORD = /\b(?:slept|sleep(?:ing)?|asleep|nap(?:ped|ping|s)?|doz(?:e|ed|ing)(?: off)?|back to bed)\b|睡/gi;
/** A sleep word right after one of these did not happen: "couldn't sleep", "tried to sleep", "no sleep". */
const NO_SLEEP_BEFORE =
  /(?:\b(?:not|never|no|without|unable to|tried to|trying to|try to|wanted to|hard to)|n['’]t|\b(?:could|did|do|was|ca|wo)nt)(?:\s+(?:fall|get|go|back|to|any|much|really))*\s*$|(?:没有?|不能|不|无法)$/i;
const NO_SLEEP_AFTER = /^(?:不着|不了)/;
/** Text allowed between a range and a sleep word that follows it: "6.30am-8.15am slept again". */
const ADJACENT = /^[\s,-]*$/;

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
 * A range counts when it follows a sleep word in the same clause (up to the next sleep word), or
 * sits directly before one. Negated sleep ("couldn't sleep 2-4am", "tried to sleep…", 睡不着) is
 * skipped. Ranges followed by a unit ("1-2 hours") are ignored. A missing am/pm is inherited from
 * the range end, else read as a 24h/morning clock.
 */
export function extractSleepSegments(text: string): Segment[] {
  const out: Segment[] = [];
  const seen = new Set<string>();
  // Clauses: split on newlines, " / " joins, ";" and sentence ends (". " but not "6.30").
  for (const clause of text.split(/\n|\s\/\s|;|\.(?=\s|$)|。/)) {
    const kws = [...clause.matchAll(SLEEP_WORD)];
    if (!kws.length) continue;
    const ranges = [...clause.matchAll(RANGE)];
    kws.forEach((kw, i) => {
      const at = kw.index!, after = at + kw[0].length;
      if (NO_SLEEP_BEFORE.test(clause.slice(Math.max(0, at - 40), at)) || NO_SLEEP_AFTER.test(clause.slice(after))) return;
      const until = i + 1 < kws.length ? kws[i + 1].index! : clause.length;
      for (const r of ranges) {
        const rs = r.index!, re = rs + r[0].length;
        const follows = rs >= after && rs < until;
        const precedes = re <= at && ADJACENT.test(clause.slice(re, at)) && (i === 0 || rs >= kws[i - 1].index! + kws[i - 1][0].length);
        if (!follows && !precedes) continue;
        const s = toSegment(r.groups!);
        const key = `${rs}`;
        if (s && !seen.has(key + clause)) { seen.add(key + clause); out.push(s); }
      }
    });
  }
  return out;
}

function toSegment(g: Record<string, string | undefined>): Segment | null {
  const mins = (i: 1 | 2) => (g[`half${i}`] ? 30 : +(g[`m${i}`] ?? g[`zm${i}`] ?? 0));
  const ap = (i: 1 | 2) => g[`ap${i}`]?.replace(/\./g, "");
  const endAp = ap(2);
  const startAp = ap(1) ?? endAp;
  let start = toMinutes(+g.h1!, mins(1), startAp);
  const end = toMinutes(+g.h2!, mins(2), endAp);
  if (start === null || end === null) return null;
  // "11-1pm" style: inherited suffix made the start later than the end → try the other half.
  if (!ap(1) && endAp && start > end) start = (start + 720) % 1440;
  if (end <= start) return null;
  return { start, end };
}
