import { describe, expect, it } from "vitest";
import { parseCsv } from "./csv";

describe("parseCsv", () => {
  it("handles quotes, escaped quotes and embedded newlines", () => {
    expect(parseCsv('"a","b ""x""","c\nd"\n"1",2,')).toEqual([
      ["a", 'b "x"', "c\nd"],
      ["1", "2", ""],
    ]);
  });
});
