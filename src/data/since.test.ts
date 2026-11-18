// SYNTHETIC data only (AGENTS.md).
import { describe, expect, it } from "vitest";
import { compareSince, dayNumber, greenTimeline, TRACKED, trackedStart } from "./since";
import { lithiumRuns } from "./meds";
import type { Night } from "./parse";
import type { Flag } from "./flags";

const night = (iso: string, hours: number | null, extra: Partial<Night> = {}): Night => ({
  iso, mainHours: hours, extraHours: 0, segments: [], sleepTime: null, wakeTime: null, tags: [], pharm: "", ...extra,
});

describe("greenTimeline", () => {
  it("groups consecutive days with the same note", () => {
    const notes = new Map([
      ["2026-01-21", "a calm streak"], ["2026-01-22", "a calm streak"], ["2026-01-23", "a calm streak"],
      ["2026-10-09", "Started herbal course"], ["2026-10-27", "increased herbal dose"],
    ]);
    expect(greenTimeline(notes)).toEqual([
      { from: "2026-01-21", to: "2026-01-23", note: "a calm streak" },
      { from: "2026-10-09", to: "2026-10-09", note: "Started herbal course" },
      { from: "2026-10-27", to: "2026-10-27", note: "increased herbal dose" },
    ]);
  });
});

describe("TCM day counter", () => {
  const entries = greenTimeline(new Map([
    ["2026-09-01", "left for TCM appointment"], // mentions TCM but not a start
    ["2026-10-09", "Started TCM x2 dosage"],
    ["2026-10-27", "increased TCM dose"],
  ]));
  const tcm = TRACKED.find((t) => t.key === "tcm")!.match;

  it("starts at the first green note that says TCM started", () => {
    expect(trackedStart(entries, tcm)).toBe("2026-10-09");
    expect(trackedStart([], tcm)).toBeNull();
  });

  it("counts the start day as day 1", () => {
    expect(dayNumber("2026-10-09", new Date(2026, 9, 9))).toBe(1);
    expect(dayNumber("2026-10-09", new Date(2026, 10, 18))).toBe(41);
  });
});

describe("compareSince", () => {
  const start = "2026-10-09";
  const today = new Date(2026, 9, 18); // 10 days since, 10 days before (29 Sep – 8 Oct)

  it("refuses to compare when the earlier stretch has too few logged nights", () => {
    const ns = [
      night("2026-10-01", 6),
      ...Array.from({ length: 10 }, (_, i) => night(`2026-10-${String(9 + i).padStart(2, "0")}`, 7)),
    ];
    const c = compareSince(ns, new Map(), [], start, today);
    expect(c.since).toMatchObject({ days: 10, logged: 10, avgHours: 7 });
    expect(c.before).toMatchObject({ from: "2026-09-29", to: "2026-10-08", days: 10, logged: 1 });
    expect(c.enough).toBe(false);
  });

  it("compares when both sides have enough, and counts red days and mood notes", () => {
    const before = Array.from({ length: 10 }, (_, i) => night(`2026-${i < 2 ? "09" : "10"}-${String(i < 2 ? 29 + i : i - 1).padStart(2, "0")}`, 6, { tags: i < 3 ? ["lowMood"] : [] }));
    const since = Array.from({ length: 10 }, (_, i) => night(`2026-10-${String(9 + i).padStart(2, "0")}`, 8, { tags: i < 2 ? ["goodMood"] : [] }));
    const flags = new Map<string, Flag[]>([["2026-10-01", ["nosleep"]], ["2026-10-12", ["green"]], ["2026-10-13", ["severe", "green"]]]);
    const c = compareSince([...before, ...since], flags, [], start, today);
    expect(c.enough).toBe(true);
    expect(c.before).toMatchObject({ logged: 10, avgHours: 6, redDays: 1, lowMood: 3, goodMood: 0 });
    expect(c.since).toMatchObject({ logged: 10, avgHours: 8, redDays: 1, lowMood: 0, goodMood: 2 });
  });

  it("lists lithium changes after the start as a caveat", () => {
    const ns = [night("2026-10-01", null, { pharm: "Li 400mg" }), night("2026-10-12", null, { pharm: "missed lithium 400mg" })];
    const c = compareSince(ns, new Map(), lithiumRuns(ns, today), start, today);
    // A one-off miss, then back to the dose the next day (no "resumed" needed).
    expect(c.liChanges.map((r) => [r.from, r.state.kind])).toEqual([["2026-10-12", "missed"], ["2026-10-13", "taken"]]);
  });
});
