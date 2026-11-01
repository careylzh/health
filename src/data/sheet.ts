import { parseSheet, type Night } from "./parse";

export const SHEET_ID = "12db7k6f9WWKvmAUTc88vLocgiRUHWAgPxtoF8DnjGEU";

export const tabUrl = (year: number) =>
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${year}`;

type Fetcher = (url: string) => Promise<string>;

const defaultFetch: Fetcher = async (url) => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
  return res.text();
};

const isoOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * Load nights from the current-year tab plus the previous year's (for ranges across New Year).
 * gviz returns the FIRST tab for an unknown sheet name, so two identical responses mean only
 * one tab exists: keep the year under which no date lands in the future.
 */
export async function loadNights(today: Date, fetchText: Fetcher = defaultFetch): Promise<Night[]> {
  const year = today.getFullYear();
  const [cur, prev] = await Promise.all([
    fetchText(tabUrl(year)).catch(() => null),
    fetchText(tabUrl(year - 1)).catch(() => null),
  ]);
  if (cur === null && prev === null) throw new Error("Could not reach the sheet");

  const tomorrow = isoOf(new Date(year, today.getMonth(), today.getDate() + 1));
  // Only LOGGED nights count: the sheet pre-fills future dates with empty 0.00 placeholder rows.
  const hasFuture = (ns: Night[]) => ns.some((n) => n.mainHours !== null && n.iso > tomorrow);

  let sets: Night[][];
  if (cur !== null && prev !== null && cur === prev) {
    const asCur = parseSheet(cur, year);
    sets = [hasFuture(asCur) ? parseSheet(cur, year - 1) : asCur];
  } else {
    sets = [prev !== null ? parseSheet(prev, year - 1) : [], cur !== null ? parseSheet(cur, year) : []];
  }

  // Merge by date; a later set only fills dates the earlier one lacks data for.
  const byIso = new Map<string, Night>();
  for (const set of sets) {
    for (const n of set) {
      const old = byIso.get(n.iso);
      if (!old || (old.mainHours === null && n.mainHours !== null)) byIso.set(n.iso, n);
    }
  }
  return [...byIso.values()].filter((n) => n.iso <= tomorrow).sort((a, b) => a.iso.localeCompare(b.iso));
}
