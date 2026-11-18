#!/usr/bin/env node
// Set the meds page passcode: asks for it twice (hidden), writes only a salted PBKDF2 hash to
// src/passcodeHash.ts. The passcode itself is never stored or printed. Decision 0008.
//   node scripts/set-passcode.mjs          set or change it
//   node scripts/set-passcode.mjs --off    remove it (the meds page then says "not set up")
import { pbkdf2Sync, randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const out = fileURLToPath(new URL("../src/passcodeHash.ts", import.meta.url));
const HEAD = "// Written by scripts/set-passcode.mjs — do not edit by hand. null = the meds page is not set up.\n" +
  "// Only a salted PBKDF2 hash is stored; the passcode itself never enters the repo (decision 0008).\n";
const write = (v) => writeFileSync(out, `${HEAD}export const PASSCODE: { salt: string; hash: string; iterations: number } | null = ${v};\n`);

if (process.argv.includes("--off")) { write("null"); console.log("Passcode removed."); process.exit(0); }

function ask(q) {
  return new Promise((resolve) => {
    process.stdout.write(q);
    const stdin = process.stdin;
    stdin.setRawMode?.(true); stdin.resume(); stdin.setEncoding("utf8");
    let s = "";
    const on = (ch) => {
      if (ch === "\r" || ch === "\n" || ch === "\u0004") { stdin.setRawMode?.(false); stdin.pause(); stdin.off("data", on); process.stdout.write("\n"); resolve(s); }
      else if (ch === "\u0003") process.exit(1);
      else if (ch === "\u007f") s = s.slice(0, -1);
      else s += ch;
    };
    stdin.on("data", on);
  });
}

const a = (await ask("New meds passcode: ")).trim();
const b = (await ask("Again: ")).trim();
if (!a) { console.error("Empty passcode; nothing changed."); process.exit(1); }
if (a !== b) { console.error("They don't match; nothing changed."); process.exit(1); }
if (a.length < 6) console.warn("Note: under 6 characters is easy to guess from the public bundle.");
const salt = randomBytes(16).toString("hex");
const iterations = 310000;
const hash = pbkdf2Sync(a, salt, iterations, 32, "sha256").toString("hex");
write(JSON.stringify({ salt, hash, iterations }));
console.log("Saved. Commit src/passcodeHash.ts and push to main to deploy.");
