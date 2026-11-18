/**
 * Medication changes from the "Pharmacology last night" column (decision 0008). Only the
 * passcode-gated meds page uses this. Two keywords, both literal:
 * - Lithium: "Li 200mg", "lithium 400mg", "missed lithium 400mg". Carey's shorthand
 *   "resumed 200mg" (no drug named) also counts as lithium.
 * - Mirtazapine, taken as needed: "Mirt 7.5mg", "Mirt (7.5mg)", "mirt 7.5", "Mirt 15".
 *   "…from 3.75mg to 0mg" is a stop, not a dose.
 * A blank pharmacology day means "no change" (Carey, 2026-11-18): lithium carries the last
 * written state forward until the column says otherwise. As-needed mirtazapine is per night, so a
 * blank night is a night without it.
 */
import type { Night } from "./parse";

export type LiState = { kind: "taken"; mg: number | null } | { kind: "missed"; mg: number | null };
export interface DayMeds { li: LiState | null; mirtMg: number | null }

const MISSED = /\b(missed|skipped|forgot|forgotten|didn'?t take|did not take)\b/i;
const LI = /\b(li|lithium)\b/i;
const MIRT = /\b(mirt|mirtazapine)\b/i;
const MG = /(\d+(?:\.\d+)?)\s*mg/i;
const BARE_RESUMED = /^\s*resumed\s+(\d+(?:\.\d+)?)\s*mg\s*(?:\([^)]*\))?\s*$/i; // the whole clause

/** Clauses: commas, semicolons, slashes, line breaks, "then" and "and" separate meds. */
const clauses = (text: string) =>
  text.split(/[,;\n/]|\bthen\b|\band\b/i).map((c) => c.trim()).filter(Boolean);

export function parseMeds(text: string): DayMeds {
  let li: LiState | null = null;
  let mirtMg: number | null = null;
  for (const c of clauses(text)) {
    const missed = MISSED.test(c);
    const liHit = LI.exec(c);
    const bare = !liHit && !MIRT.test(c) ? BARE_RESUMED.exec(c) : null;
    if (liHit || bare) {
      const after = liHit ? c.slice(liHit.index) : c;
      const dose = MG.exec(after);
      const mg = dose ? Number(dose[1]) : bare ? Number(bare[1]) : null;
      const st: LiState = { kind: missed ? "missed" : "taken", mg };
      // Taken beats missed on the same day; the larger noted dose wins.
      if (!li || (li.kind === "missed" && st.kind === "taken") || (li.kind === st.kind && (st.mg ?? 0) > (li.mg ?? 0))) li = st;
    }
    const m = MIRT.exec(c);
    if (m && !missed) {
      const after = c.slice(m.index + m[0].length);
      const to = /\bto\s*(\d+(?:\.\d+)?)\s*mg/i.exec(after);
      const first = /(\d+(?:\.\d+)?)(?!\s*(?:am|pm|\d))/i.exec(after);
      const mg = to ? Number(to[1]) : first ? Number(first[1]) : null;
      if (mg !== null && mg > 0) mirtMg = Math.max(mirtMg ?? 0, mg);
    }
  }
  return { li, mirtMg };
}

export interface LiRun {
  from: string;
  /** Last day of the run: the day before the next change, or today for the current run. */
  to: string;
  state: LiState;
  /** Days something was written inside the run. */
  noted: number;
  /** Last day something was written inside the run. */
  lastNoted: string;
  ongoing: boolean;
}

const pad = (n: number) => String(n).padStart(2, "0");
export const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const addDays = (iso: string, k: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  return isoOf(new Date(y, m - 1, d + k));
};

const sameLi = (a: LiState, b: LiState) => a.kind === b.kind && (a.kind === "missed" || a.mg === b.mg || a.mg === null || b.mg === null);

/** Lithium as runs of the same state, oldest first (Carey, 2026-11-18). A blank day is "no
 *  change": the dose carries forward until something different is written. A "missed" note
 *  covers its own day; blank days after it count as missed only when the next lithium note is
 *  another miss or a "resumed …" (resuming means it was paused), otherwise they return to the
 *  dose before the miss. The last run lasts until today. */
export function lithiumRuns(nights: Night[], today: Date): LiRun[] {
  const noted = nights
    .map((n) => ({ iso: n.iso, li: parseMeds(n.pharm).li, resumed: /\bresum/i.test(n.pharm) }))
    .filter((x): x is { iso: string; li: LiState; resumed: boolean } => x.li !== null);
  if (!noted.length) return [];
  const end = isoOf(today) > noted[noted.length - 1].iso ? isoOf(today) : noted[noted.length - 1].iso;
  const runs: LiRun[] = [];
  let k = 0;
  let state: LiState = noted[0].li;
  let lastDose: LiState | null = null;
  for (let iso = noted[0].iso; iso <= end; iso = addDays(iso, 1)) {
    const written = noted[k]?.iso === iso ? noted[k++] : null;
    if (written) {
      state = written.li.kind === "taken" && written.li.mg === null && lastDose ? lastDose : written.li;
    } else if (state.kind === "missed") {
      const next = noted[k];
      const stillOff = next && (next.li.kind === "missed" || next.resumed);
      if (!stillOff && lastDose) state = lastDose;
    }
    if (state.kind === "taken") lastDose = state;
    const last = runs[runs.length - 1];
    if (last && sameLi(last.state, state)) {
      last.to = iso;
      if (written) { last.noted++; last.lastNoted = iso; }
      if (last.state.mg === null && state.mg !== null) last.state = state;
    } else {
      runs.push({ from: iso, to: iso, state, noted: written ? 1 : 0, lastNoted: written ? iso : "", ongoing: false });
    }
  }
  runs[runs.length - 1].ongoing = true;
  return runs;
}

/** Lithium state on a day, carried forward from the last note (null before the first note). */
export function lithiumOn(runs: LiRun[], iso: string): LiState | null {
  const r = runs.find((x) => x.from <= iso && iso <= x.to);
  return r ? r.state : null;
}

export interface MedsSummary {
  days: number;
  liTaken: number;
  liMissed: number;
  mirtNights: number;
  /** [dose mg, nights], most-used first. */
  mirtDoses: [number, number][];
  lastMirt: string | null;
}

/** Counts over the `days` calendar days ending today. Lithium uses the carried-forward state. */
export function summariseMeds(nights: Night[], runs: LiRun[], days: number, today: Date): MedsSummary {
  const end = isoOf(today), start = addDays(end, -(days - 1));
  let liTaken = 0, liMissed = 0;
  for (let iso = start; iso <= end; iso = addDays(iso, 1)) {
    const li = lithiumOn(runs, iso);
    if (li?.kind === "taken") liTaken++;
    if (li?.kind === "missed") liMissed++;
  }
  const doses = new Map<number, number>();
  let lastMirt: string | null = null;
  for (const n of nights) {
    if (n.iso < start || n.iso > end) continue;
    const { mirtMg } = parseMeds(n.pharm);
    if (mirtMg !== null) {
      doses.set(mirtMg, (doses.get(mirtMg) ?? 0) + 1);
      if (!lastMirt || n.iso > lastMirt) lastMirt = n.iso;
    }
  }
  const mirtDoses = [...doses].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  return { days, liTaken, liMissed, mirtNights: mirtDoses.reduce((a, [, k]) => a + k, 0), mirtDoses, lastMirt };
}
