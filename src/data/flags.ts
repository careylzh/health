/**
 * Highlighted days (decisions 0008, 0009). Carey shades rows in the year tab; the Sleep Log bot
 * copies the colours into a `flags` tab as `Date, Flag, Note` (ISO date; severe | nosleep |
 * green), because the gviz feed carries values only. Green has no fixed meaning (a good streak OR
 * a med/supplement change); its Note says what the row was and is shown only behind the passcode.
 */
import { parseCsv } from "./csv";
import { SHEET_ID } from "./sheet";

export const FLAGS = ["severe", "nosleep", "green"] as const;
export type Flag = (typeof FLAGS)[number];

export const flagsUrl = () =>
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=flags`;

export interface FlagData {
  /** date -> flags, most serious first */
  byDay: Map<string, Flag[]>;
  /** date -> what the green row(s) said (passcode page only) */
  notes: Map<string, string>;
}

export const noFlags = (): FlagData => ({ byDay: new Map(), notes: new Map() });

/**
 * `flags` tab CSV -> flags and green notes. gviz returns the FIRST tab when `flags` is missing,
 * so anything without the exact `Date, Flag` header is treated as "no flags yet". The old flag
 * name `good` (before decision 0009) reads as `green`.
 */
export function parseFlags(csv: string): FlagData {
  const rows = parseCsv(csv);
  const out = noFlags();
  const head = (rows[0] ?? []).map((c) => c.trim().toLowerCase());
  if (head[0] !== "date" || head[1] !== "flag") return out;
  for (const r of rows.slice(1)) {
    const iso = (r[0] ?? "").trim();
    const raw = (r[1] ?? "").trim();
    const flag = (raw === "good" ? "green" : raw) as Flag;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || !FLAGS.includes(flag)) continue;
    const list = out.byDay.get(iso) ?? [];
    if (!list.includes(flag)) list.push(flag);
    out.byDay.set(iso, list.sort((a, b) => FLAGS.indexOf(a) - FLAGS.indexOf(b)));
    const note = head[2] === "note" ? (r[2] ?? "").trim() : "";
    if (flag === "green" && note) out.notes.set(iso, note);
  }
  return out;
}

export async function loadFlags(fetchText: (url: string) => Promise<string>): Promise<FlagData> {
  try {
    return parseFlags(await fetchText(flagsUrl()));
  } catch {
    return noFlags(); // flags are extra: the sleep pages still work without them
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
  const counts: Record<Flag, number> = { severe: 0, nosleep: 0, green: 0 };
  const list: FlagSummary["days"] = [];
  for (let k = days - 1; k >= 0; k--) {
    const iso = isoOf(new Date(today.getFullYear(), today.getMonth(), today.getDate() - k));
    const f = flags.get(iso) ?? [];
    for (const x of f) counts[x]++;
    list.push({ iso, flags: f });
  }
  return { counts, days: list };
}
