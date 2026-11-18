/**
 * The meds page passcode (decision 0008). This is a curtain, not a lock: the site is static and
 * the sheet is link-readable, so it only keeps casual viewers from seeing medication names.
 */
import { PASSCODE } from "./passcodeHash";

const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");

export async function hashPasscode(code: string, salt: string, iterations: number): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(code.trim()), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode(salt), iterations }, key, 256);
  return hex(bits);
}

export const passcodeSet = () => PASSCODE !== null;

export async function checkPasscode(code: string, cfg = PASSCODE): Promise<boolean> {
  if (!cfg || !code.trim()) return false;
  return (await hashPasscode(code, cfg.salt, cfg.iterations)) === cfg.hash;
}

/** What "unlocked on this device" stores: tied to the current hash, so a new passcode re-locks. */
export const unlockToken = () => (PASSCODE ? PASSCODE.hash.slice(0, 16) : "");
