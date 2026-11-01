import { describe, expect, it } from "vitest";
import { extractSleepSegments, parseClock, spanHours } from "./time";

const hm = (h: number, m = 0) => h * 60 + m;

describe("clock helpers", () => {
  it("parses HH:MM and wraps across midnight", () => {
    expect(parseClock("22:30")).toBe(hm(22, 30));
    expect(parseClock("")).toBeNull();
    expect(spanHours(hm(22, 30), hm(4))).toBe(5.5);
  });
});

describe("extractSleepSegments", () => {
  it.each([
    ["went back to sleep from 6.30-10am", [[hm(6, 30), hm(10)]]],
    ["Slept 9-11am", [[hm(9), hm(11)]]],
    ["Slept from 4am-8am", [[hm(4), hm(8)]]],
    ["slept from 5.30-8.30am, waking up intermittently", [[hm(5, 30), hm(8, 30)]]],
    ["then went back to sleep from 6.30-7.30, 8-10am", [[hm(6, 30), hm(7, 30)], [hm(8), hm(10)]]],
    ["slept from 6-9am", [[hm(6), hm(9)]]],
  ])("%s", (text, want) => {
    expect(extractSleepSegments(text).map((s) => [s.start, s.end])).toEqual(want);
  });

  it("ignores durations and clauses without a sleep word", () => {
    expect(extractSleepSegments("slept 1-2 hours in the early morning")).toEqual([]);
    expect(extractSleepSegments("waking up every 30-45mins")).toEqual([]);
    expect(extractSleepSegments("meeting 9-11am. Felt fine")).toEqual([]);
  });

  it("does not leak a range across sentences", () => {
    expect(extractSleepSegments("slept at 10pm. Gym 6-8pm")).toEqual([]);
  });
});
