/**
 * Highlighted days (decision 0008). Carey shades rows in the year tab; the Sleep Log bot copies
 * the colours into a `flags` tab as `Date, Flag` (ISO date; severe | nosleep | good), because the
 * gviz feed carries values only. No note text is ever in that tab.
 */
import { parseCsv } from "./csv";
import { SHEET_ID } from "./sheet";

export const FLAGS = ["severe", "nosleep", "good"] as const;
export type Flag = (typeof FLAGS)[number];

export const flagsUrl = () =>
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=flags`;

/**
 * `flags` tab CSV -> date -> flags (most serious first). gviz returns the FIRST tab when `flags`
 * is missing, so anything without the exact `Date, Flag` header is treated as "no flags yet".
 */
export function parseFlags(csv: string): Map<string, Flag[]> {
  const rows = parseCsv(csv);
  const out = new Map<string, Flag[]>();
  const head = (rows[0] ?? []).map((c) => c.trim().toLowerCase());
  if (head[0] !== "date" || head[1] !== "flag") return out;
  for (const r of rows.slice(1)) {
    const iso = (r[0] ?? "").trim();
    const flag = (r[1] ?? "").trim() as Flag;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || !FLAGS.includes(flag)) continue;
    const list = out.get(iso) ?? [];
    if (!list.includes(flag)) list.push(flag);
    out.set(iso, list.sort((a, b) => FLAGS.indexOf(a) - FLAGS.indexOf(b)));
  }
  return out;
}

export async function loadFlags(fetchText: (url: string) => Promise<string>): Promise<Map<string, Flag[]>> {
  try {
    return parseFlags(await fetchText(flagsUrl()));
  } catch {
    return new Map(); // flags are extra: the sleep pages still work without them
  }
}

export interface FlagSummary {
  /** Days in range carrying each flag. */
  counts: Record<Flag, number>;
  /** Every day of the range, oldest first, with its flags (empty = none). */
  days: { iso: string; flags: Flag[] }[];
}

const isoOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** The `days` days ending today. */
export function summariseFlags(flags: Map<string, Flag[]>, days: number, today: Date): FlagSummary {
  const counts: Record<Flag, number> = { severe: 0, nosleep: 0, good: 0 };
  const list: FlagSummary["days"] = [];
  for (let k = days - 1; k >= 0; k--) {
    const iso = isoOf(new Date(today.getFullYear(), today.getMonth(), today.getDate() - k));
    const f = flags.get(iso) ?? [];
    for (const x of f) counts[x]++;
    list.push({ iso, flags: f });
  }
  return { counts, days: list };
}
