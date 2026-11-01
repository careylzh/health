// SYNTHETIC phrases only. Row date for every case: Mon 2 Nov 2026.
import { describe, expect, it } from "vitest";
import { timePhrase } from "./timeref";
import { datedTags } from "./keywords";
import { parseSheet } from "./parse";
import { summarise } from "./stats";
import { HEADER, row } from "./fixtures";

const ROW = new Date(2026, 10, 2); // Monday
const days = (t: string) => timePhrase(t, ROW)?.days ?? "none";

describe("time phrase → days (offsets from the row)", () => {
  it.each([
    ["in the past 2 days", [-1, 0]],
    ["past two days", [-1, 0]],
    ["the last 3 nights", [-2, -1, 0]],
    ["over the past couple of days", [-1, 0]],
    ["for 4 days", [-3, -2, -1, 0]],
    ["3 days in a row", [-2, -1, 0]],
    ["these 2 days", [-1, 0]],
    ["yesterday", [-1]],
    ["the day before yesterday", [-2]],
    ["since yesterday", [-1, 0]],
    ["2 days ago", [-2]],
    ["today", [0]],
    ["last night", [0]], // the night this row logs
    ["past week", [-6, -5, -4, -3, -2, -1, 0]],
    ["this past week", [-6, -5, -4, -3, -2, -1, 0]],
    ["this week", [0]], // row is a Monday
    ["last week", [-7, -6, -5, -4, -3, -2, -1]], // Mon 26 Oct – Sun 1 Nov
    ["since Friday", [-3, -2, -1, 0]],
    ["on Saturday", [-2]],
    ["past fortnight", Array.from({ length: 14 }, (_, i) => i - 13)],
    ["过去两天", [-1, 0]],
    ["最近3天", [-2, -1, 0]],
    ["这两天", [-1, 0]],
    ["连续三晚", [-2, -1, 0]],
    ["昨天", [-1]],
    ["前天", [-2]],
    ["从昨天开始", [-1, 0]],
    ["昨晚", [0]],
    ["两天前", [-2]],
    ["从周五开始", [-3, -2, -1, 0]],
  ])("%s", (t, want) => expect(days(t)).toEqual(want));

  it.each(["a few days", "the past few days", "several days", "lately", "recently", "这几天", "前几天"])(
    "vague, not guessed: %s",
    (t) => expect(timePhrase(t, ROW)).toEqual({ days: null }),
  );

  it.each(["appetite good", "slept 6-8am", "past 99 days", "on meds for 8 days before symptoms started",
    "3 days of antibiotics", "for 2 days after the trip", "吃药两天后"])("no usable phrase: %s", (t) => {
    const p = timePhrase(t, ROW);
    expect(p === null || p.days === null).toBe(true);
  });
});

describe("tags land on the days their phrase names", () => {
  const map = (t: string) =>
    Object.fromEntries([...datedTags(t, ROW)].sort((a, b) => a[0] - b[0]).map(([d, s]) => [d, [...s].sort()]));

  it.each<[string, Record<number, string[]>]>([
    ["anxious for the past 3 days", { [-2]: ["anxious"], [-1]: ["anxious"], 0: ["anxious"] }],
    ["Past 3 days, anxious and tired", { [-2]: ["anxious", "unrested"], [-1]: ["anxious", "unrested"], 0: ["anxious", "unrested"] }],
    ["headache yesterday, fine today", { [-1]: ["headache"] }],
    ["felt sad yesterday, calm today", { [-1]: ["lowMood"], 0: ["goodMood"] }],
    ["anxious a few days, sad", { 0: ["anxious", "lowMood"] }], // vague → the row
    ["new dose for 8 days before depressive symptoms appeared", { 0: ["lowMood"] }], // relational span
    // the user's own sentence shape: a general state with a timed exception
    ["Appetite generally good, with the exception of a dip in the past 2 days", { [-1]: ["dipAppetite"], 0: ["dipAppetite"] }],
    ["Appetite good, except a dip yesterday", { [-1]: ["dipAppetite"], 0: ["goodAppetite"] }],
    ["Appetite good but a dip yesterday", { [-1]: ["dipAppetite"], 0: ["goodAppetite"] }],
    ["Appetite generally good, with a dip", { 0: ["dipAppetite", "goodAppetite"] }], // no time: same day, mixed
    ["didn't sleep well the last 2 nights", { [-1]: ["unrested"], 0: ["unrested"] }],
  ])("%s", (t, want) => expect(map(t)).toEqual(want));
});

describe("end to end: a phrase fills earlier days, including days with no row", () => {
  const csv = [
    HEADER,
    row(["31/10", "", "", "", "7.00", "23:00", "06:00", "", ""]),
    row(["2/11", "", "Appetite generally good, with the exception of a dip in the past 2 days", "", "3.50", "22:00", "01:30", "", ""]),
  ].join("\n");
  const all = parseSheet(csv, 2026);

  it("1 Nov has no row but gets a note-only day; sleep stays not logged", () => {
    const nov1 = all.find((n) => n.iso === "2026-11-01")!;
    expect(nov1.mainHours).toBeNull();
    expect(nov1.tags).toEqual(["dipAppetite"]);
  });

  it("week counts the two dipped days, nothing else", () => {
    const s = summarise(all, 7, ROW);
    expect(s.appetite).toEqual({ good: 0, mixed: 0, dipped: 2, poor: 0, mixedWith: null });
    expect(s.nights.map((n) => n.iso)).toEqual(["2026-10-31", "2026-11-02"]); // averages unchanged
  });
});
