// SYNTHETIC phrases only, modelled on the sheet's wording — never real rows (AGENTS.md).
import { describe, expect, it } from "vitest";
import { lithiumOn, lithiumRuns, parseMeds, summariseMeds } from "./meds";
import type { Night } from "./parse";

const night = (iso: string, pharm: string): Night => ({
  iso, mainHours: null, extraHours: 0, segments: [], sleepTime: null, wakeTime: null, tags: [], pharm,
});

describe("parseMeds", () => {
  it.each([
    ["Li 400mg (7pm), Amisulpride 100mg, mirt 7.5mg (10pm)", { kind: "taken", mg: 400 }, 7.5],
    ["resumed Li 200mg", { kind: "taken", mg: 200 }, null],
    ["Resumed 200mg, mirt 7.5mg", { kind: "taken", mg: 200 }, 7.5],
    ["resumed 200mg", { kind: "taken", mg: 200 }, null],
    ["Missed lithium 400mg", { kind: "missed", mg: 400 }, null],
    ["missed lithium", { kind: "missed", mg: null }, null],
    ["Lim Kong Beng TCM x2", null, null], // "Li" must be a word
    ["lingering low mood", null, null],
    ["Mirt (7.5mg)", null, 7.5],
    ["Mirt 15", null, 15],
    ["Mirt 7.5mg (2am)", null, 7.5],
    ["Hydroxyzine then mirt 7.5", null, 7.5],
    ["Final titration of Mirtazapine from 3.75mg to 0mg", null, null],
    ["Amisulpride 100mg and mirt 3.75mg", null, 3.75],
    ["missed mirt 7.5mg", null, null],
    ["resumed 200mg magnesium", null, null], // a bare dose followed by another word is not lithium
    ["", null, null],
  ])("%s", (text, li, mirt) => {
    const got = parseMeds(text);
    expect(got.li).toEqual(li);
    expect(got.mirtMg).toBe(mirt);
  });

  it("taken beats missed on a day with two rows", () => {
    expect(parseMeds("missed lithium 400mg\nresumed Li 200mg").li).toEqual({ kind: "taken", mg: 200 });
  });
});

describe("lithiumRuns (blank = no change)", () => {
  const nights = [
    night("2026-09-24", "Li 400mg"),
    night("2026-09-25", "Li 400mg"),
    night("2026-09-26", ""), // blank: still 400 mg
    night("2026-09-27", "Li 400mg"),
    night("2026-10-12", "missed lithium 400mg"),
    night("2026-10-13", "Missed lithium 400mg"),
    night("2026-11-01", "resumed Li 200mg, Mirt 7.5"),
    night("2026-11-02", "resumed 200mg"),
  ];

  it("runs last until the day before the next change, the current one until today", () => {
    const runs = lithiumRuns(nights, new Date(2026, 10, 5));
    expect(runs.map((r) => [r.from, r.to, r.state.kind, r.state.mg, r.noted, r.lastNoted, r.ongoing])).toEqual([
      ["2026-09-24", "2026-10-11", "taken", 400, 3, "2026-09-27", false],
      ["2026-10-12", "2026-10-31", "missed", 400, 2, "2026-10-13", false],
      ["2026-11-01", "2026-11-05", "taken", 200, 2, "2026-11-02", true],
    ]);
  });

  it("a one-off miss covers its day; blanks after it go back to the dose", () => {
    const ns = [
      night("2026-11-01", "resumed Li 200mg"),
      night("2026-11-10", "missed Li"),
      night("2026-11-12", "Mirt 7.5mg"), // no lithium note: still no change
    ];
    const runs = lithiumRuns(ns, new Date(2026, 10, 14));
    expect(runs.map((r) => [r.from, r.to, r.state.kind, r.state.mg])).toEqual([
      ["2026-11-01", "2026-11-09", "taken", 200],
      ["2026-11-10", "2026-11-10", "missed", null],
      ["2026-11-11", "2026-11-14", "taken", 200],
    ]);
  });

  it("carries the state over blank days and is null before the first note", () => {
    const runs = lithiumRuns(nights, new Date(2026, 10, 5));
    expect(lithiumOn(runs, "2026-09-23")).toBeNull();
    expect(lithiumOn(runs, "2026-10-05")).toEqual({ kind: "taken", mg: 400 });
    expect(lithiumOn(runs, "2026-10-20")).toEqual({ kind: "missed", mg: 400 });
    expect(lithiumOn(runs, "2026-11-04")).toEqual({ kind: "taken", mg: 200 });
  });
});

describe("summariseMeds", () => {
  it("counts every calendar day for lithium and only written nights for mirtazapine", () => {
    const ns = [
      night("2026-10-30", "missed lithium 200mg"),
      night("2026-11-01", "resumed Li 200mg, Mirt 7.5"),
      night("2026-11-03", "Mirt 3.75mg"),
      night("2026-11-04", "Mirt 7.5mg"),
      night("2026-11-05", ""),
    ];
    const today = new Date(2026, 10, 5);
    const s = summariseMeds(ns, lithiumRuns(ns, today), 7, today);
    // 30–31 Oct missed (carried), 1–5 Nov taken (carried over blanks).
    expect(s).toEqual({
      days: 7, liTaken: 5, liMissed: 2, mirtNights: 3,
      mirtDoses: [[7.5, 2], [3.75, 1]], lastMirt: "2026-11-04",
    });
  });
});
