// SYNTHETIC phrases only, modelled on the sheet's wording — never real rows (AGENTS.md).
import { describe, expect, it } from "vitest";
import { lithiumRuns, parseMeds, summariseMeds } from "./meds";
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

describe("lithiumRuns", () => {
  it("groups by state and does not break on unnoted days", () => {
    const runs = lithiumRuns([
      night("2026-09-24", "Li 400mg"),
      night("2026-09-25", "Li 400mg"),
      night("2026-09-26", ""), // nothing written: the run carries on
      night("2026-09-27", "Li 400mg"),
      night("2026-10-12", "missed lithium 400mg"),
      night("2026-10-13", "Missed lithium 400mg"),
      night("2026-11-01", "resumed Li 200mg, Mirt 7.5"),
      night("2026-11-02", "resumed 200mg"),
    ]);
    expect(runs.map((r) => [r.from, r.to, r.state.kind, r.state.mg, r.noted])).toEqual([
      ["2026-09-24", "2026-09-27", "taken", 400, 3],
      ["2026-10-12", "2026-10-13", "missed", 400, 2],
      ["2026-11-01", "2026-11-02", "taken", 200, 2],
    ]);
  });
});

describe("summariseMeds", () => {
  it("counts lithium nights and as-needed mirtazapine by dose", () => {
    const s = summariseMeds([
      night("2026-11-01", "resumed Li 200mg, Mirt 7.5"),
      night("2026-11-02", "missed lithium 200mg"),
      night("2026-11-03", "Mirt 3.75mg"),
      night("2026-11-04", "Mirt 7.5mg"),
      night("2026-11-05", ""),
    ], 7);
    expect(s).toEqual({
      days: 7, liTaken: 1, liMissed: 1, mirtNights: 3,
      mirtDoses: [[7.5, 2], [3.75, 1]], lastMirt: "2026-11-04",
    });
  });
});
