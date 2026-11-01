/**
 * Time phrases → which days a note is about, as day offsets from the row's date (0 = the row,
 * -1 = the day before). Rules (docs/decisions/0002-data-source.md):
 *  - "past/last N days", "for N days", "N days in a row", 过去/最近/连续 N 天 → the N days ENDING on
 *    the row (the row counts as one of them): "past 2 days" on 2 Nov = 1–2 Nov.
 *  - "yesterday"/昨天 → -1 only · "day before yesterday"/前天 → -2 only · "N days ago"/N天前 → -N.
 *  - "since yesterday"/从昨天开始 → -1 and 0 · "since Monday" → that weekday (before the row) to the row.
 *  - "past/the last week" → 7 days · "past fortnight"/"past N weeks" → 7N days · "this week"/这周 →
 *    Monday to the row · bare "last week"/上周 → the previous Monday–Sunday.
 *  - "today", "last night" (the night this row logs), 今天, 昨晚 → 0.
 *  - A span followed by before/after/until/of ("for 8 days before the symptoms", "3 days of
 *    meds") relates two events; it is not when the noted condition happened → ignored.
 *  - Vague counts ("a few days", "several days", "lately", 这几天) are NOT guessed → null, and the
 *    note stays on its own row.
 */

const WORDS: Record<string, number> = {
  one: 1, a: 1, an: 1, two: 2, couple: 2, "a couple of": 2, "a couple": 2, "couple of": 2, three: 3,
  four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  thirteen: 13, fourteen: 14,
};
const ZH_NUM: Record<string, number> = { 一: 1, 两: 2, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
const MAX_DAYS = 31;

const N_EN = String.raw`(\d{1,2}|a couple of|a couple|couple of|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen)`;
const N_ZH = String.raw`(\d{1,2}|[一两二三四五六七八九十])`;
const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const WD = String.raw`(sun|mon|tues?|wed(?:nes)?|thu(?:rs?)?|fri|sat(?:ur)?)(?:day)?`;
const ZH_WD = String.raw`(?:周|星期|礼拜)([一二三四五六日天])`;
const ZH_WD_IDX: Record<string, number> = { 日: 0, 天: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6 };

const num = (s: string) => (/^\d+$/.test(s) ? +s : WORDS[s.toLowerCase()] ?? ZH_NUM[s] ?? NaN);
const span = (n: number) => (n >= 1 && n <= MAX_DAYS ? Array.from({ length: n }, (_, i) => i - n + 1) : null);
const range = (from: number, to: number) => (from <= to ? Array.from({ length: to - from + 1 }, (_, i) => from + i) : null);
const wdIndex = (s: string) => WEEKDAYS.findIndex((w) => w.startsWith(s.toLowerCase().slice(0, 3)));
/** Offset of the most recent given weekday strictly before the row. */
const lastWeekday = (row: Date, wd: number) => -(((row.getDay() - wd + 7) % 7) || 7);
const mondayOffset = (row: Date) => -((row.getDay() + 6) % 7);

type Rule = [RegExp, (m: RegExpMatchArray, row: Date) => number[] | null];

// Order matters: specific before general ("day before yesterday" before "yesterday").
const RULES: Rule[] = [
  [/\b(?:a few|few|several|some|many|couple of few)\s+(?:days|nights|weeks)\b|\blately\b|\brecently\b|这几天|最近几天|这些天|前几天/i, () => null],
  [/\b(?:the\s+)?day before yesterday\b|大前天/i, (m) => (m[0].includes("大") ? [-3] : [-2])],
  [/前天/, () => [-2]],
  [/\b(?:since|from)\s+yesterday\b|(?:从|自)?昨天(?:开始|起|以来)/i, () => [-1, 0]],
  [/\byesterday\b|昨天|昨日/i, () => [-1]],
  [/\btoday\b|\btonight\b|\bthis (?:morning|afternoon|evening)\b|\blast night\b|今天|今晚|今早|昨晚|昨夜/i, () => [0]],
  [re(String.raw`\b${N_EN}\s+(?:days?|nights?)\s+ago\b`), (m) => { const n = num(m[1]); return n <= MAX_DAYS ? [-n] : null; }],
  [re(String.raw`${N_ZH}\s*(?:天|日)前`), (m) => { const n = num(m[1]); return n <= MAX_DAYS ? [-n] : null; }],
  [re(String.raw`\b(?:(?:over|in|for|during)\s+)?(?:the\s+)?(?:past|last|previous)\s+${N_EN}\s+(?:days?|nights?)\b|\bthese\s+${N_EN}\s+(?:days|nights)\b|\bfor\s+${N_EN}\s+(?:days?|nights?)\b|\b${N_EN}\s+(?:days?|nights?)\s+(?:now|straight|in a row|running)\b`),
    (m) => span(num(m.slice(1).find(Boolean)!))],
  [re(String.raw`(?:过去|最近|近|这|连续|一连)\s*${N_ZH}\s*(?:天|晚|日|个晚上)`), (m) => span(num(m[1]))],
  [re(String.raw`\b(?:(?:over|in|for|during)\s+)?(?:the|this)\s+(?:past|last)\s+week\b|\bpast\s+week\b|\bthe\s+last\s+week\b`), () => span(7)],
  [re(String.raw`\b(?:(?:over|in|for|during)\s+)?(?:the\s+)?(?:past|last)\s+fortnight\b`), () => span(14)],
  [re(String.raw`\b(?:(?:over|in|for|during)\s+)?(?:the\s+)?(?:past|last)\s+${N_EN}\s+weeks?\b`), (m) => { const n = num(m[1]); return n <= 4 ? span(7 * n) : null; }],
  [/(?:过去|最近)(?:一|1)?(?:周|个?星期|个?礼拜)/, () => span(7)],
  [/\bthis week\b|这周|本周|这个星期|这星期/i, (_m, row) => range(mondayOffset(row), 0)],
  [/\blast week\b|上周|上个?星期|上个?礼拜/i, (_m, row) => range(mondayOffset(row) - 7, mondayOffset(row) - 1)],
  [re(String.raw`\bsince\s+(?:last\s+)?${WD}\b`), (m, row) => range(lastWeekday(row, wdIndex(m[1])), 0)],
  [re(String.raw`(?:从|自)${ZH_WD}(?:开始|起|以来)?`), (m, row) => range(lastWeekday(row, ZH_WD_IDX[m[1]]), 0)],
  [re(String.raw`\b(?:on|last)\s+${WD}\b`), (m, row) => [lastWeekday(row, wdIndex(m[1]))]],
];

function re(src: string) {
  return new RegExp(src, "i");
}

/**
 * The first time phrase in `text`: `null` = no phrase; `{ days: null }` = a vague phrase (keep the
 * row, and do not let a sentence-opening phrase override it); otherwise the day offsets.
 */
export function timePhrase(text: string, row: Date): { days: number[] | null } | null {
  let best: { at: number; days: number[] | null } | null = null;
  for (const [r, f] of RULES) {
    const g = new RegExp(r.source, r.flags.includes("g") ? r.flags : r.flags + "g");
    for (const m of text.matchAll(g)) {
      // "for 8 days before the symptoms", "3 days of meds", "2 days after starting": the span
      // belongs to another event, not to what the note describes — not a time for the tag.
      if (RELATIONAL_AFTER.test(text.slice(m.index! + m[0].length))) continue;
      if (best === null || m.index! < best.at) best = { at: m.index!, days: f(m, row) };
      break;
    }
  }
  return best && { days: best.days };
}

const RELATIONAL_AFTER = /^\s*(?:before|after|until|till|prior to|of|since|into|之前|以前|之后|以后|后)/i;
