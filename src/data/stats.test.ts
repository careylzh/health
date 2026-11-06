import { describe, expect, it } from "vitest";
import { parseSheet } from "./parse";
import { barFor, chartScale, inRange, nightQuality, summarise } from "./stats";
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

describe("chart views", () => {
  const byIso = (iso: string) => all.find((n) => n.iso === iso)!;
  const plain = byIso("2026-10-10"); // 4 h, no back-to-sleep
  const broken = byIso("2026-10-26"); // 6 h + 3 h back to sleep

  it("total view stacks back-to-sleep on top of main sleep", () => {
    expect(barFor(broken, "total")).toEqual({ hours: 9, kind: "total", main: 6 });
    expect(barFor(plain, "total")).toEqual({ hours: 4, kind: "total", main: 4 });
  });

  it("broken view keeps total height and marks broken vs unbroken nights", () => {
    expect(barFor(broken, "broken")).toEqual({ hours: 9, kind: "broken" });
    expect(barFor(plain, "broken")).toEqual({ hours: 4, kind: "whole" });
  });

  it("extra view plots back-to-sleep hours only; unbroken nights draw nothing (not a zero bar)", () => {
    expect(barFor(broken, "extra")).toEqual({ hours: 3, kind: "extra" });
    expect(barFor(plain, "extra")).toBeNull();
  });

  it("scales whole nights to >= 12 h and back-to-sleep to >= 4 h", () => {
    expect(chartScale(9, "total")).toEqual({ maxY: 12, step: 4 });
    expect(chartScale(13.5, "broken")).toEqual({ maxY: 14, step: 4 });
    expect(chartScale(3, "extra")).toEqual({ maxY: 4, step: 1 });
    expect(chartScale(5, "extra")).toEqual({ maxY: 6, step: 2 });
  });
});
