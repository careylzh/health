import { describe, expect, it } from "vitest";
import { parseSheet, totalHours, type Night } from "./parse";
import { HEADER, TAB_2026, row } from "./fixtures";

const nights = parseSheet(TAB_2026, 2026);
const get = (iso: string) => nights.find((n) => n.iso === iso) as Night;

describe("parseSheet", () => {
  it("assigns the previous year to Nov/Dec rows before the first January row", () => {
    expect(get("2025-12-20")).toBeDefined();
    expect(get("2026-01-05").mainHours).toBe(7);
  });

  it("treats 0 with no times as not logged, and skips undated rows", () => {
    expect(get("2026-10-22").mainHours).toBeNull();
    expect(nights.filter((n) => n.iso === "")).toHaveLength(0);
  });

  it("computes hours from times when duration is 0 but times exist", () => {
    expect(get("2026-10-09").mainHours).toBe(2);
  });

  it("adds back-to-sleep segments after the wake time", () => {
    expect(get("2026-10-16").extraHours).toBe(3);
    expect(totalHours(get("2026-10-16"))).toBe(8.5);
    expect(get("2026-10-18").extraHours).toBe(4);
    expect(totalHours(get("2026-10-26"))).toBe(9);
  });

  it("does not add vague durations as segments", () => {
    expect(get("2026-10-14").extraHours).toBe(0);
  });

  it("merges duplicate dates and keeps their notes", () => {
    const d = get("2026-10-27");
    expect(nights.filter((n) => n.iso === "2026-10-27")).toHaveLength(1);
    expect(d.tags).toContain("anxious");
  });

  it("tags without false positives from negated phrases", () => {
    expect(get("2026-10-16").tags).toContain("rested");
    expect(get("2026-10-16").tags).not.toContain("unrested");
    expect(get("2026-10-16").tags).toContain("wokeOften");
    expect(get("2026-10-18").tags).toEqual(expect.arrayContaining(["lowMood", "headache"]));
    expect(get("2026-10-10").tags).toContain("goodAppetite");
    expect(get("2026-10-10").tags).not.toContain("goodMood");
  });

  it("keeps Nov/Dec as this year once any Jan–Oct row is seen, even with no Jan/Feb rows", () => {
    const csv = [HEADER, row(["15/12", "", "", "", "7.00", "", "", "", ""]), row(["30/10", "", "", "", "7.00", "", "", "", ""]),
      row(["2/11", "", "", "", "7.00", "", "", "", ""])].join("\n");
    expect(parseSheet(csv, 2026).map((n) => n.iso)).toEqual(["2025-12-15", "2026-10-30", "2026-11-02"]);
  });
});
