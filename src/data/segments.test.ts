// SYNTHETIC phrases only. Broken-sleep semantics: every way of saying "slept again from X to Y"
// must yield that range; ranges that are not sleep (or negated sleep) must not.
import { describe, expect, it } from "vitest";
import { extractSleepSegments } from "./time";

const hm = (h: number, m = 0) => h * 60 + m;
const seg = (t: string) => extractSleepSegments(t).map((s) => [s.start, s.end]);

describe("broken sleep: phrasing that states extra sleep", () => {
  it.each([
    ["went back to sleep 6:30-8am", [[hm(6, 30), hm(8)]]],
    ["went back to sleep at 6.30 till 8am", [[hm(6, 30), hm(8)]]],
    ["slept again from 7 to 9am", [[hm(7), hm(9)]]],
    ["slept from 5:30 until 8:30", [[hm(5, 30), hm(8, 30)]]],
    ["fell back asleep 7-9am", [[hm(7), hm(9)]]],
    ["fell asleep again from 6am to 8am", [[hm(6), hm(8)]]],
    ["dozed off 6-8am", [[hm(6), hm(8)]]],
    ["dozed 7.15-8.45am", [[hm(7, 15), hm(8, 45)]]],
    ["napped 11am-1pm", [[hm(11), hm(13)]]],
    ["back to bed 6-8am", [[hm(6), hm(8)]]],
    ["went back to bed from 6.30am to 9am", [[hm(6, 30), hm(9)]]],
    ["slept 06:30–08:00", [[hm(6, 30), hm(8)]]],
    ["slept between 6 and 8am", [[hm(6), hm(8)]]],
    ["6.30am-8.15am slept again", [[hm(6, 30), hm(8, 15)]]],
    ["Slept 9-11AM", [[hm(9), hm(11)]]],
    ["slept 9 - 11 am", [[hm(9), hm(11)]]],
    ["slept from 11-1pm", [[hm(11), hm(13)]]],
    ["回去睡了 6:30-8:00", [[hm(6, 30), hm(8)]]],
    ["又睡了7点到9点", [[hm(7), hm(9)]]],
    ["went back to sleep from 6.30-7.30, 8-10am", [[hm(6, 30), hm(7, 30)], [hm(8), hm(10)]]],
  ])("%s", (text, want) => expect(seg(text)).toEqual(want));
});

describe("broken sleep: ranges that are not extra sleep", () => {
  it.each([
    "couldn't sleep from 2-4am",
    "could not sleep 2-4am",
    "couldnt sleep 6-8am",
    "tried to sleep 6-8am but couldn't",
    "was awake from 3-5am",
    "lay awake 4-6am, no sleep",
    "slept 1-2 hours",
    "slept 7-8 hrs",
    "sleep score 70-80",
    "gym 6-8pm then sleep",
    "didn't nap 1-3pm",
    "no sleep from 4-6am",
  ])("%s", (text) => expect(seg(text)).toEqual([]));
});
