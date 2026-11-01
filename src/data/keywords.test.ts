// SYNTHETIC phrases only — never paste real health notes here (AGENTS.md).
import { describe, expect, it } from "vitest";
import { tagText } from "./keywords";

const app = (t: string) => tagText(t).filter((k) => k.endsWith("Appetite")).sort();

describe("appetite tagging", () => {
  it.each([
    ["good appetite today", ["goodAppetite"]],
    ["Appetite was good after lunch", ["goodAppetite"]],
    ["appetite back to normal", ["goodAppetite"]],
    ["ate well at dinner", ["goodAppetite"]],
    ["felt hungry by noon", ["goodAppetite"]],
    ["胃口不错", ["goodAppetite"]],
    ["no appetite", ["poorAppetite"]],
    ["appetite was low", ["poorAppetite"]],
    ["a drop in appetite", ["poorAppetite"]],
    ["appetite not great", ["poorAppetite"]],
    ["wasn't hungry at all", ["poorAppetite"]],
    ["didn't have much appetite", ["poorAppetite"]],
    ["胃口差", ["poorAppetite"]],
    ["食欲不振", ["poorAppetite"]],
    ["不想吃饭", ["poorAppetite"]],
    ["Appetite mostly good, except a small dip yesterday", ["goodAppetite", "poorAppetite"]],
    ["dip in energy. Appetite good", ["goodAppetite"]], // "dip" is in another sentence
    ["appetite", []],
    ["no change in appetite", []],
    ["felt good, went for a walk", []],
  ])("%s", (text, want) => {
    expect(app(text)).toEqual(want);
  });
});
