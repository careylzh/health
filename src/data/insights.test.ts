import { describe, expect, it } from "vitest";
import { parseSheet } from "./parse";
import { summarise } from "./stats";
import { buildBullets, countTags } from "./insights";
import { TAB_2026 } from "./fixtures";

const all = parseSheet(TAB_2026, 2026);

describe("buildBullets", () => {
  it("produces sleep, mood, appetite, body bullets in order", () => {
    const s = summarise(all, 30, new Date(2026, 9, 28));
    const b = buildBullets(s, countTags(s.window), s.window.length);
    expect(b.map((x) => x.kind)).toEqual(["sleep", "mood", "appetite", "body"]);
    const mood = b[1];
    // lowMood (18/10) and anxious (27/10) tie at 1 day; ties resolve in LOW_FEELINGS order.
    expect(mood.kind === "mood" && mood.low).toEqual(["lowMood", 1]);
  });

  it("falls back to 'none' bullets for an empty range", () => {
    const s = summarise(all, 7, new Date(2026, 6, 1));
    const b = buildBullets(s, {}, 0);
    expect(b.map((x) => x.kind)).toEqual(["sleepNone", "moodNone", "appetiteNone", "bodyNone"]);
  });
});
