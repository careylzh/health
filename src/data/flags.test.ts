// SYNTHETIC rows only (AGENTS.md).
import { describe, expect, it } from "vitest";
import { loadFlags, parseFlags, summariseFlags } from "./flags";
import { HEADER, TAB_2026 } from "./fixtures";

const FLAGS_CSV = [
  '"Date","Flag","Written by the Sleep Log bot"',
  '"2026-11-01","good",""',
  '"2026-11-03","nosleep",""',
  '"2026-11-03","good",""',
  '"2026-11-05","severe",""',
  '"bad","good",""',
  '"2026-11-06","purple",""',
].join("\n");

describe("parseFlags", () => {
  it("reads date + flag rows, most serious first, and skips anything else", () => {
    const f = parseFlags(FLAGS_CSV);
    expect([...f]).toEqual([
      ["2026-11-01", ["good"]],
      ["2026-11-03", ["nosleep", "good"]],
      ["2026-11-05", ["severe"]],
    ]);
  });

  it("treats gviz's first-tab fallback (no flags tab yet) as no flags", () => {
    expect(parseFlags(TAB_2026).size).toBe(0);
    expect(parseFlags(HEADER).size).toBe(0);
    expect(parseFlags("").size).toBe(0);
  });

  it("a failed fetch is no flags, not an error", async () => {
    const f = await loadFlags(async () => { throw new Error("offline"); });
    expect(f.size).toBe(0);
  });
});

describe("summariseFlags", () => {
  it("counts each flag over the days ending today", () => {
    const s = summariseFlags(parseFlags(FLAGS_CSV), 7, new Date(2026, 10, 5));
    expect(s.days.map((d) => d.iso)).toEqual([
      "2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05",
    ]);
    expect(s.counts).toEqual({ severe: 1, nosleep: 1, good: 2 });
    expect(s.days[4].flags).toEqual(["nosleep", "good"]);
  });
});
