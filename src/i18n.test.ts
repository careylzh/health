import { describe, expect, it } from "vitest";
import { bulletText, STRINGS, type Lang } from "./i18n";
import type { Bullet } from "./data/insights";
import type { TagKey } from "./data/keywords";

// Worst-case (longest) inputs for every bullet variant.
const LONG_TAGS: TagKey[] = ["irritable", "poorAppetite", "goodAppetite", "coldSweat", "gut", "lowMood"];
const bullets: Bullet[] = [
  { kind: "sleep", avg: 10.55, fragmented: 30, nights: 90 },
  { kind: "sleepNone" },
  ...LONG_TAGS.flatMap((k) => [
    { kind: "mood" as const, low: [k, 88] as [TagKey, number], up: 77, days: 90 },
    { kind: "mood" as const, low: [k, 1] as [TagKey, number], up: 0, days: 90 },
  ]),
  { kind: "mood", low: null, up: 5, days: 7 },
  { kind: "moodNone" },
  { kind: "appetite", good: 1, poor: 0 },
  { kind: "appetite", good: 0, poor: 12 },
  { kind: "appetite", good: 12, poor: 12 },
  { kind: "appetiteNone" },
  { kind: "body", top: [["coldSweat", 12], ["gut", 10]] },
  { kind: "body", top: [["headache", 1]] },
  { kind: "bodyNone" },
];

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

describe("bullet copy budget", () => {
  it.each(bullets.map((b) => [b.kind, b] as const))("EN %s is 5–10 words", (_k, b) => {
    const n = words(bulletText(b, "en").text);
    expect(n).toBeGreaterThanOrEqual(3); // body bullets with one symptom are short by nature
    expect(n).toBeLessThanOrEqual(10);
  });

  it.each(bullets.map((b) => [b.kind, b] as const))("ZH %s is ≤ 20 characters", (_k, b) => {
    expect([...bulletText(b, "zh").text.replace(/\s/g, "")].length).toBeLessThanOrEqual(20);
  });

  it("every non-body EN bullet is at least 5 words", () => {
    for (const b of bullets.filter((x) => x.kind !== "body")) {
      expect(words(bulletText(b, "en").text)).toBeGreaterThanOrEqual(5);
    }
  });
});

describe("i18n parity", () => {
  it("zh has every key en has", () => {
    const keys = (o: object): string[] =>
      Object.entries(o).flatMap(([k, v]) =>
        v && typeof v === "object" ? keys(v).map((s) => `${k}.${s}`) : [k],
      );
    const langs: Lang[] = ["en", "zh"];
    const [a, b] = langs.map((l) => keys(STRINGS[l]).sort());
    expect(b).toEqual(a);
  });
});
