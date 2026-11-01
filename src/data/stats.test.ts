import { describe, expect, it } from "vitest";
import { parseSheet } from "./parse";
import { inRange, nightQuality, summarise } from "./stats";
import { TAB_2026 } from "./fixtures";

const all = parseSheet(TAB_2026, 2026);
const today = new Date(2026, 9, 28); // 28 Oct 2026

describe("summarise", () => {
  it("windows by calendar days, inclusive of today", () => {
    expect(inRange(all, 7, today).map((n) => n.iso)).toEqual(["2026-10-22", "2026-10-26", "2026-10-27"]);
  });

  it("excludes not-logged nights from averages and the chart list", () => {
    const s = summarise(all, 7, today);
    expect(s.nights.map((n) => n.iso)).toEqual(["2026-10-26"]);
    expect(s.avgHours).toBe(9);
    expect(s.fragmented).toBe(1);
    expect(s.moodDown).toBe(1); // anxious on 27/10 counts even without sleep numbers
  });

  it("averages total (main + extra) hours over a month", () => {
    const s = summarise(all, 30, today);
    // 9/10: 2, 10/10: 4, 14/10: 4.5, 16/10: 8.5, 18/10: 9, 26/10: 9
    expect(s.nights).toHaveLength(6);
    expect(s.avgHours).toBeCloseTo(37 / 6, 5);
    expect(s.minHours).toBe(2);
    expect(s.maxHours).toBe(9);
  });

  it("derives night quality", () => {
    const n = all.find((x) => x.iso === "2026-10-16")!;
    expect(nightQuality(n)).toBe("mixed");
    expect(nightQuality(all.find((x) => x.iso === "2026-01-05")!)).toBeNull();
  });
});
