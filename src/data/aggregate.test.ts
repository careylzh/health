// SYNTHETIC data only. End-to-end: sheet rows → nights → summary → bullets. Checks that every
// stated condition is counted once per day, negated ones not at all, and ranges are exact.
import { describe, expect, it } from "vitest";
import { parseSheet } from "./parse";
import { nightQuality, summarise } from "./stats";
import { buildBullets, countTags } from "./insights";
import { HEADER, row } from "./fixtures";

//            date     pharm positive                         negative                                          dur     sleep    wake   why remarks
const CSV = [
  HEADER,
  row(["26/10", "", "happy", "headache", "9.00", "22:00", "07:00", "", ""]), // 8 days back: outside the week
  row(["27/10", "", "slept well", "", "6.00", "23:00", "05:00", "", "went back to sleep 6-8am"]),
  row(["28/10", "", "felt calm, no headache", "", "7.00", "23:00", "06:00", "", ""]),
  row(["29/10", "", "", "didn't sleep well, headache. headache again at night", "0.00", "01:00", "05:30", "", ""]),
  row(["30/10", "", "", "anxious, not sad", "5.00", "00:00", "05:00", "", "couldn't sleep 2-4am. napped 3-4pm"]),
  row(["31/10", "", "", "", "6.00", "00:00", "06:00", "", "slept 4-5am"]), // before wake: not extra
  row(["31/10", "", "good appetite", "stomach ache", "", "", "", "", ""]), // duplicate date, notes only
  row(["1/11", "", "", "felt sad, no appetite", "", "", "", "", ""]), // note-only day
  row(["2/11", "", "", "woke up 3 times, headache", "0.00", "", "", "", ""]), // not logged, notes count
  row(["3/11", "", "", "", "0.00", "", "", "", ""]), // future placeholder
].join("\n");

const all = parseSheet(CSV, 2026);
const today = new Date(2026, 10, 2); // Mon 2 Nov 2026
const week = summarise(all, 7, today);
const night = (iso: string) => all.find((n) => n.iso === iso)!;

describe("week summary", () => {
  it("window is the 7 calendar days ending today, dated rows only", () => {
    expect(week.window.map((n) => n.iso)).toEqual([
      "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02",
    ]);
  });

  it("averages only logged nights, main + extra", () => {
    expect(week.nights.map((n) => n.iso)).toEqual(["2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31"]);
    // 27: 6 + 2 extra · 28: 7 · 29: 4.5 from times · 30: 5 · 31: 6
    expect(week.avgHours).toBeCloseTo(30.5 / 5, 6);
    expect(week.minHours).toBe(4.5);
    expect(week.maxHours).toBe(8);
  });

  it("broken sleep: only real extra sleep after waking, before 14:00", () => {
    expect(night("2026-10-27").extraHours).toBe(2);
    expect(night("2026-10-30").segments).toEqual([]); // "couldn't sleep 2-4am" + afternoon nap
    expect(night("2026-10-31").segments).toEqual([]); // 4-5am is before the 06:00 wake
    expect(week.fragmented).toBe(1);
    expect(week.avgExtraHours).toBe(2);
  });

  it("night quality follows the stated sleep", () => {
    expect(nightQuality(night("2026-10-27"))).toBe("mixed"); // slept well but broken
    expect(nightQuality(night("2026-10-29"))).toBe("poor"); // "didn't sleep well"
    expect(nightQuality(night("2026-10-30"))).toBe("poor"); // "couldn't sleep 2-4am"
    expect(nightQuality(night("2026-10-28"))).toBeNull(); // notes say nothing about sleep
    expect(week.quality).toEqual({ good: 0, mixed: 1, poor: 2 });
  });

  it("mood counts days, ignores negated feelings", () => {
    expect(week.moodUp).toBe(1); // 28 calm
    expect(week.moodDown).toBe(2); // 30 anxious (not sad), 1/11 sad
    expect(night("2026-10-30").tags).not.toContain("lowMood");
  });

  it("appetite merges duplicate-date notes and note-only days", () => {
    expect(week.goodAppetite).toBe(1);
    expect(week.poorAppetite).toBe(1);
  });

  it("body symptoms count once per day; 'no headache' is not a headache", () => {
    expect(week.body).toEqual({ headache: 2, gut: 1 }); // 29 (said twice) + 2/11; 31 stomach
  });

  it("bullets carry exactly those numbers", () => {
    const b = buildBullets(week, countTags(week.window), week.window.length);
    expect(b).toEqual([
      { kind: "sleep", avg: 30.5 / 5, fragmented: 1, nights: 5 },
      { kind: "mood", low: ["lowMood", 1], up: 1, days: 7 },
      { kind: "appetite", good: 1, poor: 1 },
      { kind: "body", top: [["headache", 2], ["gut", 1]] },
    ]);
  });
});

describe("month summary", () => {
  it("adds the day outside the week", () => {
    const m = summarise(all, 30, today);
    expect(m.nights).toHaveLength(6);
    expect(m.body.headache).toBe(3);
    expect(m.moodUp).toBe(2);
  });
});
