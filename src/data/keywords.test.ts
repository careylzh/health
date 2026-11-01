// SYNTHETIC phrases only — never paste real health notes here (AGENTS.md).
// Appetite: one state per day. good = good state or a return to it · dipped = a change downward
// (not "bad") · poor = an explicitly bad state · mixed = good together with a dip or poor.
import { describe, expect, it } from "vitest";
import { appetiteState, tagText } from "./keywords";

const state = (t: string) => appetiteState(tagText(t));

describe("appetite state", () => {
  it.each([
    // good
    ["good appetite today", "good"],
    ["Appetite was good after lunch", "good"],
    ["appetite back to normal", "good"],
    ["appetite came back", "good"],
    ["appetite improved", "good"],
    ["ate well at dinner", "good"],
    ["felt hungry by noon", "good"],
    ["胃口不错", "good"],
    ["吃得很香", "good"],
    // dipped: a change, not a bad state
    ["a dip in appetite", "dipped"],
    ["appetite dipped a bit", "dipped"],
    ["a drop in appetite", "dipped"],
    ["appetite lower than usual", "dipped"],
    ["reduced appetite", "dipped"],
    ["ate less than usual", "dipped"],
    ["less hungry today", "dipped"],
    ["not as hungry as usual", "dipped"],
    ["didn't eat as much", "dipped"],
    ["appetite not as good as last week", "dipped"],
    ["胃口有点下降", "dipped"],
    ["胃口变差", "dipped"],
    ["吃得比较少", "dipped"],
    // poor: explicitly bad
    ["no appetite", "poor"],
    ["poor appetite", "poor"],
    ["low appetite", "poor"],
    ["appetite was low", "poor"],
    ["appetite was bad", "poor"],
    ["lost my appetite", "poor"],
    ["loss of appetite", "poor"],
    ["appetite is gone", "poor"],
    ["appetite not great", "poor"],
    ["wasn't hungry at all", "poor"],
    ["didn't have much appetite", "poor"],
    ["hardly any appetite", "poor"],
    ["barely ate", "poor"],
    ["can't eat", "poor"],
    ["didnt eat much", "poor"],
    ["skipped lunch", "poor"],
    ["胃口差", "poor"],
    ["食欲不振", "poor"],
    ["不想吃饭", "poor"],
    // mixed
    ["Appetite generally good, with the exception of a dip", "mixed"],
    ["Appetite mostly good, except a small dip yesterday", "mixed"],
    ["appetite good but lower in the evening", "mixed"],
    ["good appetite at lunch, no appetite at dinner", "mixed"],
    ["胃口不错，但是晚上有点下降", "mixed"],
    // negation
    ["appetite did not drop", "good"],
    ["appetite didn't dip at all", "good"],
    ["appetite didn’t dip", "good"], // curly apostrophe
    ["appetite didnt drop", "good"],
    ["appetite not bad", "good"],
    ["appetite wasn't good", "poor"],
    ["appetite won't improve", "poor"],
    ["appetite never came back", "poor"],
    ["胃口没有变差", "good"],
  ])("%s → %s", (text, want) => expect(state(text)).toBe(want));

  it.each([
    "appetite",
    "no change in appetite",
    "felt good, went for a walk",
    "dip in energy. Appetite noted", // "dip" is in another sentence
    "lost my keys",
    "ate at 7pm",
  ])("no appetite state: %s", (text) => expect(state(text)).toBeNull());

  it("a following clause that moves to another subject does not qualify appetite", () => {
    expect(state("Appetite good, but less anxious")).toBe("good");
    expect(state("Appetite good, except felt sad")).toBe("good");
    expect(state("Appetite fine. Less anxious than yesterday")).toBe("good"); // "less" is next sentence
  });
});
