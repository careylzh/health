// Written by scripts/set-passcode.mjs — do not edit by hand. null = the meds page is not set up.
// Only a salted PBKDF2 hash is stored; the passcode itself never enters the repo (decision 0008).
export const PASSCODE: { salt: string; hash: string; iterations: number } | null = {"salt":"429dfeb4111039f38600bf2df8124f41","hash":"cfe8d4e641c6c052feb7147c9d02a40df059afb966127d9b0bbfa6dfd18fe1dc","iterations":310000};
