/**
 * Deterministic, non-AI bullet generator. Runs in the browser on every refresh:
 * keyword tallies (keywords.ts) → ranked → slotted into fixed templates (i18n.ts).
 * Every template is ≤ 10 words by construction; insights.test.ts enforces it.
 */
import type { AppetiteCounts, Summary } from "./stats";
import type { TagKey } from "./keywords";

export type Bullet =
  | { kind: "sleep"; avg: number; fragmented: number; nights: number }
  | { kind: "sleepNone" }
  /** `low` = most frequent difficult feeling and its day count; `up` = upbeat days. Plain counts, no tone claims. */
  | { kind: "mood"; low: [TagKey, number] | null; up: number; days: number }
  | { kind: "moodNone" }
  | ({ kind: "appetite" } & AppetiteCounts)
  | { kind: "appetiteNone" }
  | { kind: "body"; top: [TagKey, number][] }
  | { kind: "bodyNone" };

const LOW_FEELINGS: TagKey[] = ["lowMood", "anxious", "irritable"];

export function buildBullets(s: Summary, tagCounts: Partial<Record<TagKey, number>>, days: number): Bullet[] {
  const out: Bullet[] = [];

  out.push(
    s.avgHours === null
      ? { kind: "sleepNone" }
      : { kind: "sleep", avg: s.avgHours, fragmented: s.fragmented, nights: s.nights.length },
  );

  if (s.moodUp + s.moodDown === 0) out.push({ kind: "moodNone" });
  else {
    const low = LOW_FEELINGS.map((k) => [k, tagCounts[k] ?? 0] as [TagKey, number])
      .filter(([, c]) => c > 0)
      .sort((a, b) => b[1] - a[1])[0] ?? null;
    out.push({ kind: "mood", low, up: s.moodUp, days });
  }

  out.push(
    s.appetite.good + s.appetite.mixed + s.appetite.dipped + s.appetite.poor === 0
      ? { kind: "appetiteNone" }
      : { kind: "appetite", ...s.appetite },
  );

  const top = (Object.entries(s.body) as [TagKey, number][]).sort((a, b) => b[1] - a[1]).slice(0, 2);
  out.push(top.length ? { kind: "body", top } : { kind: "bodyNone" });

  return out;
}

/** Count of days each tag appears in a set of nights. */
export function countTags(nights: { tags: TagKey[] }[]): Partial<Record<TagKey, number>> {
  const c: Partial<Record<TagKey, number>> = {};
  for (const n of nights) for (const t of n.tags) c[t] = (c[t] ?? 0) + 1;
  return c;
}
