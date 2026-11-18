import { describe, expect, it } from "vitest";
import { checkPasscode, hashPasscode } from "./passcode";

describe("passcode", () => {
  it("accepts only the matching code (surrounding spaces ignored)", async () => {
    const cfg = { salt: "test-salt", iterations: 1000, hash: await hashPasscode("sample-code", "test-salt", 1000) };
    expect(await checkPasscode("sample-code", cfg)).toBe(true);
    expect(await checkPasscode("  sample-code ", cfg)).toBe(true);
    expect(await checkPasscode("wrong", cfg)).toBe(false);
    expect(await checkPasscode("", cfg)).toBe(false);
    expect(await checkPasscode("sample-code", null)).toBe(false);
  });

  it("matches what scripts/set-passcode.mjs writes (Node pbkdf2Sync, sha256, 32 bytes)", async () => {
    // Expected value from: node -e 'require("crypto").pbkdf2Sync("sample-code","abc",2000,32,"sha256")'
    const node = "b34c54a01e9be12d40c3c0d7e02b67b20a16c8fc891779b00188da564f3714d7";
    expect(await hashPasscode("sample-code", "abc", 2000)).toBe(node);
  });
});
