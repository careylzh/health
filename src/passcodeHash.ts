// Written by scripts/set-passcode.mjs — do not edit by hand. null = the meds page is not set up.
// Only a salted PBKDF2 hash is stored; the passcode itself never enters the repo (decision 0008).
export const PASSCODE: { salt: string; hash: string; iterations: number } | null = null;
