/**
 * Deterministic, non-AI bullet generator. Runs in the browser on every refresh:
 * keyword tallies (keywords.ts) → ranked → slotted into fixed templates (i18n.ts).
 * Every template is ≤ 10 words by construction; insights.test.ts enforces it.
 */
import type { Summary } from "./stats";
import type { TagKey } from "./keywords";

export type Tone = "positive" | "mixed" | "low";

export type Bullet =
  | { kind: "sleep"; avg: number; fragmented: number; nights: number }
  | { kind: "sleepNone" }
  | { kind: "mood"; tone: Tone; feeling: TagKey; count: number; days: number }
  | { kind: "moodNone" }
  | { kind: "appetite"; good: number; poor: number }
  | { kind: "appetiteNone" }
  | { kind: "body"; top: [TagKey, number][] }
  | { kind: "bodyNone" };

const MOOD_FEELINGS: TagKey[] = ["goodMood", "lowMood", "anxious", "irritable"];

export function buildBullets(s: Summary, tagCounts: Partial<Record<TagKey, number>>, days: number): Bullet[] {
  const out: Bullet[] = [];

  out.push(
    s.avgHours === null
      ? { kind: "sleepNone" }
      : { kind: "sleep", avg: s.avgHours, fragmented: s.fragmented, nights: s.nights.length },
  );

  if (s.moodUp + s.moodDown === 0) out.push({ kind: "moodNone" });
  else {
    const tone: Tone =
      s.moodUp >= 2 * s.moodDown ? "positive" : s.moodDown >= 2 * s.moodUp ? "low" : "mixed";
    // Most frequent feeling; on a tie prefer the one that matches the tone.
    const ranked = MOOD_FEELINGS.map((k) => [k, tagCounts[k] ?? 0] as const)
      .filter(([, c]) => c > 0)
      .sort((a, b) => b[1] - a[1] || (tone === "positive" ? (a[0] === "goodMood" ? -1 : 1) : a[0] === "goodMood" ? 1 : -1));
    const [feeling, count] = ranked[0];
    out.push({ kind: "mood", tone, feeling, count, days });
  }

  out.push(
    s.goodAppetite + s.poorAppetite === 0
      ? { kind: "appetiteNone" }
      : { kind: "appetite", good: s.goodAppetite, poor: s.poorAppetite },
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
