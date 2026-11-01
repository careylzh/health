import { describe, expect, it } from "vitest";
import { loadNights, tabUrl } from "./sheet";
import { HEADER, row, TAB_2026 } from "./fixtures";

const fake = (tabs: Record<string, string>, fallback: string) => async (url: string) => {
  const year = new URL(url).searchParams.get("sheet")!;
  return tabs[year] ?? fallback; // gviz returns the FIRST tab for an unknown name
};

describe("loadNights", () => {
  it("uses the calendar year's tab", async () => {
    expect(tabUrl(2027)).toContain("sheet=2027");
    const ns = await loadNights(new Date(2026, 9, 28), fake({ "2026": TAB_2026 }, TAB_2026));
    expect(ns.some((n) => n.iso === "2026-10-26")).toBe(true);
    expect(ns.some((n) => n.iso > "2026-10-29")).toBe(false); // future placeholders dropped
  });

  it("in January with no new tab yet, reads last year's tab as last year", async () => {
    const ns = await loadNights(new Date(2027, 0, 3), fake({ "2026": TAB_2026 }, TAB_2026));
    expect(ns.some((n) => n.iso === "2026-10-26")).toBe(true);
    expect(ns.some((n) => n.iso.startsWith("2027-10"))).toBe(false);
  });

  it("merges the new year's tab with last year's once it exists", async () => {
    const tab2027 = [HEADER, row(["2/1", "", "", "", "8.00", "23:00", "07:00", "", ""])].join("\n");
    const ns = await loadNights(new Date(2027, 0, 3), fake({ "2026": TAB_2026, "2027": tab2027 }, TAB_2026));
    expect(ns.find((n) => n.iso === "2027-01-02")?.mainHours).toBe(8);
    expect(ns.some((n) => n.iso === "2026-10-26")).toBe(true);
  });
});
