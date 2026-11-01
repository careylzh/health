/** Header key phrases (case/whitespace-insensitive "contains" match). See docs/decisions/0002. */
export const COLUMN_KEYS = {
  date: "date",
  duration: "duration",
  sleep: "sleep time",
  wake: "wake time",
  positive: "positive",
  negative: "negative",
  remarks: "remark",
} as const;

export type ColumnName = keyof typeof COLUMN_KEYS;
export type ColumnIndex = Record<ColumnName, number>;

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

export function indexColumns(header: string[]): ColumnIndex {
  const h = header.map(norm);
  const out = {} as ColumnIndex;
  for (const [name, key] of Object.entries(COLUMN_KEYS) as [ColumnName, string][]) {
    out[name] = h.findIndex((c) => c.includes(key));
  }
  if (out.date < 0) throw new Error("Sheet has no 'Dates' column");
  return out;
}
