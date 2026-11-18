/**
 * Medication changes from the "Pharmacology last night" column (decision 0008). Only the
 * passcode-gated meds page uses this. Two keywords, both literal:
 * - Lithium: "Li 200mg", "lithium 400mg", "missed lithium 400mg". Carey's shorthand
 *   "resumed 200mg" (no drug named) also counts as lithium.
 * - Mirtazapine, taken as needed: "Mirt 7.5mg", "Mirt (7.5mg)", "mirt 7.5", "Mirt 15".
 *   "…from 3.75mg to 0mg" is a stop, not a dose.
 * A day with nothing written is "not noted", never "not taken".
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
  to: string;
  state: LiState;
  /** Days with a note inside the run (unnoted gaps do not break it). */
  noted: number;
}

const sameLi = (a: LiState, b: LiState) => a.kind === b.kind && (a.kind === "missed" || a.mg === b.mg || a.mg === null || b.mg === null);

/** Lithium as runs of the same state across all nights, oldest first. A run ends only when the
 *  noted state changes (dose or taken/missed); days with nothing written do not end it. */
export function lithiumRuns(nights: Night[]): LiRun[] {
  const runs: LiRun[] = [];
  for (const n of nights) {
    const { li } = parseMeds(n.pharm);
    if (!li) continue;
    const last = runs[runs.length - 1];
    if (last && sameLi(last.state, li)) {
      last.to = n.iso;
      last.noted++;
      if (last.state.mg === null) last.state = { ...last.state, mg: li.mg };
    } else runs.push({ from: n.iso, to: n.iso, state: li, noted: 1 });
  }
  return runs;
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

/** Counts for the selected range. `window` = every dated row in range (Summary.window). */
export function summariseMeds(window: Night[], days: number): MedsSummary {
  let liTaken = 0, liMissed = 0;
  const doses = new Map<number, number>();
  let lastMirt: string | null = null;
  for (const n of window) {
    const { li, mirtMg } = parseMeds(n.pharm);
    if (li?.kind === "taken") liTaken++;
    if (li?.kind === "missed") liMissed++;
    if (mirtMg !== null) {
      doses.set(mirtMg, (doses.get(mirtMg) ?? 0) + 1);
      if (!lastMirt || n.iso > lastMirt) lastMirt = n.iso;
    }
  }
  const mirtDoses = [...doses].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  return { days, liTaken, liMissed, mirtNights: mirtDoses.reduce((a, [, k]) => a + k, 0), mirtDoses, lastMirt };
}
